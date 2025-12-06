from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt
import pandas as pd
import os
import shutil
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json

from models import db, User, Course, Topic, Resource, Enrollment, Rating, InteractionLog
# Recommender will be initialized after app creation to avoid circular imports if needed
from fetcher import ResourceFetcher

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Config
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'db.sqlite3')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Initialize Recommender and Fetcher
from recommender import HybridRecommender
recommender_system = None 

with app.app_context():
    db.create_all()
    try:
        recommender_system = HybridRecommender(db.session)
        print("ML Recommender System Initialized.")
    except Exception as e:
        print(f"Warning: ML System init failed (might be first run): {e}")

resource_fetcher = ResourceFetcher()
otp_storage = {}

# --- RBAC Helpers ---
def check_role(roles):
    claims = get_jwt()
    if claims.get('role') not in roles:
        return False
    return True

# --- Auth Routes ---

@app.route('/auth/otp/send', methods=['POST'])
def send_otp():
    data = request.json
    phone_number = data.get('phone_number')
    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400

    generated_otp = "123456" # Hardcoded for demo
    otp_storage[phone_number] = generated_otp
    print(f"OTP for {phone_number}: {generated_otp}")
    
    return jsonify({'message': 'OTP sent successfully'})

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    # Extract Fields
    username = data.get('email')
    password = data.get('password', 'password')
    otp = data.get('otp')
    phone_number = data.get('phone_number')

    if not phone_number or not otp:
         return jsonify({'error': 'Phone number and OTP are required'}), 400

    stored_otp = otp_storage.get(phone_number)
    if not stored_otp or stored_otp != otp:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 400
    
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        username=username,
        password_hash=hashed_pw,
        role='student',
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        nic=data.get('nic'),
        university=data.get('university'),
        university_course=data.get('university_course'),
        university_id=data.get('university_id'),
        phone_number=phone_number
    )
    
    db.session.add(new_user)
    db.session.commit()
    del otp_storage[phone_number]

    return jsonify({'message': 'Registration successful! Please login.'}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        token = create_access_token(
            identity=str(user.id), 
            additional_claims={'role': user.role, 'username': user.username}
        )
        return jsonify({'token': token, 'role': user.role, 'username': user.username})

    return jsonify({'error': 'Invalid credentials'}), 401

# --- Student Routes ---

@app.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    courses = Course.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'code': c.code} for c in courses])

@app.route('/enroll', methods=['POST'])
@jwt_required()
def enroll():
    user_id = int(get_jwt_identity())
    course_id = request.json.get('course_id')

    if Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first():
        return jsonify({'message': 'Already enrolled'}), 200

    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'message': 'Enrolled successfully'})

@app.route('/courses/<int:course_id>/topics', methods=['GET'])
@jwt_required()
def get_topics(course_id):
    topics = Topic.query.filter_by(course_id=course_id).all()
    return jsonify([{'id': t.id, 'name': t.name} for t in topics])

@app.route('/recommend', methods=['POST'])
@jwt_required()
def recommend():
    """Legacy Endpoint wrapping the new ML system"""
    user_id = int(get_jwt_identity())
    data = request.json
    course_id = data.get('course_id')
    topic_id = data.get('topic_id')
    
    if not topic_id:
        if not course_id:
            return jsonify({'error': 'Topid ID or Course ID required'}), 400
        # Course-level recommendations
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Get all resources for this course
        # We need to join via Topic
        query = Resource.query.join(Topic).filter(Topic.course_id == course_id)
        context_name = course.name
    else:
        topic = Topic.query.get(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        query = Resource.query.filter_by(topic_id=topic_id)
        context_name = topic.name

    # Filter by format if specified
    req_format = data.get('format')
    if req_format and req_format.strip():
        query = query.filter(Resource.format == req_format)
    
    candidates = query.all()
    
    # Safety Check: If ML system failed to load, fallback to simple rating sort
    if recommender_system is None:
        candidates.sort(key=lambda x: (sum(r.score for r in x.ratings)/len(x.ratings) if x.ratings else 0), reverse=True)
        return jsonify([r.to_dict() for r in candidates[:10]])
    
    # Use the new hybrid recommender
    recommendations = recommender_system.recommend(user_id, context_name, candidates, top_k=10)
    
    return jsonify([r.to_dict() for r in recommendations])

@app.route('/api/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations_api():
    """New GET Endpoint for recommendations"""
    user_id = int(get_jwt_identity())
    topic_id = request.args.get('topic_id')
    
    course_id = request.args.get('course_id')

    if not topic_id:
        if not course_id:
             return jsonify({'error': 'topic_id or course_id required'}), 400
        
        course = Course.query.get(course_id)
        if not course: return jsonify({'error': 'Course not found'}), 404
        
        query = Resource.query.join(Topic).filter(Topic.course_id == course_id)
        context_name = course.name
    else:
        topic = Topic.query.get(topic_id)
        if not topic:
             return jsonify({'error': 'Topic not found'}), 404
        query = Resource.query.filter_by(topic_id=topic_id)
        context_name = topic.name

    # Filter by format
    req_format = request.args.get('format')
    if req_format and req_format.strip():
        query = query.filter(Resource.format == req_format)

    candidates = query.all()
    
    # Safety Check
    if recommender_system is None:
        candidates.sort(key=lambda x: (sum(r.score for r in x.ratings)/len(x.ratings) if x.ratings else 0), reverse=True)
        return jsonify([r.to_dict() for r in candidates[:10]])
        
    recommendations = recommender_system.recommend(user_id, context_name, candidates, top_k=10)
    return jsonify([r.to_dict() for r in recommendations])

@app.route('/rate', methods=['POST'])
@jwt_required()
def rate_resource():
    user_id = int(get_jwt_identity())
    data = request.json
    resource_id = data.get('resource_id')
    score = data.get('score')
    time_spent = data.get('time_spent', 0)

    if not resource_id:
        return jsonify({'error': 'Resource ID required'}), 400
    
    rating = Rating(resource_id=resource_id, user_id=user_id, score=score if score else 0, time_spent=time_spent)
    db.session.add(rating)
    db.session.commit()
    return jsonify({'message': 'Rating submitted'})

@app.route('/api/log-interaction', methods=['POST'])
@jwt_required()
def log_interaction():
    user_id = get_jwt_identity()
    data = request.json
    
    resource_id = data.get('resource_id')
    interaction_type = data.get('type')
    meta = data.get('meta', {})
    
    log = InteractionLog(
        user_id=user_id,
        resource_id=resource_id,
        interaction_type=interaction_type,
        meta_data=json.dumps(meta)
    )
    db.session.add(log)
    
    res = Resource.query.get(resource_id)
    if res and interaction_type == 'click':
        res.click_count += 1
            
    db.session.commit()
    return jsonify({'status': 'success'})

# --- Admin Routes ---

@app.route('/api/generate-resources', methods=['POST'])
@jwt_required()
def generate_resources():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    topic_id = data.get('topic_id')
    topic = Topic.query.get(topic_id)
    if not topic: return jsonify({'error': 'Topic not found'}), 404
        
    course = Course.query.get(topic.course_id)
    
    results = resource_fetcher.auto_fetch_resources(topic.name, course.name)
    
    count = 0
    for item in results:
        if not Resource.query.filter_by(url=item['url']).first():
            new_res = Resource(
                title=item['title'],
                url=item['url'],
                format=item['format'],
                topic_id=topic.id,
                is_auto_fetched=True,
                source=item['source']
            )
            db.session.add(new_res)
            count += 1
    db.session.commit()
    
    # Update Embeddings
    for r in Resource.query.filter_by(topic_id=topic_id).all():
        if not r.embedding_vector:
            recommender_system.update_resource_embedding(r)
            
    return jsonify({'message': f'Fetch complete. Added {count} resources.'})

@app.route('/admin/my-courses', methods=['GET'])
@jwt_required()
def get_admin_courses():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    user_id = int(get_jwt_identity())
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    courses = [Course.query.get(e.course_id) for e in enrollments]
    return jsonify([{'id': c.id, 'name': c.name} for c in courses if c])

@app.route('/admin/students/<int:course_id>', methods=['GET'])
@jwt_required()
def get_students(course_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    students = []
    for e in enrollments:
        u = User.query.get(e.user_id)
        if u and u.role == 'student':
            students.append({'id': u.id, 'username': u.username})
    return jsonify(students)

@app.route('/admin/courses', methods=['POST'])
@jwt_required()
def create_course():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    name = data.get('name')
    code = data.get('code')
    
    if Course.query.filter_by(code=code).first():
        return jsonify({'error': 'Code exists'}), 400

    new_course = Course(name=name, code=code)
    db.session.add(new_course)
    db.session.commit()
    
    # Auto-enroll admin
    db.session.add(Enrollment(user_id=int(get_jwt_identity()), course_id=new_course.id))
    db.session.commit()
    return jsonify({'message': 'Course created'})

@app.route('/admin/export-data', methods=['GET'])
@jwt_required()
def export_data():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        users = User.query.all()
        courses = Course.query.all()
        topics = Topic.query.all()
        resources = Resource.query.all()
        
        # Simple export logic for brevity
        data = {
            'Users': [{'ID': u.id, 'Username': u.username, 'Role': u.role} for u in users],
            'Courses': [{'ID': c.id, 'Name': c.name} for c in courses],
            'Resources': [{'ID': r.id, 'Title': r.title, 'URL': r.url} for r in resources]
        }
        
        filename = f"export_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
        export_dir = os.path.join(basedir, 'exports')
        if not os.path.exists(export_dir): os.makedirs(export_dir)
        path = os.path.join(export_dir, filename)
        
        with pd.ExcelWriter(path, engine='openpyxl') as writer:
            for sheet, rows in data.items():
                pd.DataFrame(rows).to_excel(writer, sheet_name=sheet, index=False)
                
        return jsonify({'file_path': path, 'message': 'Export successful'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
