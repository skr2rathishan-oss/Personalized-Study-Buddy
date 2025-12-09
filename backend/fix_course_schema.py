
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
        
        # Check if table needs migration
        cursor.execute("PRAGMA table_info(course)")
        columns = [info[1] for info in cursor.fetchall()]
        
        print(f"Current columns: {columns}")
        
        if 'name' in columns and 'module_name' not in columns:
            print("Renaming 'name' to 'module_name'...")
            cursor.execute("ALTER TABLE course RENAME COLUMN name TO module_name")
            
        if 'code' in columns and 'module_id' not in columns:
            print("Renaming 'code' to 'module_id'...")
            cursor.execute("ALTER TABLE course RENAME COLUMN code TO module_id")
            
        # Refresh columns
        cursor.execute("PRAGMA table_info(course)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'degree_id' not in columns:
            print("Adding 'degree_id' column...")
            cursor.execute("ALTER TABLE course ADD COLUMN degree_id INTEGER REFERENCES degree(id)")

        conn.commit()
        print("Course Table Migration successful.")
            
        conn.close()
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    run_migration()
