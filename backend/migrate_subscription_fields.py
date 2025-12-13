"""
Migration script to add subscription fields to User table
Run this ONCE after updating models.py
"""
import os
import sys
import shutil
from datetime import datetime
from flask import Flask
from models import db, User

# Setup Flask app context
basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'data', 'db.sqlite3')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def backup_database():
    """Create a backup of the database before migration"""
    db_path = os.path.join(basedir, 'data', 'db.sqlite3')
    if os.path.exists(db_path):
        backup_path = os.path.join(basedir, 'data', f'db_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.sqlite3')
        shutil.copy2(db_path, backup_path)
        print(f"✅ Database backed up to: {backup_path}")
        return True
    else:
        print("⚠️  Database file not found. Skipping backup.")
        return False

def migrate():
    """Add subscription fields to existing User table"""
    with app.app_context():
        print("🔄 Starting migration...")
        
        # Backup first
        backup_database()
        
        try:
            # Check if columns already exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('user')]
            
            if 'subscription_status' in columns:
                print("⚠️  Subscription fields already exist. Migration not needed.")
                return
            
            # Add new columns using raw SQL (SQLite doesn't support ALTER TABLE ADD COLUMN with defaults easily)
            with db.engine.connect() as conn:
                print("📝 Adding subscription_status column...")
                conn.execute(db.text("ALTER TABLE user ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'inactive' NOT NULL"))
                
                print("📝 Adding subscription_date column...")
                conn.execute(db.text("ALTER TABLE user ADD COLUMN subscription_date DATETIME"))
                
                print("📝 Adding unsubscription_date column...")
                conn.execute(db.text("ALTER TABLE user ADD COLUMN unsubscription_date DATETIME"))
                
                conn.commit()
            
            # Set all existing users to 'inactive' (as per requirement)
            print("📝 Setting existing users to 'inactive' status...")
            users = User.query.all()
            for user in users:
                user.subscription_status = 'inactive'
            db.session.commit()
            
            print(f"✅ Migration complete! Updated {len(users)} existing users to 'inactive' status.")
            print("✅ New users will default to 'inactive' until they subscribe.")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            print("💡 You may need to restore from backup if the database is corrupted.")
            sys.exit(1)

if __name__ == '__main__':
    print("=" * 60)
    print("mSpace Subscription Fields Migration")
    print("=" * 60)
    
    response = input("This will modify your database. Continue? (yes/no): ")
    if response.lower() == 'yes':
        migrate()
    else:
        print("Migration cancelled.")
