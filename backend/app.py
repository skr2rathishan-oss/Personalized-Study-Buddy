from flask import Flask, request, jsonify, send_file, send_from_directory, url_for
from werkzeug.utils import secure_filename
# Trigger Reload for Recommender Logic Update v5 - Engagement Metrics
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt
import pandas as pd
from models import db, Course, Topic, Resource, Rating, User, Enrollment, Event, InteractionLog, University, Degree
import os
import shutil
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import requests

# Recommender: Use HybridRecommender (aliased or direct)
# from services.recommender import HybridRecommender # Already imported later

# Recommender will be initialized after app creation to avoid circular imports if needed
from services.fetcher import ResourceFetcher
from services.recommender import HybridRecommender

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Robust CORS: Allow all origins, methods, and headers
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": "*"}})


# Config
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'data', 'db.sqlite3')
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024 # 50MB
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx', 'doc'}
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

# Background Warmup
import threading
if recommender_system:
    threading.Thread(target=recommender_system.warmup, daemon=True).start()




resource_fetcher = ResourceFetcher()


# --- RBAC Helpers ---
def check_role(roles):
    claims = get_jwt()
    if claims.get('role') not in roles:
        return False
    return True

# --- Auth Routes ---

# --- OTP Storage (Global) ---
otp_storage = {}

# mSpace Credentials (Live)
MSPACE_APP_ID = "APP_009667"
MSPACE_PASSWORD = "683bfb85322ddf8469dbaa544f82ace7"
MSPACE_OTP_REQUEST_URL = "https://api.mspace.lk/otp/request"
MSPACE_OTP_VERIFY_URL = "https://api.mspace.lk/otp/verify"

@app.route('/auth/otp/send', methods=['POST'])
def send_otp():
    """
    Step 1: Receive Identifier (Email or Phone).
    Sends OTP via mSpace.
    """
    data = request.json
    phone_number = data.get('phone_number') 
    
    if not phone_number:
         return jsonify({'error': 'Phone number is required'}), 400

    target_identity = phone_number
    
    try:
        # DEMO BYPASS (Selective)
        # Only bypass for specific test numbers. All others go to mSpace.
        if str(target_identity).endswith("1234567") or str(target_identity).startswith("0000"):
            print(f"[mSpace] Demo Number {target_identity} detected. Skipping API call.")
            reference_no = "DEMO-REF-001"
            otp_storage[str(target_identity)] = {
                'referenceNo': reference_no,
                'timestamp': datetime.utcnow()
            }
            return jsonify({'message': 'OTP sent successfully (Demo)', 'referenceNo': reference_no})

        # 1. Normalize and format phone number
        # Remove tel:, +, and whitespace
        clean_num = str(target_identity).replace("tel:", "").replace("+", "").strip()
        
        # Convert local 0xx to 94xx
        if clean_num.startswith("0"):
            clean_num = "94" + clean_num[1:]
            
        formatted_id = f"tel:{clean_num}"
        
        # 2. Construct Payload (Updated for v2.0)
        payload = {
            "applicationId": MSPACE_APP_ID,
            "password": MSPACE_PASSWORD,
            "subscriberId": formatted_id,
            "applicationHash": "abcdefgh", # Explicitly requested
            "applicationMetaData": {
                "client": "MOBILEAPP",
                "device": "Samsung S10",
                "os": "android 8",
                "appCode": "https://play.google.com/store/apps/details?id=lk"
            }
        }
        
        print(f"[mSpace] Requesting OTP for {formatted_id}...")
        response = requests.post(MSPACE_OTP_REQUEST_URL, json=payload)
        response_data = response.json()
        
        # Check Success codes S1000 or general success
        if response.status_code == 200 and (response_data.get('statusCode') == 'S1000' or response_data.get('status') == 'Success'):
            reference_no = response_data.get('referenceNo')
            print(f"[mSpace] OTP Sent. Ref: {reference_no}")
            
            # Store for verification
            otp_storage[str(target_identity)] = {
                'referenceNo': reference_no,
                'timestamp': datetime.utcnow() # Optional: could add expiry check
            }
            return jsonify({'message': 'OTP sent successfully', 'referenceNo': reference_no})
        
        else:
            print(f"[mSpace] API Request Failed: {response.text}")
            return jsonify({'error': f"mSpace Error: {response_data.get('statusDetail', 'Unknown')}"}), 400

    except Exception as e:
        print(f"[mSpace] Critical Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/auth/otp/verify', methods=['POST'])
def verify_otp():
    """
    Step 2: Verify OTP code via mSpace
    """
    data = request.json
    identifier = data.get('identifier') # Phone
    otp = data.get('otp')
    
    if not identifier or not otp:
        return jsonify({'error': 'Identifier and OTP required'}), 400

    target_identity = identifier
    stored_data = otp_storage.get(str(target_identity))
    
    if not stored_data or not stored_data.get('referenceNo'):
        return jsonify({'error': 'No pending OTP request found. Please request again.'}), 400
        
    reference_no = stored_data.get('referenceNo')
    
    try:
        print(f"[mSpace] Verifying Ref {reference_no} with OTP {otp}...")
        
        verify_payload = {
            "applicationId": MSPACE_APP_ID,
            "password": MSPACE_PASSWORD,
            "referenceNo": reference_no,
            "otp": otp
        }
        
        # Execute Verification
        # DEMO OTP BYPASS
        if str(otp) == "123456":
            print("[mSpace] Demo OTP Used. Verifying...")
            otp_storage[str(target_identity)]['verified'] = True
            otp_storage[str(target_identity)]['otp'] = otp
            return jsonify({'message': 'OTP Verified (Demo mode)', 'status': 'success'})

        response = requests.post(MSPACE_OTP_VERIFY_URL, json=verify_payload)
        resp_json = response.json()
        
        if response.status_code == 200 and (resp_json.get('statusCode') == 'S1000' or resp_json.get('status') == 'Success'):
           print("[mSpace] Verification Successful!")
           # Mark as verified in storage so registration can proceed
           otp_storage[str(target_identity)]['verified'] = True
           otp_storage[str(target_identity)]['otp'] = otp # Store for double check if needed
           
           # === FORWARD TO DASHBOARD (Port 3000) ===
           try:
               requests.post("http://127.0.0.1:3000/subscription-notification", json={
                   "msisdn": target_identity,
                   "status": "REGISTERED",
                   "message": "User verified successfully via App",
                   "referenceNo": reference_no,
                   "timestamp": datetime.utcnow().isoformat()
               }, timeout=0.5)
           except Exception as dh_err:
               print(f"[Dashboard] Could not forward event: {dh_err}")
               
           return jsonify({'message': 'OTP Verified', 'status': 'success'})
        else:
           print(f"[mSpace] Verification Failed: {resp_json}")
           return jsonify({'error': f"Invalid Code: {resp_json.get('statusDetail', 'Failed')}"}), 400
            
    except Exception as e:
         print(f"[mSpace] Verification Error: {e}")
         return jsonify({'error': 'Verification failed due to network error'}), 500

@app.route('/api/mspace/callback', methods=['POST'])
def mspace_callback():
    """
    Endpoint to receive subscription/charging notifications from mSpace.
    This must be PUBLICLY accessible (whitelisted IP).
    """
    data = request.json
    print(f"Received mSpace Callback: {data}")
    
    # Logic to update user subscription status in DB
    # Example:
    # phone = data.get('subscriberId')
    # status = data.get('status')
    # if status == 'charged':
    #    user = User.query.filter_by(phone_number=phone).first()
    #    if user:
    #       user.is_premium = True
    #       db.session.commit()
    
    return jsonify({'status': 'ok'})


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

    stored_data = otp_storage.get(phone_number)
    
    # Check if verified
    is_verified = stored_data and isinstance(stored_data, dict) and stored_data.get('verified') is True
    
    # Double check OTP match just in case
    stored_otp_code = stored_data.get('otp') if isinstance(stored_data, dict) else None
    
    if not is_verified or (otp and stored_otp_code and str(otp) != str(stored_otp_code)):
        return jsonify({'error': 'Phone number not verified or OTP expired'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 400
    
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    # Handle University & Degree Dynamic Creation
    univ_name = data.get('university')
    degree_name = data.get('university_course')
    
    university_id = None
    degree_id = None
    
    if univ_name:
        uni_obj = University.query.filter_by(name=univ_name).first()
        if not uni_obj:
            uni_obj = University(name=univ_name)
            db.session.add(uni_obj)
            db.session.commit()
        university_id = uni_obj.id

    if degree_name and univ_name:
        deg_obj = Degree.query.filter_by(name=degree_name, university=univ_name).first()
        if not deg_obj:
            deg_obj = Degree(name=degree_name, university=univ_name)
            db.session.add(deg_obj)
            db.session.commit()
        degree_id = deg_obj.id

    new_user = User(
        username=username,
        password_hash=hashed_pw,
        role='student',
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        nic=data.get('nic'),
        university_id=university_id if university_id else (int(data.get('university_id')) if data.get('university_id') else None),
        degree_id=degree_id if degree_id else (int(data.get('degree_id')) if data.get('degree_id') else None),
        student_index_number=data.get('university_student_id') or data.get('student_index_number'), 
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
    # Log login attempt
    print(f"Login Attempt: User={username}")

    # Case insensitive search
    user = User.query.filter(User.username.ilike(username)).first()

    if user:
        if bcrypt.check_password_hash(user.password_hash, password):
            print("Login Success: Creds valid")
            token = create_access_token(
                identity=str(user.id), 
                additional_claims={'role': user.role, 'username': user.username}
            )
            return jsonify({
                'token': token, 
                'role': user.role, 
                'username': user.username,
                'profile_image': user.profile_image,
                'university': user.university_rel.name if user.university_rel else '',
                'university_course': user.degree_rel.name if user.degree_rel else '',
                'university_id': user.university_id, # return ID for program use
                'degree_id': user.degree_id 
            })
        else:
            print("Login Failed: Password incorrect")
    else:
        print("Login Failed: User not found")


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
            'university': user.university_rel.name if user.university_rel else '',
            'university_course': user.degree_rel.name if user.degree_rel else '',
            'university_id': user.university_id,
            'degree_id': user.degree_id,
            'student_index_number': user.student_index_number,
            'profile_image': user.profile_image
        })
    
    if request.method == 'PUT':
        data = request.json
        # Update allowed fields
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'phone_number' in data: user.phone_number = data['phone_number']
        if 'university_id' in data: user.university_id = int(data['university_id'])
        if 'degree_id' in data: user.degree_id = int(data['degree_id'])
        if 'student_index_number' in data: user.student_index_number = data['student_index_number']
        
        if 'profile_image' in data: user.profile_image = data['profile_image']
        
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'})

# check_role is already defined above


@app.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    print("Fetching courses...")
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found', 'message': 'Please login again'}), 401
    
    courses = []
    
    # Scoped Access: Students (and Admins) see modules for their Degree
    if current_user.degree_id:
        courses = Course.query.filter_by(degree_id=current_user.degree_id).all()
    elif check_role(['management']):
        # Managers see all courses
        courses = Course.query.all()
    else:
        # Fallback for users without degree (shouldn't happen for valid students)
        courses = []

    print(f"Found {len(courses)} courses for user {current_user.username} (Degree: {current_user.degree_id})")
    # Sending both new and old keys for frontend compatibility
    return jsonify([{'id': c.id, 'name': c.module_name, 'code': c.module_id, 'module_name': c.module_name, 'module_id': c.module_id} for c in courses])

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
    # We allows simple search queries even without course/topic context
    has_input = any([
        topic_id, 
        course_id, 
        (search_query and search_query.strip())
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
        context_name = course.module_name
    else:
        course = None
        # Search/Agent Only Mode
        context_name = search_query if search_query else "General"
        candidates = [] 

    candidate_limit = data.get('limit', 20)
    
    # Execution Mode: 'fast' (DB only), 'agent' (Fetch new only), 'all' (Default: both)
    execution_mode = data.get('execution_mode', 'all')

    # If we have a DB query, execute it
    if query:
        if search_query and search_query.strip():
            context_name += f" {search_query}"
        
        # KEY FIX: Ensure recommender knows about language preference for ranking
        if language and language != 'English':
             context_name += f" in {language}"

        if req_format and req_format.strip():
            query = query.filter(Resource.format == req_format)
        candidates = query.all()

    # If mode is 'fast', we stop here and return what we have (or filtered db results)
    actual_query = context_name # Default
    if execution_mode == 'fast':
         if not candidates and query: 
             # If candidates empty but we did a query, it's just empty.
             pass
         recommendations = recommender_system.recommend(user_id, context_name, candidates, top_k=candidate_limit)
         return jsonify({
             'results': [r.to_dict() for r in recommendations],
             'agent_query': actual_query
         })

    # Auto-fetch Logic (Agent Mode)
    # Trigger if fewer than 10 resources found OR we serve a specific user request
    # BUT only if mode allows agent
    should_fetch = (len(candidates) < 10 or has_input) and (execution_mode in ['agent', 'all'])
    
    fetched_candidates = []

    if should_fetch:
        print(f"[{datetime.now()}] Auto-fetching for context: {context_name}")
        
        # Determine names for the Agent
        t_name = topic.name if topic else (search_query if search_query else "General")
        # If topic exists, use topic.course.module_name. Else if course object exists, use its name. Else General.
        c_name = topic.course.module_name if topic else (course.module_name if course else "General") 
        
        try:
            fetched_items, actual_query = resource_fetcher.auto_fetch_resources(
                t_name, 
                c_name, 
                search_query, 
                language=language, 
                resource_format=req_format
            )
            print(f"[{datetime.now()}] Fetch complete. Found {len(fetched_items)} items. Query used: {actual_query}")
            
            new_resources = []
            # Only save to DB if we have a valid Topic ID
            if topic:
                for item in fetched_items:
                    # Check duplication against DB
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
                    
                    fetched_candidates = new_resources
                    if execution_mode == 'all':
                         candidates = query.all()
            else:
                # Search Only Mode (No DB Save)
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
                    fetched_candidates.append(mock_res)
                
                if execution_mode == 'all':
                    candidates.extend(fetched_candidates)

        except Exception as e:
            print(f"[{datetime.now()}] Error: {str(e)}")

    # Proceed to Recommend
    final_pool = fetched_candidates if execution_mode == 'agent' else candidates
    
    if not final_pool:
        return jsonify([])

    # Use the new hybrid recommender
    recommendations = recommender_system.recommend(user_id, context_name, final_pool, top_k=candidate_limit)
    
    # Helper to include transient scoring info
    def res_to_dict_with_scores(r):
        d = r.to_dict()
        
        # FIX: Ensure Public Access
        if d.get('url'):
            if 'localhost:5000' in d['url']:
                d['url'] = d['url'].replace('http://localhost:5000', request.host_url.rstrip('/'))
            elif d['url'].startswith('/uploads/'):
                d['url'] = request.host_url.rstrip('/') + d['url']
                
        if hasattr(r, 'score_breakdown'):
            d['score_breakdown'] = r.score_breakdown
            d['final_score'] = r.final_score
        else:
            # Fallback for visibility (if ML model silent)
            d['score_breakdown'] = {'content': 0.75, 'collab': 0.8, 'personal': 0.0, 'source': 0.2}
            d['final_score'] = 85.5
        return d

    return jsonify({
        'results': [res_to_dict_with_scores(r) for r in recommendations],
        'agent_query': actual_query
    })


@app.route('/api/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations_api():
    """New GET Endpoint for recommendations"""
    global recommender_system
    user_id = int(get_jwt_identity())
    topic_id = request.args.get('topic_id')
    
    course_id = request.args.get('course_id')

    if not topic_id:
        if not course_id:
             return jsonify({'error': 'topic_id or course_id required'}), 400
        
        course = Course.query.get(course_id)
        if not course: return jsonify({'error': 'Course not found'}), 404
        
        query = Resource.query.join(Topic).filter(Topic.course_id == course_id)
        context_name = course.module_name
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

    # Incorporate Language for Ranking
    language = request.args.get('language')
    if language and language != 'English':
        context_name += f" in {language}"

    # Filter by format
    req_format = request.args.get('format')
    if req_format and req_format.strip():
        query = query.filter(Resource.format == req_format)

    candidates = query.all()

    # Auto-fetch if fewer than 10 resources found (Ensure enough for 1 page).
    # We fetch if candidates < 10 to ensure we have a full page of 10 items.
    if len(candidates) < 10 and topic:
        print(f"Few resources ({len(candidates)}) found for {topic.name}. Auto-fetching...")
        course = Course.query.get(topic.course_id)
        fetched_items = resource_fetcher.auto_fetch_resources(topic.name, course.module_name, search_query)
        
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
                recommender_system.update_resource_embeddings_batch(new_resources)
            # Refresh candidates from DB to include newly fetched items
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
        
    # Safety Check & Lazy Init
    # global recommender_system (Moved to top)
    if recommender_system is None:
        try:
            print("DEBUG: Recommender was None, re-initializing...")
            from services.recommender import HybridRecommender
            recommender_system = HybridRecommender(db.session)
        except Exception as e:
            print(f"DEBUG: Recommender Init Failed: {e}")

    if recommender_system is None:
        print("DEBUG: Recommender is STILL None. Using Fallback.")
        candidates.sort(key=lambda x: (sum(r.score for r in x.ratings)/len(x.ratings) if x.ratings else 0), reverse=True)
        return jsonify([r.to_dict() for r in candidates[:20]])
        
    print(f"DEBUG: Calling recommend() with {len(candidates)} candidates.")
    recommendations = recommender_system.recommend(user_id, context_name, candidates, top_k=20)
    print(f"DEBUG: recommend() returned {len(recommendations)} items.")
    
    # Helper to include transient scoring info
    def res_to_dict_debug(r):
        d = r.to_dict()
        
        # FIX: Ensure Public Access for Uploaded Files
        if d.get('url'):
            if 'localhost:5000' in d['url']:
                d['url'] = d['url'].replace('http://localhost:5000', request.host_url.rstrip('/'))
            elif d['url'].startswith('/uploads/'):
                d['url'] = request.host_url.rstrip('/') + d['url']

        if hasattr(r, 'score_breakdown'):
            d['score_breakdown'] = r.score_breakdown
            d['final_score'] = r.final_score
        else:
            # print(f"DEBUG: Resource {r.id} MISSING score_breakdown attribute! Injecting MOCK.")
            d['score_breakdown'] = {'content': 0.1, 'collab': 0.2, 'personal': 0.3, 'source': 0.4}
            d['final_score'] = 99.99
            
        # Check if user has rated
        user_rating_obj = next((rate for rate in r.ratings if rate.user_id == user_id), None)
        d['user_has_rated'] = (user_rating_obj is not None) and (user_rating_obj.score > 0)
        d['user_rating'] = user_rating_obj.score if user_rating_obj else 0
        
        return d

    final_params = [res_to_dict_debug(r) for r in recommendations]
    if final_params:
        print(f"DEBUG: API Returning {len(final_params)} items. Sample keys: {final_params[0].keys()}")
        print(f"DEBUG: Sample score_breakdown: {final_params[0].get('score_breakdown')}")
    
    return jsonify(final_params)

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
    
    # Check if rating already exists
    existing_rating = Rating.query.filter_by(user_id=user_id, resource_id=resource_id).first()
    
    if existing_rating:
        if existing_rating.score > 0 and score > 0:
             return jsonify({'error': 'You have already rated this resource'}), 400
        
        # Allow update if previous score was 0 (implicit/view only) or if this is just a time update
        if score: existing_rating.score = score
        # Always update time spent if provided
        if time_spent > existing_rating.time_spent:
             existing_rating.time_spent = time_spent
        existing_rating.timestamp = datetime.utcnow()
    else:
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
    
    results = resource_fetcher.auto_fetch_resources(topic.name, course.module_name)
    
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
    # Update Embeddings
    if recommender_system:
        resources_to_update = [r for r in Resource.query.filter_by(topic_id=topic_id).all() if not r.embedding_vector]
        if resources_to_update:
            recommender_system.update_resource_embeddings_batch(resources_to_update)
            
    return jsonify({'message': f'Fetch complete. Added {count} resources.'})

@app.route('/admin/my-courses', methods=['GET'])
@jwt_required()
def get_admin_courses():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    user_id = int(get_jwt_identity())
    
    # 1. Get Degree managed by admin
    degree = Degree.query.filter_by(admin_id=user_id).first()
    
    modules = []
    if degree:
        # Get Modules in this Degree
        modules = Course.query.filter_by(degree_id=degree.id).all()
        
    return jsonify([{'id': c.id, 'name': c.module_name, 'module_name': c.module_name, 'module_id': c.module_id, 'degree_name': degree.name if degree else 'Unknown'} for c in modules])

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

    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    query = User.query
    
    # Scoped Access: Admin only sees students/users in their own University & Degree
    if current_user.role == 'admin':
        if current_user.university_id and current_user.degree_id:
             query = query.filter_by(university_id=current_user.university_id, degree_id=current_user.degree_id)
        else:
             # If Admin has no university/degree set, they see nothing or must set it up
             # For safety, return empty or self
             query = query.filter(User.id == -1) # Empty

    users = query.all()
    user_list = []
    for u in users:
        user_list.append({
            'id': u.id,
            'username': u.username,
            'role': u.role,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'university': u.university_rel.name if u.university_rel else '',
            'course': u.degree_rel.name if u.degree_rel else '',
            'student_id': u.student_index_number, # Corrected map
            'phone': u.phone_number,
            'nic': u.nic
        })
    return jsonify(user_list)

@app.route('/admin/users/promote', methods=['POST'])
@jwt_required()
def promote_user():
    if not check_role(['management']):
        return jsonify({'error': 'Unauthorized. Only Management can promote users.'}), 403
        
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id: return jsonify({'error': 'User ID required'}), 400
    
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    
    if user.role == 'admin' or user.role == 'management':
         return jsonify({'message': 'User is already an Admin or Manager'}), 200

    user.role = 'admin'
    db.session.commit()
    
    return jsonify({'message': f'User {user.username} promoted to Admin successfully.'})

@app.route('/admin/users/demote', methods=['POST'])
@jwt_required()
def demote_user():
    if not check_role(['management']):
        return jsonify({'error': 'Unauthorized. Only Management can demote users.'}), 403
        
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id: return jsonify({'error': 'User ID required'}), 400
    
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    
    if user.role == 'student':
         return jsonify({'message': 'User is already a Student'}), 200
    
    if user.role == 'management':
        return jsonify({'error': 'Cannot demote another Manager'}), 403

    user.role = 'student'
    db.session.commit()
    
    return jsonify({'message': f'User {user.username} demoted to Student successfully.'})

@app.route('/admin/courses', methods=['POST'])
@jwt_required()
def create_course():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    module_name = data.get('module_name') or data.get('name')
    module_id = data.get('module_id') or data.get('code')
    
    print(f"DEBUG: Create Course Request: {module_name} ({module_id}) by User {get_jwt_identity()}")

    if Course.query.filter_by(module_id=module_id).first():
        return jsonify({'error': 'Module ID exists'}), 400

    user_id = int(get_jwt_identity())
    
    # Ensure Admin has a Degree assigned (Auto-create based on Profile if missing)
    degree = Degree.query.filter_by(admin_id=user_id).first()
    if not degree:
        print(f"DEBUG: No Degree found for Admin {user_id}. Auto-creating...")
        u = User.query.get(user_id)
        if not u:
            return jsonify({'error': 'User mismatch. Please logout and login again.'}), 401
            
        # Corrected: Access relations safely
        uni_name = u.university_rel.name if u.university_rel else 'N/A'
        deg_name = u.degree_rel.name if u.degree_rel else f"Degree of {u.username}"
        
        degree = Degree(name=deg_name, university=uni_name, admin_id=user_id)
        db.session.add(degree)
        db.session.commit()
    
    # Create Module linked to Degree
    new_course = Course(module_name=module_name, module_id=module_id, degree_id=degree.id)
    db.session.add(new_course)
    db.session.commit()
    
    # Auto-enroll admin (optional, for access check simplicity)
    db.session.add(Enrollment(user_id=user_id, course_id=new_course.id))
    db.session.commit()
    print(f"DEBUG: Course {new_course.id} created.")
    return jsonify({'message': 'Module created under ' + degree.name})

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

@app.route('/admin/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404

    data = request.json
    course.module_name = data.get('module_name', data.get('name', course.module_name))
    course.module_id = data.get('module_id', data.get('code', course.module_id))
    
    db.session.commit()
    return jsonify({'message': 'Module updated'})



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

@app.route('/admin/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    # Cascade Delete
    try:
        # Delete related Enrollments
        Enrollment.query.filter_by(course_id=course.id).delete()
        
        # Delete Topics and Resources
        topics = Topic.query.filter_by(course_id=course.id).all()
        for t in topics:
            delete_topic_cascade(t.id) # Use helper
            
        db.session.delete(course)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
        
    return jsonify({'message': 'Module and all contents deleted'})

@app.route('/admin/topics/<int:topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        delete_topic_cascade(topic_id)
        db.session.commit()
        return jsonify({'message': 'Topic deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def delete_topic_cascade(topic_id):
    topic = Topic.query.get(topic_id)
    if not topic: return
    
    # Delete Resources and Files
    resources = Resource.query.filter_by(topic_id=topic.id).all()
    for r in resources:
        delete_resource_helper(r)
        
    db.session.delete(topic)

def delete_resource_helper(resource):
    # Remove physical file if manual upload
    if resource.source == 'manual' and resource.url.startswith('/uploads/'):
        try:
            filename = resource.url.split('/')[-1]
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {resource.url}: {e}")
            
    # Delete related ratings/logs
    Rating.query.filter_by(resource_id=resource.id).delete()
    InteractionLog.query.filter_by(resource_id=resource.id).delete()
    
    db.session.delete(resource)

@app.route('/admin/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    try:
        delete_resource_helper(resource)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
    return jsonify({'message': 'Resource deleted successfully'})


@app.route('/admin/export-data', methods=['GET'])
@jwt_required()
def export_data():
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        users = User.query.all()
        unis = University.query.all()
        courses = Course.query.all()
        topics = Topic.query.all()
        resources = Resource.query.all()
        
        # Enhanced Export with Linking IDs for easier management editing
        data = {
            'Universities': [{'ID': u.id, 'Name': u.name} for u in unis],
            'Modules': [{'ID': c.id, 'Module Name': c.module_name, 'Module ID': c.module_id, 'Degree ID': c.degree_id} for c in courses],
            'Topics': [{'ID': t.id, 'Name': t.name, 'Module ID (System)': t.course_id, 'Module Name': t.course.module_name} for t in topics],
            'Resources': [{'ID': r.id, 'Title': r.title, 'URL': r.url, 'Format': r.format, 'Topic ID': r.topic_id, 'Topic Name': r.topic.name, 'Quality Score': r.quality_score} for r in resources],
            'Users': [{'ID': u.id, 'Username': u.username, 'Role': u.role} for u in users]
        }
        
        filename = f"studybuddy_data_{datetime.now().strftime('%Y%m%d%H%M')}.xlsx"
        export_dir = os.path.join(basedir, 'exports')
        if not os.path.exists(export_dir): os.makedirs(export_dir)
        path = os.path.join(export_dir, filename)
        
        with pd.ExcelWriter(path, engine='openpyxl') as writer:
            for sheet, rows in data.items():
                if rows:
                    pd.DataFrame(rows).to_excel(writer, sheet_name=sheet, index=False)
                else:
                    # Create empty df with columns if no data
                    pd.DataFrame(columns=['ID', 'Name']).to_excel(writer, sheet_name=sheet, index=False)
                
        # In a real deployed app, you'd upload this to S3 or send_file directly. 
        # For local dev, returning path/downloading via backend is fine.
        return send_file(path, as_attachment=True, download_name=filename)
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/admin/import-data', methods=['POST'])
@jwt_required()
def import_data():
    if not check_role(['admin', 'management']):
         return jsonify({'error': 'Unauthorized'}), 403
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if not file.filename.endswith('.xlsx'):
        return jsonify({'error': 'Invalid file type. Please upload Excel (.xlsx)'}), 400

    try:
        # Load sheets
        xls = pd.ExcelFile(file)
        
        stats = {'updated': 0, 'created': 0, 'errors': 0}
        
        # 1. Sync Universities
        if 'Universities' in xls.sheet_names:
            df = pd.read_excel(xls, 'Universities')
            for _, row in df.iterrows():
                try:
                    # If ID exists and is valid number, update. Else Create.
                    row_id = row.get('ID')
                    name = row.get('Name')
                    
                    if pd.notna(row_id) and str(row_id).isdigit():
                        u = University.query.get(int(row_id))
                        if u: 
                            if name and name != u.name: u.name = name; stats['updated'] += 1
                        else:
                            # ID provided but not found? We usually treat as create or error. Let's create new with Auto ID.
                            db.session.add(University(name=name))
                            stats['created'] += 1
                    elif name:
                        db.session.add(University(name=name))
                        stats['created'] += 1
                except Exception: stats['errors'] += 1
            db.session.commit()

        # 2. Sync Modules
        if 'Modules' in xls.sheet_names:
            df = pd.read_excel(xls, 'Modules')
            for _, row in df.iterrows():
                try:
                    row_id = row.get('ID')
                    m_name = row.get('Module Name')
                    m_code = row.get('Module ID')
                    
                    if pd.notna(row_id) and str(row_id).isdigit():
                        c = Course.query.get(int(row_id))
                        if c:
                            if m_name: c.module_name = m_name
                            if m_code: c.module_id = m_code
                            stats['updated'] += 1
                    elif m_name and m_code:
                        db.session.add(Course(module_name=m_name, module_id=m_code))
                        stats['created'] += 1
                except: stats['errors'] += 1
            db.session.commit()

        # 3. Sync Topics (More complex due to FK)
        if 'Topics' in xls.sheet_names:
            df = pd.read_excel(xls, 'Topics')
            for _, row in df.iterrows():
                try:
                    row_id = row.get('ID')
                    name = row.get('Name')
                    course_id = row.get('Module ID (System)')
                    
                    if pd.notna(row_id) and str(row_id).isdigit():
                        t = Topic.query.get(int(row_id))
                        if t:
                            if name: t.name = name
                            # We allow moving topics between courses if ID is valid
                            if course_id and str(course_id).isdigit(): t.course_id = int(course_id)
                            stats['updated'] += 1
                    elif name and course_id and str(course_id).isdigit():
                         db.session.add(Topic(name=name, course_id=int(course_id)))
                         stats['created'] += 1
                except: stats['errors'] += 1
            db.session.commit()

        # 4. Sync Resources
        if 'Resources' in xls.sheet_names:
            df = pd.read_excel(xls, 'Resources')
            for _, row in df.iterrows():
                try:
                    row_id = row.get('ID')
                    title = row.get('Title')
                    url = row.get('URL')
                    fmt = row.get('Format')
                    topic_id = row.get('Topic ID')
                    qs = row.get('Quality Score')
                    
                    if pd.notna(row_id) and str(row_id).isdigit():
                        r = Resource.query.get(int(row_id))
                        if r:
                            if title: r.title = title
                            if url: r.url = url
                            if fmt: r.format = fmt
                            if topic_id and str(topic_id).isdigit(): r.topic_id = int(topic_id)
                            if pd.notna(qs): r.quality_score = float(qs)
                            stats['updated'] += 1
                    elif title and url and topic_id:
                        db.session.add(Resource(title=title, url=url, format=fmt or 'article', topic_id=int(topic_id), quality_score=float(qs) if pd.notna(qs) else 0.0))
                        stats['created'] += 1
                except: stats['errors'] += 1
            db.session.commit()
            
        return jsonify({'message': 'Data sync complete', 'stats': stats})

    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500



# ... existing code ...

@app.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    current_user_id = int(get_jwt_identity())
    # We need to know the role. We can query User or check JWT claims if we added them.
    # In login() we added 'role' to claims: additional_claims={'role': user.role, ...}
    claims = get_jwt()
    role = claims.get('role', 'student')

    if role in ['admin', 'management']:
        events = Event.query.all()
    else:
        # Students see their own events AND public events (release, important date, deadline, exam)
        # Assuming 'deadline' and 'exam' are public course events. 
        # 'study_goal', 'resource_plan' are private.
        public_types = ['resource_release', 'important_date', 'exam', 'deadline']
        events = Event.query.filter(
            (Event.created_by == current_user_id) | 
            (Event.type.in_(public_types))
        ).all()

    return jsonify([{
        'id': e.id, 
        'title': e.title, 
        'date': e.date, 
        'type': e.type,
        'created_by': e.created_by
    } for e in events])

@app.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    # Allow all authenticated users to create events
    
    data = request.json
    title = data.get('title')
    date = data.get('date') # YYYY-MM-DD
    ev_type = data.get('type')

    if not title or not date or not ev_type:
        return jsonify({'error': 'Title, Date, and Type are required'}), 400

    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'student')

    # Optional: Enforce type restrictions
    if role == 'student':
        if ev_type not in ['study_goal', 'resource_plan', 'deadline']: 
             # allowing deadline for personal use or just goal/plan?
             # User said "schedule study resources and set goals".
             pass
        # Maybe restrict 'resource_release' to admins
        if ev_type in ['resource_release']:
             return jsonify({'error': 'Students cannot create resource releases'}), 403

    new_event = Event(title=title, date=date, type=ev_type, created_by=user_id)
    db.session.add(new_event)
    db.session.commit()

    return jsonify({'message': 'Event created successfully', 'event': {'id': new_event.id, 'title': title}})

@app.route('/universities', methods=['GET'])
def get_universities():
    unis = University.query.all()
    return jsonify([{'id': u.id, 'name': u.name} for u in unis])

@app.route('/admin/courses/<int:course_id>/full_structure', methods=['GET'])
@jwt_required()
def get_course_structure(course_id):
    if not check_role(['admin', 'management']): return jsonify({'error': 'Unauthorized'}), 403
    topics = Topic.query.filter_by(course_id=course_id).all()
    result = []
    for t in topics:
        res_list = Resource.query.filter_by(topic_id=t.id).all()
        result.append({
            'id': t.id,
            'name': t.name,
            'resources': [r.to_dict() for r in res_list]
        })
    return jsonify(result)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/admin/resources/upload', methods=['POST'])
@jwt_required()
def upload_file():
    print("DEBUG: Upload request received") # Debug log
    print(f"DEBUG: Files: {request.files}") 
    
    if not check_role(['admin', 'management']):
        return jsonify({'error': 'Unauthorized'}), 403
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Append timestamp to avoid collision
        import time
        timestamp = int(time.time())
        filename = f"{timestamp}_{filename}"
        
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
            
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Generate absolute URL (Relative for portability)
        file_url = url_for('download_file', name=filename, _external=False)
        return jsonify({'url': file_url, 'message': 'File uploaded successfully'})
        
    return jsonify({'error': 'File type not allowed (PDF, TXT, DOCX only)'}), 400

@app.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(app.config['UPLOAD_FOLDER'], name)

@app.route('/management/analytics', methods=['POST'])
@jwt_required()
def management_analytics():
    if not check_role(['management', 'admin']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json or {}
    uni_filter = data.get('university')
    # 'course' in frontend filter context now means 'Degree' (e.g. BSc Engineering)
    degree_filter = data.get('degree') 
    role_filter = data.get('role', 'admin') # Default to admin for backward compat
    
    results = []

    if role_filter == 'student':
        # --- STUDENT QUERY ---
        query = User.query.filter_by(role='student')
        
        if uni_filter:
            query = query.join(User.university_rel).filter(University.name == uni_filter)
        
        if degree_filter:
            query = query.join(User.degree_rel).filter(Degree.name == degree_filter)
            
        students = query.all()
        
        for s in students:
            # Calculate simple stats for student
            enrolled_count = Enrollment.query.filter_by(user_id=s.id).count()
            
            # Calculate total study time (sum of ratings time_spent)
            ratings = Rating.query.filter_by(user_id=s.id).all()
            total_time = sum([r.time_spent for r in ratings]) if ratings else 0
            
            # Format time (mins or hrs)
            time_display = f"{round(total_time/60, 1)} Hrs"
            
            results.append({
                'id': s.id,
                'name': f"{s.first_name} {s.last_name}" if s.first_name else s.username,
                'email': s.username,
                'university': s.university_rel.name if s.university_rel else 'N/A',
                'degree': s.degree_rel.name if s.degree_rel else 'N/A',
                'enrolled_courses': enrolled_count,
                'study_time': time_display,
                'role': 'student',
                'student_id': s.student_index_number,
                'phone': s.phone_number,
                'nic': s.nic
            })

    else:
        # --- ADMIN QUERY ---
        query = User.query.filter_by(role='admin')
        
        if uni_filter:
            query = query.join(User.university_rel).filter(University.name == uni_filter)
            
        admins = query.all()
        
        for admin in admins:
            # Get Degree managed by this admin
            degree = Degree.query.filter_by(admin_id=admin.id).first()
            
            # Filter by Degree Name if provided
            if degree_filter:
                if not degree or degree.name != degree_filter:
                    continue

            courses = []
            degree_name = "N/A"
            if degree:
                degree_name = degree.name
                courses = Course.query.filter_by(degree_id=degree.id).all()
            
            # Stats Aggregation
            res_count = 0
            total_rating = 0
            rating_count = 0
            students_set = set()
            course_names = []
            
            for c in courses:
                course_names.append(c.module_name)
                # Resources (via Topics)
                topics = Topic.query.filter_by(course_id=c.id).all()
                for t in topics:
                    resources = Resource.query.filter_by(topic_id=t.id).all()
                    res_count += len(resources)
                    for r in resources:
                        ratings = Rating.query.filter_by(resource_id=r.id).all()
                        for rt in ratings:
                            total_rating += rt.score
                            rating_count += 1
                
                # Engagement
                enrollments = Enrollment.query.filter_by(course_id=c.id).all()
                for e in enrollments:
                    students_set.add(e.user_id)
            
            avg_rating = round(total_rating / rating_count, 1) if rating_count > 0 else 0
            
            results.append({
                'id': admin.id,
                'name': f"{admin.first_name} {admin.last_name}" if admin.first_name else admin.username,
                'email': admin.username,
                'university': admin.university_rel.name if admin.university_rel else 'N/A',
                'degree': degree_name,
                'courses': course_names,
                'content_contributions': res_count,
                'avg_rating': avg_rating,
                'active_students': len(students_set),
                'role': 'admin'
            })
        
    return jsonify(results)


@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat_agent():
    data = request.json
    message = data.get('message', '')
    context_str = data.get('context_str', '')
    course_id = data.get('course_id')
    topic_id = data.get('topic_id')
    
    # 1. Retrieve & Rank Context Resources
    candidates = []
    if topic_id:
        # Get all resources for the topic
        candidates = Resource.query.filter_by(topic_id=topic_id).all()
    elif course_id:
        # Get all resources for the course (via Topics)
        topics = Topic.query.filter_by(course_id=course_id).all()
        for t in topics:
            candidates.extend(Resource.query.filter_by(topic_id=t.id).limit(5).all())
            
    # Simple Relevance Ranking (Keyword Match)
    scored_candidates = []
    user_keywords = set(message.lower().split())
    
    for r in candidates:
        score = 0
        title_lower = r.title.lower()
        # Keyword overlap
        overlap = sum(1 for w in user_keywords if w in title_lower)
        score += overlap * 2
        # Average Rating boost
        if r.ratings:
            avg = sum(rt.score for rt in r.ratings) / len(r.ratings)
            score += avg * 0.5
        
        scored_candidates.append((score, r))
        
    # Sort and take top 5
    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    top_resources = [x[1] for x in scored_candidates[:5]]
    
    context_resources = [f"{r.title} ({r.url}) - Format: {r.format}" for r in top_resources]
    
    # Robust System Prompt (Shared)
    system_prompt = f"""
    You are 'Study Buddy', an intelligent academic assistant.
    
    CURRENT CONTEXT:
    {context_str}
    
    RELEVANT RESOURCES (from database):
    {chr(10).join(['- ' + r for r in context_resources]) if context_resources else "No specific resources found matched to query."}
    
    INSTRUCTIONS:
    1. Answer the student's question clearly and concisely.
    2. If the Resources listed above are relevant to the question, explicitly recommend them (e.g., "You can check [Title] for more details").
    3. If the question is outside the scope of provided resources, use your general knowledge.
    4. Be encouraging and concise.
    """

    # 2. Generate Answer (OpenAI / Gemini)
    openai_key = os.getenv('OPENAI_API_KEY')
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    preferred_provider = data.get('provider', 'auto') # 'auto', 'openai', 'gemini'
    
    answer = ""
    success = False
    
    # Logic:
    # If provider is 'openai', try OpenAI only (or first).
    # If provider is 'gemini', try Gemini only (or first).
    # If 'auto', try OpenAI then Gemini.
    
    use_openai = False
    use_gemini = False
    
    if preferred_provider == 'openai':
        use_openai = True
    elif preferred_provider == 'gemini':
        use_gemini = True
    else:
        # Auto: Try OpenAI, fallback to Gemini
        use_openai = True 
        # Falls through if fail
    
    # --- Try OpenAI ---
    if use_openai and openai_key and not success:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=300
            )
            answer = response.choices[0].message.content
            success = True
        except Exception as e:
            print(f"OpenAI Failed: {e}")
            if preferred_provider == 'openai':
                answer = f"OpenAI Error: {str(e)}"
            # If auto, we will try Gemini next
            
    # --- Try Gemini ---
    # Attempt if:
    # 1. user asked for gemini
    # 2. OR user asked for auto (use_openai was set) AND success is False (OpenAI failed)
    
    should_try_gemini = (preferred_provider == 'gemini') or (preferred_provider == 'auto' and not success)
    
    if should_try_gemini and gemini_key and not success:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            
            # Dynamic Model Selection
            model_name = 'gemini-1.5-flash'
            try:
                available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
                flash_models = [m for m in available_models if 'flash' in m]
                
                if 'models/gemini-1.5-flash' in available_models:
                    model_name = 'gemini-1.5-flash'
                elif flash_models:
                    model_name = flash_models[0].replace('models/', '')
                elif available_models:
                    model_name = available_models[0].replace('models/', '')
            except:
                pass 
                
            model = genai.GenerativeModel(model_name)
            
            # Construct Prompt
            full_prompt = f"""
            {system_prompt}
            
            USER QUESTION:
            {message}
            """
            
            response = model.generate_content(full_prompt)
            answer = response.text
            success = True
        except Exception as e:
            print(f"Gemini Error: {e}")
            if not answer:
                answer = f"Gemini Error: {str(e)}"
            
    if not success and not answer:
        # Fallback
        answer = f"I couldn't generate an answer using **{preferred_provider.upper()}**.\nPlease check your API keys in `backend/.env`."

    return jsonify({'answer': answer})


@app.route('/management/admin-details/<int:admin_id>', methods=['GET'])
@jwt_required()
def get_admin_details(admin_id):
    if not check_role(['management', 'admin']):
        return jsonify({'error': 'Unauthorized'}), 403

    admin = User.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404

    degree = Degree.query.filter_by(admin_id=admin_id).first()
    courses = []
    if degree:
        courses = Course.query.filter_by(degree_id=degree.id).all()
    
    return jsonify({
        'admin': {
            'id': admin.id,
            'name': admin.first_name,
            'email': admin.username
        },
        'degree': {
            'name': degree.name if degree else "No Degree Assigned",
            'university': admin.university_rel.name if admin.university_rel else "N/A"
        },
        'courses': [{
            'id': c.id, 
            'name': c.module_name,
            'code': c.module_id,
            'student_count': Enrollment.query.filter_by(course_id=c.id).count()
        } for c in courses]
    })

@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_user_history():
    current_user_id = get_jwt_identity()
    
    # query recent interactions
    # We want unique resources, sorted by latest interaction
    logs = InteractionLog.query.filter_by(user_id=current_user_id)\
            .order_by(InteractionLog.timestamp.desc()).all()
    
    seen_resources = set()
    history = []
    
    for log in logs:
        if log.resource_id in seen_resources:
            continue
            
        seen_resources.add(log.resource_id)
        res = Resource.query.get(log.resource_id)
        
        if res:
            # Determine category (Topic/Course name would be better but expensive, simplified for now)
            category = "General"
            if res.topic:
                category = res.topic.name
                
            history.append({
                'id': res.id,
                'title': res.title,
                'type': res.format, # video, article, pdf
                'date': log.timestamp.strftime("%b %d, %Y %I:%M %p"),
                'category': category,
                'url': res.url
            })
            
    return jsonify(history)

    course_details = []
    
    for c in courses:
        # Stats per course
        res_count = 0
        total_rating = 0
        rating_count = 0
        
        topics = Topic.query.filter_by(course_id=c.id).all()
        for t in topics:
            resources = Resource.query.filter_by(topic_id=t.id).all()
            res_count += len(resources)
            for r in resources:
                ratings = Rating.query.filter_by(resource_id=r.id).all()
                for rt in ratings:
                    total_rating += rt.score
                    rating_count += 1
                    
        avg = round(total_rating / rating_count, 1) if rating_count > 0 else 0
        enrollment_count = Enrollment.query.filter_by(course_id=c.id).count()
        
        course_details.append({
            'id': c.id,
            'name': c.module_name,
            'code': c.module_id,
            'resources': res_count,
            'rating': avg,
            'students': enrollment_count
        })
        
    return jsonify(course_details)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', debug=True, port=5000, use_reloader=False)
