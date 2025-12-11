
from app import app, db, bcrypt
from models import User

def update_creds():
    with app.app_context():
        # Update Student
        s = User.query.filter_by(username='student1').first()
        if s:
            s.password_hash = bcrypt.generate_password_hash('password123').decode('utf-8')
            print("Updated student1 to password123")

        # Update Admin
        a = User.query.filter_by(username='admin1').first()
        if a:
            a.password_hash = bcrypt.generate_password_hash('password123').decode('utf-8')
            print("Updated admin1 to password123")
            
        m = User.query.filter_by(username='manager1').first()
        if m:
            m.password_hash = bcrypt.generate_password_hash('password').decode('utf-8')
            print("Updated manager1 to password")

        db.session.commit()

if __name__ == "__main__":
    update_creds()
