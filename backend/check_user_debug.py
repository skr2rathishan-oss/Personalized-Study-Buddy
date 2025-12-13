from app import app, db, User

with app.app_context():
    print("Checking database...")
    user = User.query.filter(User.username.like('%vvivushan%')).first()
    if user:
        print(f"User found: {repr(user.username)}")
        print(f"Role: {user.role}, ID: {user.id}")
        print(f"Phone: {repr(user.phone_number)}")
        print(f"Sub Status: {user.subscription_status}")
    else:
        print("User NOT found in database.")
        
    users = User.query.all()
    print(f"\nTotal users: {len(users)}")
    for u in users:
        print(f" - {u.username}")
