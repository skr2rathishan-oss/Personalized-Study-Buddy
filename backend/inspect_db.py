
import sqlite3
import os

DB_PATH = os.path.join("backend", "db.sqlite3")

def inspect_schema():
    if not os.path.exists(DB_PATH):
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("--- Course Table Columns ---")
    cursor.execute("PRAGMA table_info(course)")
    for col in cursor.fetchall():
        print(col)
        
    conn.close()

if __name__ == "__main__":
    inspect_schema()
