from app import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        # Check if column exists
        with db.engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN profile_image TEXT"))
                print("Added profile_image column to user table")
            except Exception as e:
                print(f"Column likely already exists or error: {e}")

if __name__ == "__main__":
    migrate()
