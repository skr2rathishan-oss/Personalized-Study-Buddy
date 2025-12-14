import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app import app, db, User, University, Degree
from flask_bcrypt import Bcrypt
import datetime

bcrypt = Bcrypt()

def seed_demo_users():
    with app.app_context():
        # 1. Ensure University & Degree Exist
        uni_name = "University of Ruhuna"
        degree_name = "Computer Engineering"
        
        uni = University.query.filter_by(name=uni_name).first()
        if not uni:
            uni = University(name=uni_name)
            db.session.add(uni)
            db.session.commit()
            print(f"✅ Created University: {uni_name}")
        
        degree = Degree.query.filter_by(name=degree_name, university=uni_name).first()
        if not degree:
            degree = Degree(name=degree_name, university=uni_name)
            db.session.add(degree)
            db.session.commit()
            print(f"✅ Created Degree: {degree_name}")

        # 2. Users to Create
        users_to_create = [
            {"username": "hirukshanan", "first": "Hirukshanan", "last": "Demo", "phone": "0771234588"},
            {"username": "nikarsan", "first": "Nikarsan", "last": "Demo", "phone": "0771234599"}
        ]
        
        common_pw_hash = bcrypt.generate_password_hash("password123").decode('utf-8')
        
        for u_data in users_to_create:
            # Check existing
            existing = User.query.filter(User.username.ilike(u_data['username'])).first()
            if existing:
                print(f"⚠️ User {u_data['username']} already exists. Skipping.")
                continue
                
            new_user = User(
                username=u_data['username'],
                # email field removed - username is used as identifier
                password_hash=common_pw_hash,
                role='student', # Created as Student
                first_name=u_data['first'],
                last_name=u_data['last'],
                university_id=uni.id,
                degree_id=degree.id,
                phone_number=u_data['phone'],
                subscription_status='active',
                subscription_date=datetime.datetime.utcnow()
            )
            
            db.session.add(new_user)
            print(f"✅ Queued User: {u_data['username']}")
            
        try:
            db.session.commit()
            print("🚀 All demo users created successfully!")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating users: {e}")

if __name__ == "__main__":
    seed_demo_users()
