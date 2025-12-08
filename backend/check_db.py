from app import app, db, User

with app.app_context():
    users = User.query.all()
    print(f"Users found: {len(users)}")
    for u in users:
        print(f"  - {u.username} ({u.role})")
