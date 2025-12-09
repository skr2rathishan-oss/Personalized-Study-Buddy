"""
Complete database reset script - removes old db and reinitializes fresh
Run this when backend server is STOPPED
"""
import os
import sys

db_path = "db.sqlite3"

def reset_database():
    print("=" * 60)
    print("DATABASE RESET SCRIPT")
    print("=" * 60)
    
    # Check if database exists
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"✅ Removed old database: {db_path}")
        except PermissionError:
            print("❌ ERROR: Database is locked!")
            print("   Please STOP the backend server first, then run this script again.")
            print("   1. Press Ctrl+C in the terminal running the backend")
            print("   2. Run: python reset_db_full.py")
            sys.exit(1)
    else:
        print(f"ℹ️  No existing database found at {db_path}")
    
    # Now initialize fresh database
    print("\n📦 Initializing fresh database...")
    from app import app, db
    
    with app.app_context():
        db.create_all()
        print("✅ Database schema created (without profile_photo column)")
    
    # Seed with initial data
    print("\n🌱 Seeding initial data...")
    import init_db
    init_db.seed_data()
    
    print("\n" + "=" * 60)
    print("✅ DATABASE RESET COMPLETE!")
    print("=" * 60)
    print("\nDefault user credentials:")
    print("  Student: student1 / password")
    print("  Admin:   admin1 / password")
    print("\nYou can now start the backend server.")

if __name__ == "__main__":
    reset_database()
