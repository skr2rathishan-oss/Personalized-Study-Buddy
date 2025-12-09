
import sqlite3
import os

DB_PATH = os.path.join("backend", "db.sqlite3")

def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(user)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'profile_image' not in columns:
            print("Migrating: Adding 'profile_image' column to 'user' table...")
            cursor.execute("ALTER TABLE user ADD COLUMN profile_image TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'profile_image' already exists. No action needed.")
            
        conn.close()
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    run_migration()
