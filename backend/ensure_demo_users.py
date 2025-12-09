from app import app, db, bcrypt
from models import User, Degree, University

def ensure_demo_users():
    with app.app_context():
        print("Ensuring demo users exist...")
        
        # 1. Manager
        manager = User.query.filter_by(username='manager1').first()
        password_hash = bcrypt.generate_password_hash('password').decode('utf-8')
        
        if not manager:
            print("Creating manager1...")
            manager = User(
                username='manager1',
                password_hash=password_hash,
                role='management',
                first_name='Manager',
                last_name='One'
            )
            db.session.add(manager)
        else:
            print("Updating manager1 password...")
            manager.password_hash = password_hash
            manager.role = 'management' # Ensure role is correct
        
        # 2. Admin
        admin = User.query.filter_by(username='admin1').first()
        if not admin:
            print("Creating admin1...")
            admin = User(
                username='admin1',
                password_hash=password_hash,
                role='admin',
                first_name='Admin',
                last_name='One',
                university='University of Ruhuna',
                university_course='BSc Engineering (Computer)'
            )
            db.session.add(admin)
        else:
            print("Updating admin1 password...")
            admin.password_hash = password_hash
            admin.role = 'admin'

        # 3. Student
        student = User.query.filter_by(username='student1').first()
        if not student:
            print("Creating student1...")
            student = User(
                username='student1',
                password_hash=password_hash,
                role='student',
                first_name='Student',
                last_name='One',
                university='University of Ruhuna',
                university_course='BSc Engineering (Computer)'
            )
            db.session.add(student)
        else:
            print("Updating student1 password...")
            student.password_hash = password_hash
            student.role = 'student'

        db.session.commit()
        print("Demo users updated/created successfully.")

if __name__ == "__main__":
    ensure_demo_users()
