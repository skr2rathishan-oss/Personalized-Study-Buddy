import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Get all users
cursor.execute("SELECT id, username, role, password_hash FROM user")
users = cursor.fetchall()

print(f"Total users: {len(users)}\n")

for user in users:
    user_id, username, role, password_hash = user
    print(f"ID: {user_id}")
    print(f"Username: {username}")
    print(f"Role: {role}")
    print(f"Password Hash Length: {len(password_hash)}")
    print(f"Password Hash Preview: {password_hash[:60]}...")
    print("-" * 50)

conn.close()
