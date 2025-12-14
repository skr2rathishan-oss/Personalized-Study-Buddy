import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app import app, db, User, Enrollment, Rating, InteractionLog, Event

def delete_corrupt_user():
    with app.app_context():
        targets = ["hirukshanan", "nikarsan"]
        print(f"Checking targets: {targets}")
        
        for target in targets:
            # Matches username containing the target string
            users = User.query.filter(User.username.ilike(f"%{target}%")).all()
            
            if not users:
                print(f"No users found matching '{target}'")
                continue
                
            for user in users:
                print(f"--- Deleting User ID: {user.id}, Username: {user.username} ---")
                try:
                    # Manual Cascade Delete
                    Enrollment.query.filter_by(user_id=user.id).delete()
                    Rating.query.filter_by(user_id=user.id).delete()
                    InteractionLog.query.filter_by(user_id=user.id).delete()
                    Event.query.filter_by(created_by=user.id).delete()
                    
                    db.session.delete(user)
                    db.session.commit()
                    print(f"✅ User '{user.username}' deleted successfully.")
                except Exception as e:
                    db.session.rollback()
                    print(f"❌ Failed to delete '{user.username}': {e}")

if __name__ == "__main__":
    delete_corrupt_user()
