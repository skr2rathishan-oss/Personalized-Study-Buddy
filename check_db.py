from backend.app import app, db, User

with app.app_context():
    user = User.query.filter_by(username='vvivushan@gmail.com').first()
    if user:
        print(f"User found: {user.username}, Role: {user.role}, ID: {user.id}")
        print(f"Password Hash details: {user.password_hash[:20]}...")
    else:
        print("User NOT found in database.")
        
    # Also list all users to be sure
    users = User.query.all()
    print(f"\nTotal users: {len(users)}")
    for u in users:
        print(f" - {u.username}")
