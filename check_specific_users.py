import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app import app, db, User

def check_specific():
    with app.app_context():
        targets = ["hirukshanan", "nikarsan"]
        print(f"Checking targets: {targets}")
        
        for name in targets:
            # Use ILIKE for case-insensitive match
            user = User.query.filter(User.username.ilike(f"%{name}%")).first()
            
            if user:
                print(f"\n--- Found User: {user.username} (ID: {user.id}) ---")
                print(f"Email/Username: {user.username}")
                print(f"Phone: {user.phone_number}")
                
                # Safe print of hash
                raw_hash = user.password_hash
                try:
                    print(f"Hash: {raw_hash}")
                except Exception:
                    print(f"Hash (repr): {repr(raw_hash)}")
                
                # Check validity
                if not raw_hash or len(raw_hash) < 50 or not str(raw_hash).startswith('$'):
                    print("❌ STATUS: INVALID HASH (Corrupt)")
                else:
                    print("✅ STATUS: OK (Hash format valid)")
            else:
                print(f"\n❌ User '{name}' NOT FOUND in database.")

if __name__ == "__main__":
    check_specific()
