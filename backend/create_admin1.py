from app import app, db, bcrypt
from models import User, Degree, University

def create_admin1():
    with app.app_context():
        username = "admin1"
        password = "password"
        
        user = User.query.filter_by(username=username).first()
        
        if user:
            print(f"User {username} already exists. Updating password...")
            user.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            # Ensure role is admin
            user.role = 'admin'
        else:
            print(f"Creating user {username}...")
            user = User(
                username=username,
                password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
                role='admin',
                first_name='Admin',
                last_name='One',
                university='University of Ruhuna',
                university_course='BSc Engineering (Computer)'
            )
            db.session.add(user)
        
        db.session.commit()
        
        # Now assign a degree to this admin
        degree_name = 'BSc Engineering (Computer)'
        degree = Degree.query.filter_by(name=degree_name, university=user.university).first()
        
        if degree:
            print(f"Assigning {username} as admin for {degree_name}...")
            degree.admin_id = user.id
            db.session.commit()
        else:
            print(f"Degree {degree_name} not found. Creating it...")
            degree = Degree(
                name=degree_name,
                university=user.university,
                admin_id=user.id
            )
            db.session.add(degree)
            db.session.commit()

        print(f"Done. User: {username} / {password}")

if __name__ == "__main__":
    create_admin1()
