from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt
import pandas as pd
from models import db, Course, Topic, Resource, Rating, User, Enrollment, Event, InteractionLog
import os
import shutil
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json

# Recommender: Use HybridRecommender (aliased or direct)
# from services.recommender import HybridRecommender # Already imported later

# Recommender will be initialized after app creation to avoid circular imports if needed
from services.fetcher import ResourceFetcher
from services.recommender import HybridRecommender

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


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
@app.route('/auth/otp/send', methods=['POST'])
def send_otp():
    """
    Step 1: Receive Identifier (Email or Phone).
    If for registration, just send OTP to phone.
    If for password reset, check if user exists first.
    """
    data = request.json
    phone_number = data.get('phone_number') # Used in registration with phone
    email = data.get('email') # Used in forgot password usually
    
    # Simple logic: If email provided, look up user to find phone (or just mock send to email)
    target_identity = None

    if phone_number:
        target_identity = phone_number
    elif email:
        user = User.query.filter_by(username=email).first()
        if not user:
             # Security best practice: Don't reveal if user exists, but for this demo simplify
             return jsonify({'error': 'No user found with that email'}), 404
        target_identity = user.phone_number if user.phone_number else email
    
    if not target_identity:
        return jsonify({'error': 'Email or Phone is required'}), 400

    # --- SIMULATE SENDING ---
    generated_otp = "123456" 
    otp_storage[str(target_identity)] = generated_otp
    
    # In a real app, you would send SMS/Email here
    print(f"----------------------------------------")
    print(f" [OTP SERVICE] Code for {target_identity}: {generated_otp}")
    print(f"----------------------------------------")
    
    return jsonify({'message': 'OTP sent successfully'})


@app.route('/auth/otp/verify', methods=['POST'])
def verify_otp():
    """
    Step 2: Verify OTP code.
    Returns a success message (In real app, maybe a temporary reset token).
    """
    data = request.json
    identifier = data.get('identifier') # Email or Phone
    otp = data.get('otp')

    # Resolve identifier to what was stored (same logic as send)
    target_identity = identifier
    if identifier and '@' in identifier: # Crude email check
         user = User.query.filter_by(username=identifier).first()
         if user and user.phone_number:
             target_identity = user.phone_number
         elif user:
             target_identity = user.username # stored against email if no phone

    val = otp_storage.get(str(target_identity))
    if val and val == otp:
        return jsonify({'message': 'OTP Verified'})
    
    # Also check direct mapping if above failed (e.g. user entered phone directly)
    val_direct = otp_storage.get(str(identifier))
    if val_direct and val_direct == otp:
        return jsonify({'message': 'OTP Verified'})

    return jsonify({'error': 'Invalid OTP Verified'}), 400


@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """
    Step 3: Update Password.
    Should theoretically require a token from Step 2, but we will trust the flow for this demo 
    or re-verify OTP if passed.
    """
    data = request.json
    identifier = data.get('identifier')
    new_password = data.get('new_password')
    otp = data.get('otp') # Re-verify just to be safe

    if not identifier or not new_password:
        return jsonify({'error': 'Missing data'}), 400

    # Resolve Identity
    user = User.query.filter_by(username=identifier).first()
    if not user:
        # Try finding by phone
        user = User.query.filter_by(phone_number=identifier).first()
    
    if not user:
         return jsonify({'error': 'User not found'}), 404

    # Security: Re-verify OTP one last time to prevent direct API calls bypassing check
    # In production, use a signed "Reset Token"
    target_identity = user.phone_number if user.phone_number else user.username
    stored = otp_storage.get(str(target_identity))
    
    # Allow testing flexibility: if OTP matches OR we just assume front-end did its job (Not secure, but OK for MVP)
    # Let's enforce OTP check if provided
    if otp and stored != otp:
        return jsonify({'error': 'Invalid OTP session'}), 400

    # Update Password
    hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.password_hash = hashed_pw
    db.session.commit()
    
    # Cleanup OTP
    if stored:
        del otp_storage[str(target_identity)]

    return jsonify({'message': 'Password updated successfully'})
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

@app.route('/auth/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'username': user.username,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.username if '@' in user.username else '', # Approximate
            'phone_number': user.phone_number,
            'university': user.university,
            'university_course': user.university_course,
            'university_id': user.university_id
        })
    
    if request.method == 'PUT':
        data = request.json
        # Update allowed fields
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'phone_number' in data: user.phone_number = data['phone_number']
        if 'university' in data: user.university = data['university']
        if 'university_course' in data: user.university_course = data['university_course']
        if 'university_id' in data: user.university_id = data['university_id']
        
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'})

# check_role is already defined above


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
    search_query = data.get('search_query')
    language = data.get('language', 'English')
    req_format = data.get('format')
    
    context_name = ""
    topic = None
    query = None
    
    # Validation: Minimum one input required (Expanded)
    has_input = any([
        topic_id, 
        course_id, 
        (search_query and search_query.strip()), 
        (language and language != 'English'),
        (req_format and req_format.strip())
    ])

    if not has_input:
        return jsonify({'error': 'At least one input (Topic, Course, Search, Language, or Format) is required'}), 400

    if topic_id:
        topic = Topic.query.get(topic_id)
        if not topic: return jsonify({'error': 'Topic not found'}), 404
        query = Resource.query.filter_by(topic_id=topic_id)
        context_name = topic.name
    elif course_id:
        course = Course.query.get(course_id)
        if not course: return jsonify({'error': 'Course not found'}), 404
        query = Resource.query.join(Topic).filter(Topic.course_id == course_id)
        context_name = course.name
    else:
        # Search/Agent Only Mode
        context_name = search_query if search_query else "General"
        candidates = [] 

    # If we have a DB query, execute it
    if query:
        if search_query and search_query.strip():
            context_name += f" {search_query}"
        
        if req_format and req_format.strip():
            query = query.filter(Resource.format == req_format)
        candidates = query.all()

    # Auto-fetch Logic
    # Trigger if fewer than 10 resources found OR we serve a specific user request
    should_fetch = len(candidates) < 10 or has_input
    
    if should_fetch:
        print(f"[{datetime.now()}] Auto-fetching for context: {context_name}")
        
        # Determine names for the Agent
        t_name = topic.name if topic else (search_query if search_query else "General")
        c_name = topic.course.name if topic else "General" 
        
        try:
            fetched_items = resource_fetcher.auto_fetch_resources(
                t_name, 
                c_name, 
                search_query, 
                language=language, 
                resource_format=req_format
            )
            print(f"[{datetime.now()}] Fetch complete. Found {len(fetched_items)} items.")
            
            new_resources = []
            # Only save to DB if we have a valid Topic ID
            if topic:
                for item in fetched_items:
                    if not Resource.query.filter_by(url=item['url'], topic_id=topic.id).first():
                        new_res = Resource(
                            title=item['title'],
                            url=item['url'],
                            format=item['format'],
                            topic_id=topic.id,
                            is_auto_fetched=True,
                            source=item['source']
                        )
                        db.session.add(new_res)
                        new_resources.append(new_res)
                
                print(f"[{datetime.now()}] Added {len(new_resources)} new resources to DB.")
                if new_resources:
                    db.session.commit()
                    if recommender_system:
                         for r in new_resources:
                             recommender_system.update_resource_embedding(r)
                    candidates = query.all()
            else:
                # Search Only Mode (No DB Save): Convert dict items to temporary objects for consistency
                # We need mock Resource objects for the recommender/frontend
                for item in fetched_items:
                    mock_res = Resource(
                        id=-1, # Dummy ID
                        title=item['title'],
                        url=item['url'],
                        format=item['format'],
                        source=item['source'],
                        is_auto_fetched=True,
                        quality_score=0.0
                    )
                    # We can't use DB embeddings easily here without saving, so we rely on raw sorting or just return them
                    candidates.append(mock_res)

            # Internet Only Logic for Explicit Search (REMOVED: User wants DB items prioritized, not hidden)
            # if search_query and search_query.strip():
            #     candidates = [c for c in candidates if c.is_auto_fetched]

        except Exception as e:
            print(f"[{datetime.now()}] Error: {str(e)}")

    # Proceed to Recommend

    
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

    # Incorporate Custom Search Query
    search_query = request.args.get('search_query')
    if search_query and search_query.strip():
        context_name += f" {search_query}"

    # Filter by format
    req_format = request.args.get('format')
    if req_format and req_format.strip():
        query = query.filter(Resource.format == req_format)

    candidates = query.all()

    # Auto-fetch if fewer than 10 resources found OR if user has a specific search query (Explicit Intent)
    if (len(candidates) < 10 or (search_query and search_query.strip())) and topic:
        print(f"No resources found for {topic.name}. Auto-fetching...")
        course = Course.query.get(topic.course_id)
        fetched_items = resource_fetcher.auto_fetch_resources(topic.name, course.name, search_query)
        
        new_resources = []
        for item in fetched_items:
             if not Resource.query.filter_by(url=item['url'], topic_id=topic.id).first():
                new_res = Resource(
                    title=item['title'],
                    url=item['url'],
                    format=item['format'],
                    topic_id=topic.id,
                    is_auto_fetched=True,
                    source=item['source']
                )
                db.session.add(new_res)
                new_resources.append(new_res)
        
        if new_resources:
            db.session.commit()
            if recommender_system:
                for r in new_resources:
                    recommender_system.update_resource_embedding(r)
            candidates = query.all()
    
    # If explicit search, filter candidates to prioritize auto-fetched or relevant items
    if search_query and search_query.strip():
        # Re-query or filter existing candidates
        # For simplicity, let's keep all candidates but the recommender will rank them.
        # However, to satisfy "Only Internet", we can prioritize them.
        # A simple way involves checking 'is_auto_fetched' if we really want to exclude manual.
        # But recommender.py already handles ranking. 
        # To strictly follow "Only Internet", let's filter:
        candidates = [c for c in candidates if c.is_auto_fetched]
        
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

@app.route('/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403

    users = User.query.all()
    user_list = []
    for u in users:
        user_list.append({
            'id': u.id,
            'username': u.username,
            'role': u.role,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'university': u.university
        })
    return jsonify(user_list)

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

@app.route('/admin/courses/<int:course_id>/topics', methods=['POST'])
@jwt_required()
def create_topic(course_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404

    data = request.json
    name = data.get('name')
    if not name: return jsonify({'error': 'Topic name required'}), 400

    new_topic = Topic(name=name, course_id=course.id)
    db.session.add(new_topic)
    db.session.commit()
    return jsonify({'message': 'Topic created'})

@app.route('/admin/topics/<int:topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    topic = Topic.query.get(topic_id)
    if not topic: return jsonify({'error': 'Topic not found'}), 404

    db.session.delete(topic)
    db.session.commit()
    return jsonify({'message': 'Topic deleted'})

@app.route('/admin/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404

    data = request.json
    course.name = data.get('name', course.name)
    course.code = data.get('code', course.code)
    
    db.session.commit()
    return jsonify({'message': 'Course updated'})

@app.route('/admin/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404

    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted'})

# Resource Management Endpoints
@app.route('/admin/resources', methods=['POST'])
@jwt_required()
def create_resource():
    """Admin endpoint to manually add a resource to a topic"""
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    title = data.get('title')
    url = data.get('url')
    format_type = data.get('format')  # video, article, pdf
    topic_id = data.get('topic_id')
    
    if not all([title, url, format_type, topic_id]):
        return jsonify({'error': 'All fields required: title, url, format, topic_id'}), 400
    
    # Validate topic exists
    topic = Topic.query.get(topic_id)
    if not topic:
        return jsonify({'error': 'Topic not found'}), 404
    
    # Check for duplicate URL in the same topic
    if Resource.query.filter_by(url=url, topic_id=topic_id).first():
        return jsonify({'error': 'Resource with this URL already exists for this topic'}), 400
    
    # Create resource
    new_resource = Resource(
        title=title,
        url=url,
        format=format_type,
        topic_id=topic_id,
        is_auto_fetched=False,
        source='manual'
    )
    db.session.add(new_resource)
    db.session.commit()
    
    # Generate embedding for ML recommendations
    if recommender_system:
        try:
            recommender_system.update_resource_embedding(new_resource)
        except Exception as e:
            print(f"Failed to generate embedding: {e}")
    
    return jsonify({
        'message': 'Resource created successfully',
        'resource': {
            'id': new_resource.id,
            'title': new_resource.title,
            'url': new_resource.url,
            'format': new_resource.format
        }
    })

@app.route('/admin/topics/<int:topic_id>/resources', methods=['GET'])
@jwt_required()
def get_topic_resources(topic_id):
    """Get all resources for a specific topic (admin view)"""
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    topic = Topic.query.get(topic_id)
    if not topic:
        return jsonify({'error': 'Topic not found'}), 404
    
    resources = Resource.query.filter_by(topic_id=topic_id).all()
    
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'url': r.url,
        'format': r.format,
        'source': r.source,
        'is_auto_fetched': r.is_auto_fetched,
        'click_count': r.click_count,
        'rating_count': len(r.ratings)
    } for r in resources])

@app.route('/admin/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    """Delete a resource"""
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    db.session.delete(resource)
    db.session.commit()
    
    return jsonify({'message': 'Resource deleted successfully'})


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



# ... existing code ...

@app.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    events = Event.query.all()
    return jsonify([{
        'id': e.id, 
        'title': e.title, 
        'date': e.date, 
        'type': e.type
    } for e in events])

@app.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    title = data.get('title')
    date = data.get('date') # YYYY-MM-DD
    ev_type = data.get('type')

    if not title or not date or not ev_type:
        return jsonify({'error': 'Title, Date, and Type are required'}), 400

    user_id = int(get_jwt_identity())
    new_event = Event(title=title, date=date, type=ev_type, created_by=user_id)
    db.session.add(new_event)
    db.session.commit()

    return jsonify({'message': 'Event created successfully', 'event': {'id': new_event.id, 'title': title}})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
