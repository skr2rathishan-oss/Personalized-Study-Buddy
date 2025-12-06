import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# We need to mock the app context because Recommender queries the DB (Resource.query...)
# and models.py expects a Flask app context.
from backend.app import app, db
from backend.recommender import Recommender

print("Initializing Recommender...")
rec = Recommender()

print("Testing Recommendation Logic...")
with app.app_context():
    try:
        # Assuming we have some data. If DB is empty, this might return empty list but not error.
        # Arguments: course_id=1, topic_id=1 (assuming they exist from init_db)
        results = rec.get_recommendations(course_id=1, topic_id=1)
        print(f"Success! Got {len(results)} recommendations.")
        for r in results:
            print(f" - {r['title']} (Score: {r.get('average_rating', 'N/A')})")
    except Exception as e:
        print("CRASHED during get_recommendations:")
        import traceback
        traceback.print_exc()
