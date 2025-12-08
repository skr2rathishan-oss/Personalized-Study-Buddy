from app import app, db, bcrypt
from models import Course, Topic, Resource, Rating, User, Enrollment, University, Degree
import random

# Data from UniversityInfo.ts
UNIVERSITY_COURSES = {
    "University of Ruhuna": [
        "BSc Agricultural Resource Management & Technology",
        "BSc Agribusiness Management",
        "BSc Green Technology",
        "BSc Medicine (MBBS)",
        "BSc Medical Laboratory Sciences",
        "BSc Nursing",
        "BSc Pharmacy",
        "BSc Engineering (Civil and Environmental)",
        "BSc Engineering (Electrical and Information)",
        "BSc Engineering (Mechanical)",
        "BSc Engineering (Computer)",
        "BSc Engineering (Marine)",
        "BSc Fisheries and Marine Sciences",
        "BSc Marine and Freshwater Sciences",
        "Bachelor of Business Administration (BBA)",
        "Bachelor of Arts (General/Special)",
        "BSc Biological Science",
        "BSc Physical Science",
        "BSc Computer Science",
        "Bachelor of Engineering Technology",
        "Bachelor of ICT",
        "Bachelor of Bio Systems Technology"
    ],
    "University of Colombo": [
        "BSc Biological Science",
        "BSc Physical Science",
        "BSc Molecular Biology & Biochemistry",
        "BSc Industrial Statistics",
        "BSc Computer Science (UCSC)",
        "BSc Information Systems (UCSC)",
        "Bachelor of Arts (BA)",
        "BSc Medicine (MBBS)",
        "BSc Nursing"
    ],
    "University of Moratuwa": [
        "BSc Engineering (Civil)",
        "BSc Engineering (Computer Science & Engineering)",
        "BSc Engineering (Electronic & Telecommunication)",
        "BSc Engineering (Mechanical)",
        "BSc Information Technology",
        "BSc Artificial Intelligence"
    ],
    "University of Peradeniya": [
        "BSc Engineering",
        "BSc Medicine (MBBS)",
        "BSc Dental Surgery",
        "BSc Agriculture",
        "Bachelor of Arts"
    ],
    "University of Kelaniya": [
        "Bachelor of Arts",
        "Bachelor of Commerce",
        "BSc Software Engineering",
        "BSc MIT (Management & IT)"
    ],
    "University of Sri Jayewardenepura": [
        "BSc Management (Business Admin)",
        "BSc Commerce",
        "BSc Engineering",
        "BSc Applied Sciences"
    ],
    "SLIIT (Sri Lanka Institute of Information Technology)": [
        "BSc Information Technology (IT)",
        "BSc Software Engineering",
        "BSc Data Science",
        "BSc Cyber Security"
    ],
    "NSBM Green University": [
        "BSc Software Engineering",
        "BSc Computer Science",
        "BSc Data Science"
    ],
    "KDU (Kotelawala Defence University)": [
        "BSc Engineering (Civil/Mech/Elec/Aero/Marine)",
        "BSc Computer Science",
        "BSc Software Engineering",
        "BSc Law (LLB)"
    ]
}

NAMES_FIRST = ["Kamal", "Nimal", "Sunil", "Amara", "Nayomi", "Shenal", "Ravi", "Dilshan", "Kasun", "Nuwan", "Saman", "Priya", "Malki", "Hashini", "Sanduni", "Kavindi", "Ruwan", "Dasun", "Chamara", "Lahiru"]
NAMES_LAST = ["Perera", "Silva", "Fernando", "De Silva", "Bandara", "Wickramasinghe", "Dissanayake", "Jayewardene", "Gunaratne", "Rajapaksa", "Senanayake", "Mendis", "Ekanayake", "Herath", "Karunaratne"]

def get_random_name():
    return f"{random.choice(NAMES_FIRST)} {random.choice(NAMES_LAST)}"

def seed_large_data():
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        
        print("Seeding large dataset...")

        pw = bcrypt.generate_password_hash("password").decode('utf-8')

        # 1. Create Core Management User
        manager = User(
            username="manager1", 
            password_hash=pw, 
            role="management",
            first_name="Super",
            last_name="Manager"
        )
        db.session.add(manager)

        # 2. Create Standard Demo Student (for easy testing)
        student1 = User(
            username="student1",
            password_hash=pw,
            role="student",
            first_name="Demo",
            last_name="Student",
            university="SLIIT (Sri Lanka Institute of Information Technology)",
            university_course="BSc Software Engineering"
        )
        db.session.add(student1)

        users_batch = []
        degrees_batch = []
        courses_batch = []
        
        # 3. Iterate Universities
        uni_count = 0
        total_admins = 0
        total_students = 0
        
        for uni_name, degrees in UNIVERSITY_COURSES.items():
            uni = University(name=uni_name)
            db.session.add(uni)
            db.session.flush() # get ID
            uni_count += 1
            print(f"Processing {uni_name}...")

            for degree_name in degrees:
                # Create Admin for this Degree
                # Username strategy: admin_uniInitials_degreeInitials
                uni_initials = "".join([w[0] for w in uni_name.split() if w[0].isupper()])[:3]
                deg_initials = "".join([w[0] for w in degree_name.split() if w[0].isupper()])[:4]
                admin_username = f"admin_{uni_initials}_{deg_initials}_{random.randint(100,999)}".lower()
                
                admin_user = User(
                    username=admin_username,
                    password_hash=pw,
                    role="admin",
                    first_name=random.choice(NAMES_FIRST),
                    last_name=random.choice(NAMES_LAST),
                    university=uni_name
                )
                db.session.add(admin_user)
                db.session.flush()
                total_admins += 1

                # Create Degree
                degree = Degree(
                    name=degree_name,
                    university=uni_name,
                    admin_id=admin_user.id
                )
                db.session.add(degree)
                db.session.flush()
                
                # Assign degree info to Admin
                admin_user.university_course = degree_name # Though strictly admin doesn't "study" it, they manage it
                
                # Create Modules (Courses) for this Degree
                # Standard pattern: Year 1 Sem 1, Year 1 Sem 2, etc.
                modules = [
                    ("Introduction to " + degree_name.split()[-1], "M101"),
                    ("Fundamentals of " + degree_name.split()[1], "M102"),
                    ("Advanced topics in " + degree_name.split()[-1], "M201"),
                    ("Final Project", "M400")
                ]
                
                course_objs = []
                for mod_name, mod_code in modules:
                    c = Course(module_name=mod_name, module_id=mod_code, degree_id=degree.id)
                    db.session.add(c)
                    course_objs.append(c)
                
                # Create Students for this Degree (Random 3-8 per degree to keep total reasonable but large)
                num_students = random.randint(3, 7)
                for i in range(num_students):
                    s_first = random.choice(NAMES_FIRST)
                    s_last = random.choice(NAMES_LAST)
                    s_username = f"{s_first.lower()}.{s_last.lower()}{random.randint(1,999)}"
                    
                    student = User(
                        username=s_username,
                        password_hash=pw,
                        role="student",
                        first_name=s_first,
                        last_name=s_last,
                        university=uni_name,
                        university_course=degree_name,
                        university_id=f"S{random.randint(10000,99999)}"
                    )
                    db.session.add(student)
                    db.session.flush()
                    total_students += 1
                    
                    # Enroll student in random courses of their degree
                    enrolled_courses = random.sample(course_objs, k=random.randint(1, len(course_objs)))
                    for c in enrolled_courses:
                        enrollment = Enrollment(user_id=student.id, course_id=c.id)
                        db.session.add(enrollment)
                    
                    # Add dummy ratings/study time (fake data for dashboard)
                    # We don't have Resources yet, so we create dummy Rating entries linked to non-existent resources 
                    # OR we must create resources. Let's create dummy resources per course.
                
                # Create Dummy Resources for stats
                for c in course_objs:
                    # 1-2 resources per course
                    res = Resource(title=f"Intro to {c.module_name}", url="http://example.com", format="video", is_auto_fetched=True)
                    # We need to link resource to a topic.
                    # Create implicit topic
                    top = Topic(name="General", course_id=c.id)
                    db.session.add(top)
                    db.session.flush()
                    res.topic_id = top.id
                    db.session.add(res)
        
        db.session.commit()
        print(f"Seeding Complete!\nUniversities: {uni_count}\nAdmins: {total_admins}\nStudents: {total_students}")

if __name__ == "__main__":
    seed_large_data()
