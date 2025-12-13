from app import app, db, User, bcrypt

with app.app_context():
    user = User.query.filter(User.username.like('%vvivushan%')).first()
    if user:
        print(f"Resetting password for {user.username}...")
        hashed_pw = bcrypt.generate_password_hash('password123').decode('utf-8')
        user.password_hash = hashed_pw
        db.session.commit()
        print("Password reset to 'password123'.")
    else:
        print("User not found.")
