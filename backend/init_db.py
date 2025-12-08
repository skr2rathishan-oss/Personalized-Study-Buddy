from app import app, db, bcrypt
from models import Course, Topic, Resource, Rating, User, Enrollment, University, Degree

def seed_data():
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        print("Seeding database...")

        # Create Users
        # Using a fixed hash for simplicity/demo
        pw = bcrypt.generate_password_hash("password").decode('utf-8')
        s1 = User(username="student1", password_hash=pw, role="student")
        s2 = User(username="student2", password_hash=pw, role="student")
        a1 = User(username="admin1", password_hash=pw, role="admin")
        m1 = User(username="manager1", password_hash=pw, role="management")
        a2 = User(username="admin2", password_hash=pw, role="admin")
        a3 = User(username="admin3", password_hash=pw, role="admin")
        
        # Create Universities
        u1 = University(name="University of Technology")
        u2 = University(name="Science Academy")
        db.session.add_all([u1, u2])
        db.session.commit()
        
        # Assign Users to Unis
        s1.university_id = u1.id
        s2.university_id = u2.id
        
        db.session.add_all([s1, s2, a1, a2, a3, m1])
        db.session.commit()

        # Create Degrees
        d1 = Degree(name="BSc Computer Science", university="University of Technology", admin_id=a1.id)
        d2 = Degree(name="BSc Software Engineering", university="University of Technology", admin_id=a2.id)
        d3 = Degree(name="BSc Data Science", university="Science Academy", admin_id=a3.id)
        db.session.add_all([d1, d2, d3])
        db.session.commit()

        # Update Users with Degree info (for testing)
        s1.university_course = "BSc Computer Science"
        s1.university = "University of Technology"
        s2.university_course = "BSc Data Science"
        s2.university = "Science Academy"
        a1.university = "University of Technology"
        a2.university = "University of Technology"
        a3.university = "Science Academy"
        db.session.commit()

        # Create Courses (Modules) linked to Degrees
        c1 = Course(module_name="Programming Basics", module_id="IT101", degree_id=d1.id)
        c2 = Course(module_name="Data Structures", module_id="CS201", degree_id=d1.id)
        c3 = Course(module_name="Web Development", module_id="WEB301", degree_id=d2.id)
        c4 = Course(module_name="Intro to Data Science", module_id="DS401", degree_id=d3.id)
        db.session.add_all([c1, c2, c3, c4])
        db.session.commit()

        # Create Topics
        t1 = Topic(name="Loops", course_id=c1.id)
        t2 = Topic(name="Variables", course_id=c1.id)
        t3 = Topic(name="Functions", course_id=c1.id)
        t4 = Topic(name="Arrays", course_id=c2.id)
        t5 = Topic(name="Linked Lists", course_id=c2.id)
        t6 = Topic(name="HTML Basics", course_id=c3.id)
        t7 = Topic(name="CSS flexbox", course_id=c3.id)
        t8 = Topic(name="Pandas", course_id=c4.id)
        t9 = Topic(name="NumPy", course_id=c4.id)
        db.session.add_all([t1, t2, t3, t4, t5, t6, t7, t8, t9])
        db.session.commit()
        
        # Enrollments
        e1 = Enrollment(user_id=s1.id, course_id=c1.id)
        e2 = Enrollment(user_id=s1.id, course_id=c2.id)
        e3 = Enrollment(user_id=s1.id, course_id=c3.id) # Student 1 also in Web Dev
        e4 = Enrollment(user_id=s2.id, course_id=c3.id) # Student 2 in Web Dev
        e5 = Enrollment(user_id=s2.id, course_id=c4.id) # Student 2 in Data Science
        db.session.add_all([e1, e2, e3, e4, e5])
        db.session.commit()

        # Create Resources
        resources = [
            # IT101
            Resource(title="Loops Explained for Beginners", url="https://youtube.com/watch?v=loops", format="video", topic_id=t1.id),
            Resource(title="Python For Loops Guide", url="https://realpython.com/python-for-loop/", format="article", topic_id=t1.id),
            Resource(title="While Loops vs For Loops", url="https://geeksforgeeks.org/loops", format="article", topic_id=t1.id),
            Resource(title="Understanding Variables", url="https://youtube.com/watch?v=vars", format="video", topic_id=t2.id),
            Resource(title="Variable Scope in Python", url="https://w3schools.com/python/python_scope.asp", format="article", topic_id=t2.id),
            Resource(title="Functions Deep Dive", url="https://docs.python.org/3/tutorial/controlflow.html#defining-functions", format="pdf", topic_id=t3.id),
            # CS201
            Resource(title="Array Basics", url="https://youtube.com/watch?v=arrays", format="video", topic_id=t4.id),
            Resource(title="Linked List Visualizer", url="https://visualgo.net/en/list", format="article", topic_id=t5.id),
            # WEB301
            Resource(title="HTML Crash Course", url="https://youtube.com/watch?v=html", format="video", topic_id=t6.id),
            Resource(title="MDN HTML Elements", url="https://developer.mozilla.org/en-US/docs/Web/HTML/Element", format="article", topic_id=t6.id),
            Resource(title="CSS Flexbox Guide", url="https://css-tricks.com/snippets/css/a-guide-to-flexbox/", format="article", topic_id=t7.id),
            Resource(title="Flexbox Zombies Game", url="https://mastery.games/flexboxzombies/", format="video", topic_id=t7.id),
            # DS401
            Resource(title="10 Minutes to Pandas", url="https://pandas.pydata.org/pandas-docs/stable/user_guide/10min.html", format="article", topic_id=t8.id),
            Resource(title="Pandas Tutorial for Data Science", url="https://youtube.com/watch?v=pandas", format="video", topic_id=t8.id),
            Resource(title="NumPy Quickstart", url="https://numpy.org/doc/stable/user/quickstart.html", format="pdf", topic_id=t9.id)
        ]
        db.session.add_all(resources)
        db.session.commit()

        # Add some initial ratings
        # resource_id mapping: 
        # 1-6 (IT101), 7-8 (CS201), 9-12 (WEB301), 13-15 (DS401)
        r1 = Rating(resource_id=1, user_id=s1.id, score=5, time_spent=120)
        r2 = Rating(resource_id=1, user_id=s2.id, score=4, time_spent=100)
        r3 = Rating(resource_id=2, user_id=s1.id, score=3, time_spent=30)
        r4 = Rating(resource_id=7, user_id=s1.id, score=5, time_spent=200)
        # Ratings for new courses
        r5 = Rating(resource_id=9, user_id=s1.id, score=5, time_spent=300) # HTML Video
        r6 = Rating(resource_id=10, user_id=s1.id, score=4, time_spent=60) # MDN
        r7 = Rating(resource_id=11, user_id=s1.id, score=5, time_spent=450) # CSS Tricks (Loved it)
        r8 = Rating(resource_id=9, user_id=s2.id, score=3, time_spent=100) # HTML Video
        r9 = Rating(resource_id=13, user_id=s2.id, score=5, time_spent=400) # Pandas Doc
        db.session.add_all([r1, r2, r3, r4, r5, r6, r7, r8, r9])
        db.session.commit()

        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
