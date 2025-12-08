
from app import app, db
from models import Course, Topic

def seed_courses():
    with app.app_context():
        # Define seed data
        courses_data = [
            {
                "name": "Introduction to Machine Learning", 
                "code": "CS101", 
                "topics": ["Supervised Learning", "Unsupervised Learning", "Neural Networks"]
            },
            {
                "name": "Calculus I", 
                "code": "MATH101", 
                "topics": ["Limits", "Derivatives", "Integrals"]
            },
            {
                "name": "World History", 
                "code": "HIST101", 
                "topics": ["Ancient Rome", "World War II", "The Cold War"]
            },
            {
                "name": "Data Structures and Algorithms", 
                "code": "CS102", 
                "topics": ["Arrays", "Linked Lists", "Graphs"]
            }
        ]

        print("Seeding courses...")
        for data in courses_data:
            # Check if course exists
            existing_course = Course.query.filter_by(code=data['code']).first()
            if not existing_course:
                course = Course(name=data['name'], code=data['code'])
                db.session.add(course)
                db.session.commit()
                print(f"Added course: {course.name}")
                
                # Add topics
                for topic_name in data['topics']:
                    topic = Topic(name=topic_name, course_id=course.id)
                    db.session.add(topic)
                db.session.commit()
                print(f"  Added {len(data['topics'])} topics for {course.code}")
            else:
                print(f"Course {data['code']} already exists.")
        
        print("Done!")

if __name__ == "__main__":
    seed_courses()
