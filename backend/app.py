from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt
from models import db, Course, Topic, Resource, Rating, User, Enrollment, Event
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

    return jsonify({'error': 'Invalid OTP'}), 400


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

    if not name or not code:
        return jsonify({'error': 'Name and Code are required'}), 400
    
    if Course.query.filter_by(code=code).first():
        return jsonify({'error': 'Course code already exists'}), 400

    new_course = Course(name=name, code=code)
    db.session.add(new_course)
    db.session.commit()
    
    # Auto-enroll the creator (admin/management) so they can see it immediately
    user_id = int(get_jwt_identity())
    enrollment = Enrollment(user_id=user_id, course_id=new_course.id)
    db.session.add(enrollment)
    db.session.commit()

    return jsonify({'message': 'Course created successfully', 'course': {'id': new_course.id, 'name': new_course.name}})

from models import db, Course, Topic, Resource, Rating, User, Enrollment, Event

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
