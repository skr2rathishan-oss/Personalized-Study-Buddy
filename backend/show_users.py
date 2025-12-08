from app import app, db
from models import User

def show():
    with app.app_context():
        # Get 3 Admins
        admins = User.query.filter_by(role='management').limit(3).all()
        # Get 3 Students
        students = User.query.filter_by(role='student').limit(3).all()
        
        print("--- DEMO ACCOUNTS (Password: password) ---")
        for u in admins:
            print(f"Role: {u.role.upper()} | Username: {u.username} | Degree: {u.university_course}")
        for u in students:
            print(f"Role: {u.role.upper()} | Username: {u.username} | Degree: {u.university_course}")

if __name__ == '__main__':
    show()
