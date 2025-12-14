import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app import app, db, User
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def check_hashes():
    with app.app_context():
        users = User.query.all()
        print(f"Checking {len(users)} users...")
        
        for user in users:
            print(f"User: {user.username}, Hash: {user.password_hash}")
            try:
                # Basic check: bcrypt hash usually starts with $2b$ or similar and is 60 chars
                if not user.password_hash or len(user.password_hash) < 50:
                    print(f"❌ INVALID HASH for {user.username} (Too short or empty)")
                elif not user.password_hash.startswith('$'):
                     print(f"❌ INVALID HASH for {user.username} (Does not start with $)")
                else:
                    print(f"✅ Hash format looks OK for {user.username}")
                    
            except Exception as e:
                print(f"Error checking {user.username}: {e}")

if __name__ == "__main__":
    check_hashes()
