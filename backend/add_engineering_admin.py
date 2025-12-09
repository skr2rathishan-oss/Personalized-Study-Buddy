from app import app, db, bcrypt
from models import User, Degree, University

def create_eng_admin():
    with app.app_context():
        # 1. Create the User
        username = "admin_engineering"
        password = "password"
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Check if user exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"User '{username}' already exists. Updating password...")
            existing_user.password_hash = hashed_pw
            eng_admin = existing_user
        else:
            print(f"Creating user '{username}'...")
            eng_admin = User(
                username=username,
                password_hash=hashed_pw,
                role="admin",
                university="University of Technology" 
            )
            db.session.add(eng_admin)
        
        db.session.commit()
        
        # 2. Create or Find the Degree
        degree_name = "BSc Engineering"
        uni_name = "University of Technology"
        
        existing_degree = Degree.query.filter_by(name=degree_name).first()
        if existing_degree:
            print(f"Degree '{degree_name}' already exists. Updating admin...")
            existing_degree.admin_id = eng_admin.id
        else:
            print(f"Creating degree '{degree_name}'...")
            # Ensure University exists (it should from init_db, but safe check)
            uni = University.query.filter_by(name=uni_name).first()
            if not uni:
                # Fallback if specific uni doesn't exist, though it should
                uni = University(name=uni_name)
                db.session.add(uni)
                db.session.commit()
                
            new_degree = Degree(
                name=degree_name,
                university=uni.name,
                admin_id=eng_admin.id
            )
            db.session.add(new_degree)
            
        db.session.commit()
        
        print(f"Successfully created/updated Admin user for Engineering.")
        print(f"Username: {username}")
        print(f"Password: {password}")

if __name__ == '__main__':
    create_eng_admin()
