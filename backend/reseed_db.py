import random
from app import app, db, bcrypt
from models import User, Course, Topic, Resource, Degree, University, Enrollment, Rating
# from werkzeug.security import generate_password_hash (Removed)
from datetime import datetime

# --- Data Dictionaries ---
FIRST_NAMES = ["Kasun", "Nuwan", "Saman", "Kamal", "Nimal", "Sunil", "Amal", "Ruwan", "Dasun", "Chamara", "Dilshan", "Mahesh", "Pradeep", "Lahiru", "Shehan", "Asela", "Isuru", "Janaka", "Kumara", "Sampath", "Chatura", "Gayan", "Tharindu", "Sanjeewa", "Roshan", "Nishantha", "Kelum", "Thilina", "Chinthaka", "Suranga"]
LAST_NAMES = ["Perera", "Silva", "Fernando", "De Silva", "Bandara", "Wickramasinghe", "Dissanayake", "Jayewardene", "Ranasinghe", "Herath", "Gunaratne", "Mendis", "Nanayakkara", "Senanayake", "Ekanayake", "Karunaratne", "Weerasinghe", "Pathirana", "Gamage", "Rajapaksa", "Liyanage", "Abeyratne", "Edirisinghe", "Jayasinghe", "Samarasinghe", "Tennakoon", "Jayasooriya", "Premaratne", "Alwis", "Gunasekara"]

UNIVERSITIES = ["University of Ruhuna", "University of Moratuwa", "University of Colombo", "University of Peradeniya", "SLIIT", "NSBM Green University", "KDU"]

# Specific focus on Ruhuna & Moratuwa Engineering/Computer for detailed content
TARGET_COURSES = {
    "University of Ruhuna": [
        "BSc Engineering (Computer)",
        "BSc Computer Science",
        "BSc Engineering (Electrical and Information)",
        "BSc Engineering (Civil and Environmental)"
    ],
    "University of Moratuwa": [
        "BSc Engineering (Computer Science & Engineering)",
        "BSc Information Technology",
        "BSc Artificial Intelligence",
        "BSc Engineering (Electronic & Telecommunication)"
    ]
}

# Generic fallback for others
OTHER_COURSES = ["BSc Management", "BSc Science", "Bachelor of Arts", "BSc Medicine"]

MODULE_TEMPLATES = {
    "Computer": [
        {"name": "Fundamentals of Programming", "code": "CS101", "topics": ["Variables & Loops", "Functions & Scope", "Arrays & Vectors"]},
        {"name": "Data Structures & Algorithms", "code": "CS201", "topics": ["Sorting Algorithms", "Binary Trees", "Hash Maps", "Graph Traversal"]},
        {"name": "Database Management Systems", "code": "CS202", "topics": ["ER Modeling", "SQL Basics", "Normalization", "Transactions"]},
        {"name": "Web Application Development", "code": "SE301", "topics": ["HTML/CSS/JS", "React Basics", "REST APIs", "Authentication"]},
        {"name": "Artificial Intelligence Basics", "code": "AI101", "topics": ["Search Algorithms", "Neural Networks Intro", "Computer Vision", "NLP"]},
        {"name": "Operating Systems", "code": "CS203", "topics": ["Process Management", "Memory Paging", "File Systems", "Concurrency"]}
    ],
    "Engineering": [
        {"name": "Engineering Mathematics I", "code": "MA101", "topics": ["Calculus", "Linear Algebra", "Differential Equations"]},
        {"name": "Thermodynamics", "code": "ME102", "topics": ["Laws of Thermodynamics", "Heat Transfer", "Entropy", "Power Cycles"]},
        {"name": "Fluid Mechanics", "code": "CE103", "topics": ["Fluid Properties", "Bernoulli Equation", "Pipe Flow", "Turbulence"]},
        {"name": "Electronics I", "code": "EE201", "topics": ["Ohm's Law", "Circuit Analysis", "Diodes & Transistors", "Op-Amps"]},
        {"name": "Mechanics of Materials", "code": "CE202", "topics": ["Stress & Strain", "Beam Bending", "Torsion", "Structural Analysis"]}
    ]
}

# Sample Resources
SAMPLE_RESOURCES = [
    {"type": "video", "url": "https://www.youtube.com/watch?v=kqtD5dpn9C8", "title": "Lecture Part 1"},
    {"type": "article", "url": "https://en.wikipedia.org/wiki/Computer_science", "title": "Concept Overview"},
    {"type": "pdf", "url": "https://example.com/notes.pdf", "title": "Lecture Notes Week 1"}
]

def get_random_modules(course_name):
    """Returns a list of module dicts suitable for the course."""
    if "Computer" in course_name or "IT" in course_name or "Artificial" in course_name or "Software" in course_name:
        return random.sample(MODULE_TEMPLATES["Computer"], k=random.randint(3, 5))
    elif "Engineering" in course_name:
        return random.sample(MODULE_TEMPLATES["Engineering"], k=random.randint(3, 5))
    else:
        # Mix
        return random.sample(MODULE_TEMPLATES["Computer"] + MODULE_TEMPLATES["Engineering"], k=3)

def reseed():
    with app.app_context():
        print("--- STARTING DATABASE RESEED ---")
        try:
            db.drop_all() # Clean slate
            db.create_all()
        except:
            print("Drop failed (maybe file lock), attempting strict file delete...")
            import os
            try:
                os.remove("studybuddy.db")
                db.create_all()
            except: pass

        # 1. Create Universities
        print("Creating Universities...")
        uni_objs = {}
        for u_name in UNIVERSITIES:
            u = University(name=u_name)
            db.session.add(u)
            uni_objs[u_name] = u
        db.session.commit()

        degrees_created = []

        # 2. Create 30 Admins (Managers of Degrees)
        print("Creating 30 Admins (Course Managers)...")
        admins = []
        for i in range(30):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            username = f"{fname.lower()}.{lname.lower()}{i+1}"
            email = f"{username}@uni.lk"
            
            # Pick University
            if i < 20: # Make most from Ruhuna/Moratuwa as requested
                uni_name = random.choice(["University of Ruhuna", "University of Moratuwa"])
                avail_courses = TARGET_COURSES[uni_name]
            else:
                uni_name = random.choice(UNIVERSITIES)
                avail_courses = TARGET_COURSES.get(uni_name, OTHER_COURSES)
            
            course_name = random.choice(avail_courses)
            # Add batch year to make it unique per admin if collision
            degree_name = f"{course_name}" 
            # Check if this degree name exists? We want distinct degrees.
            # We'll suffix ID.
            
            user = User(
                username=username,
                password_hash=bcrypt.generate_password_hash('password').decode('utf-8'),
                role='admin', # Default to admin
                first_name=fname,
                last_name=lname,
                university=uni_name,
                university_course=degree_name,
                nic=f"{random.randint(90,99)}5{random.randint(10000,99999)}V",
                university_id=f"EMP{random.randint(100,999)}"
            )
            # Make the first one hardcoded for User testing
            if i == 0:
                user.username = 'manager1'
                user.email = 'manager1@uni.lk'
                user.role = 'management'
                # user.set_password('password') removed
                user.password_hash = bcrypt.generate_password_hash('password').decode('utf-8')
                user.university = 'University of Ruhuna'
                degree_name = 'BSc Engineering (Computer)'
                user.university_course = degree_name

            db.session.add(user)
            db.session.commit() # Commit to get ID
            admins.append(user)

            # Create Degree
            deg = Degree(name=degree_name, university=user.university, admin_id=user.id)
            db.session.add(deg)
            db.session.commit()
            degrees_created.append(deg)

            # Create Modules & Content
            modules_data = get_random_modules(degree_name)
            for m_d in modules_data:
                course = Course(
                    module_name=m_d["name"], 
                    module_id=f"{m_d['code']}-{random.randint(10,99)}", # Unique code suffix
                    degree_id=deg.id
                )
                db.session.add(course)
                db.session.commit()

                # Add Topics
                for t_name in m_d["topics"]:
                    topic = Topic(name=t_name, course_id=course.id)
                    db.session.add(topic)
                    db.session.commit()
                    
                    # Add Resources
                    num_res = random.randint(1, 3)
                    for _ in range(num_res):
                        tmpl = random.choice(SAMPLE_RESOURCES)
                        res = Resource(
                            title=f"{tmpl['title']} ({t_name})",
                            url=tmpl['url'],
                            format=tmpl['type'],
                            topic_id=topic.id,
                            quality_score=round(random.uniform(3.5, 5.0), 1),
                            source='manual',
                            is_auto_fetched=False
                        )
                        db.session.add(res)
                        
                        # Add fake Rating
                        rat = Rating(
                            user_id=user.id, # Admin rated it?
                            resource_id=res.id,
                            score=random.randint(3, 5),
                            timestamp=datetime.now()
                        )
                        # We need to commit res first? SQLAlchemy handles object attachment usually.

        db.session.commit()

        # 3. Create 100 Students
        print("Creating 100 Students...")
        for i in range(100):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            username = f"st_{fname.lower()}{random.randint(1,999)}"
            
            # Pick a degree to follow
            degree = random.choice(degrees_created)
            
            student = User(
                username=username,
                password_hash=bcrypt.generate_password_hash('password').decode('utf-8'),
                role='student',
                first_name=fname,
                last_name=lname,
                university=degree.university,
                university_course=degree.name,
                university_id=f"STU{random.randint(1000,9999)}"
            )
            # Helper for explicit test user
            if i == 0:
                student.username = 'student1'
                student.password_hash = bcrypt.generate_password_hash('password').decode('utf-8')
                student.university = 'University of Ruhuna'
                degree = [d for d in degrees_created if d.name == 'BSc Engineering (Computer)'][0]
                student.university_course = degree.name

            db.session.add(student)
            db.session.commit()

            # Enroll in all modules of that degree (or some)
            modules = Course.query.filter_by(degree_id=degree.id).all()
            for m in modules:
                enroll = Enrollment(user_id=student.id, course_id=m.id)
                db.session.add(enroll)
            
        db.session.commit()
        print("--- RESEED COMPLETE: 30 Admins, 100 Students, Rich Content ---")

if __name__ == '__main__':
    reseed()
