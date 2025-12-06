import sqlite3
import os

db_path = os.path.join('backend', 'db.sqlite3')

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    print("Attempting to add 'time_spent' column...")
    cur.execute("ALTER TABLE rating ADD COLUMN time_spent INTEGER DEFAULT 0")
    conn.commit()
    print("Success! Database schema updated.")
    conn.close()
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e):
        print("Column already exists.")
    else:
        print(f"Error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
