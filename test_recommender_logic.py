import sys
import os
# Ensure we can import from backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))
sys.path.append(os.getcwd())

from backend.app import app, db, recommender_system
from backend.models import User, Resource

def test_logic():
    with app.app_context():
        # Setup
        user = User.query.filter_by(username='manager1').first()
        if not user:
            print("User manager1 not found")
            return

        resources = Resource.query.limit(5).all()
        if not resources:
            print("No resources found")
            return

        print(f"Running recommendation for {user.username} with {len(resources)} resources...")
        
        # ACT
        results = recommender_system.recommend(user.id, "Python", resources, top_k=5)
        
        # ASSERT
        print("-" * 30)
        success_count = 0
        for r in results:
            if hasattr(r, 'score_breakdown') and hasattr(r, 'final_score'):
                print(f"[OK] Resource {r.id}: Score {r.final_score}")
                print(f"     Breakdown: {r.score_breakdown}")
                success_count += 1
            else:
                print(f"[FAIL] Resource {r.id} missing attributes!")
        
        if success_count == len(results) and len(results) > 0:
            print("\nSUCCESS: All recommendations have score attributes.")
        else:
            print("\nFAILURE: Some recommendations missing scores or no results.")

if __name__ == "__main__":
    test_logic()
