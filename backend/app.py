from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt
from models import db, Course, Topic, Resource, Rating, User, Enrollment
from recommender import Recommender
import os

app = Flask(__name__)
CORS(app)

# Config
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'db.sqlite3')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this'

db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
recommender = Recommender()

# --- Auth ---
@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'student')

# --- Registration & OTP ---

# Placeholder for in-memory OTP storage (In production, use Redis or DB with expiry)
otp_storage = {} 

@app.route('/auth/otp/send', methods=['POST'])
def send_otp():
    """
    Step 1: Receive Phone Number (and optionally other details for validation)
    Send OTP to the user.
    """
    data = request.json
    phone_number = data.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400

    # --- SPACE FOR SMS API INTEGRATION ---
    # TODO: Call your SMS Gateway API here
    # Example: send_sms(phone_number, generated_otp)
    
    generated_otp = "123456" # Hardcoded for demo/testing. Replace with random generation.
    # -------------------------------------
    
    otp_storage[phone_number] = generated_otp
    print(f"OTP for {phone_number}: {generated_otp}") # Log it for testing
    
    return jsonify({'message': 'OTP sent successfully'})


@app.route('/auth/register', methods=['POST'])
def register():
    """
    Step 2: Verify OTP and Create User
    """
    data = request.json
    
    # Extract Fields
    username = data.get('email') # Using email as username
    password = data.get('password', 'password') # Default or prompt for password
    otp = data.get('otp')
    
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    nic = data.get('nic')
    university = data.get('university')
    university_course = data.get('university_course')
    university_id = data.get('university_id')
    phone_number = data.get('phone_number')

    if not phone_number or not otp:
         return jsonify({'error': 'Phone number and OTP are required'}), 400

    # Verify OTP
    stored_otp = otp_storage.get(phone_number)
    if not stored_otp or stored_otp != otp:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User with this email already exists'}), 400
    
    # Create User
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        username=username,
        password_hash=hashed_pw,
        role='student', # Default role
        first_name=first_name,
        last_name=last_name,
        nic=nic,
        university=university,
        university_course=university_course,
        university_id=university_id,
        phone_number=phone_number
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Clear OTP
    del otp_storage[phone_number]

    return jsonify({'message': 'Registration successful! Please login.'}), 201


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        # Identity must be a string in JWT (sub claim)
        token = create_access_token(
            identity=str(user.id), 
            additional_claims={'role': user.role, 'username': user.username}
        )
        return jsonify({'token': token, 'role': user.role, 'username': user.username})

    return jsonify({'error': 'Invalid credentials'}), 401

# --- RBAC Helpers ---
def check_role(roles):
    claims = get_jwt() # Access custom claims
    if claims['role'] not in roles:
        return False
    return True

# --- User Endpoints ---
@app.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    courses = Course.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'code': c.code} for c in courses])

@app.route('/enroll', methods=['POST'])
@jwt_required()
def enroll():
    user_id = int(get_jwt_identity()) # Convert sub string back to int
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
    user_id = int(get_jwt_identity())
    data = request.json
    course_id = data.get('course_id')
    topic_id = data.get('topic_id')
    fmt = data.get('format')

    if not course_id or not topic_id:
        return jsonify({'error': 'Course ID and Topic ID are required'}), 400

    recommendations = recommender.get_recommendations(course_id, topic_id, fmt, user_id=user_id)
    return jsonify(recommendations)

@app.route('/rate', methods=['POST'])
@jwt_required()
def rate_resource():
    user_id = int(get_jwt_identity())
    data = request.json
    resource_id = data.get('resource_id')
    score = data.get('score')
    time_spent = data.get('time_spent', 0)

    # Validate inputs
    if not resource_id or (not score and not time_spent):
        return jsonify({'error': 'Resource ID and either Score or Time Spent are required'}), 400
    
    if score and not (1 <= score <= 5):
        return jsonify({'error': 'Score must be between 1 and 5'}), 400

    new_rating = Rating(resource_id=resource_id, user_id=user_id, score=score if score else 0, time_spent=time_spent)
    db.session.add(new_rating)
    db.session.commit()

    return jsonify({'message': 'Rating submitted successfully'})

# --- Admin/Management Endpoints ---
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
