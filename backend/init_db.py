from app import app, db
from models import Course, Topic, Resource, Rating

def seed_data():
    with app.app_context():
        db.create_all()
        
        # Check if data exists
        if Course.query.first():
            print("Database already initialized.")
            return

        print("Seeding database...")

        # Create Courses
        c1 = Course(name="Programming Basics", code="IT101")
        c2 = Course(name="Data Structures", code="CS201")
        db.session.add_all([c1, c2])
        db.session.commit()

        # Create Topics
        t1 = Topic(name="Loops", course_id=c1.id)
        t2 = Topic(name="Variables", course_id=c1.id)
        t3 = Topic(name="Functions", course_id=c1.id)
        t4 = Topic(name="Arrays", course_id=c2.id)
        t5 = Topic(name="Linked Lists", course_id=c2.id)
        db.session.add_all([t1, t2, t3, t4, t5])
        db.session.commit()

        # Create Resources
        resources = [
            Resource(title="Loops Explained for Beginners", url="https://youtube.com/watch?v=loops", format="video", topic_id=t1.id),
            Resource(title="Python For Loops Guide", url="https://realpython.com/python-for-loop/", format="article", topic_id=t1.id),
            Resource(title="While Loops vs For Loops", url="https://geeksforgeeks.org/loops", format="article", topic_id=t1.id),
            Resource(title="Understanding Variables", url="https://youtube.com/watch?v=vars", format="video", topic_id=t2.id),
            Resource(title="Variable Scope in Python", url="https://w3schools.com/python/python_scope.asp", format="article", topic_id=t2.id),
            Resource(title="Functions Deep Dive", url="https://docs.python.org/3/tutorial/controlflow.html#defining-functions", format="pdf", topic_id=t3.id),
            Resource(title="Array Basics", url="https://youtube.com/watch?v=arrays", format="video", topic_id=t4.id),
            Resource(title="Linked List Visualizer", url="https://visualgo.net/en/list", format="article", topic_id=t5.id)
        ]
        db.session.add_all(resources)
        db.session.commit()

        # Add some initial ratings
        r1 = Rating(resource_id=1, score=5)
        r2 = Rating(resource_id=1, score=4)
        r3 = Rating(resource_id=2, score=3)
        r4 = Rating(resource_id=7, score=5)
        db.session.add_all([r1, r2, r3, r4])
        db.session.commit()

        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
