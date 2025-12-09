"""
Migration script to remove profile_photo column from user table
"""
from app import app, db
from sqlalchemy import inspect

def remove_profile_photo_column():
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('user')]
        
        if 'profile_photo' in columns:
            print("Removing profile_photo column from user table...")
            
            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            # This is a simplified approach - backup and recreate
            db.engine.execute('''
                CREATE TABLE user_new (
                    id INTEGER PRIMARY KEY,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    password_hash VARCHAR(128) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    first_name VARCHAR(50),
                    last_name VARCHAR(50),
                    nic VARCHAR(20),
                    university VARCHAR(100),
                    university_course VARCHAR(100),
                    university_id VARCHAR(50),
                    phone_number VARCHAR(20)
                )
            ''')
            
            db.engine.execute('''
                INSERT INTO user_new 
                SELECT id, username, password_hash, role, first_name, last_name, 
                       nic, university, university_course, university_id, phone_number
                FROM user
            ''')
            
            db.engine.execute('DROP TABLE user')
            db.engine.execute('ALTER TABLE user_new RENAME TO user')
            
            print("✅ Successfully removed profile_photo column!")
        else:
            print("ℹ️  profile_photo column doesn't exist. Nothing to do.")

if __name__ == "__main__":
    remove_profile_photo_column()
