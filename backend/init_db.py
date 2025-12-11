from app import app, db, bcrypt
from models import Course, Topic, Resource, Rating, User, Enrollment, University, Degree

def seed_data():
    with app.app_context():
        # Clean Schema
        db.drop_all()
        db.create_all()
        
        print("Database schema created (Empty).")
        # No initial data as requested

if __name__ == "__main__":
    seed_data()
