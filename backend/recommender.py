from models import Resource, Course, Topic
from sqlalchemy import desc
import pickle
import os

class Recommender:
    def __init__(self):
        self.model = None
        self.output_path = os.path.join(os.path.dirname(__file__), 'recommendation_model.pkl')
        if os.path.exists(self.output_path):
            try:
                with open(self.output_path, 'rb') as f:
                    self.model = pickle.load(f)
                print("ML Model loaded successfully.")
            except Exception as e:
                print(f"Error loading ML model: {e}")

    def get_recommendations(self, course_id, topic_id, preferred_format=None, user_id=1):
        results = []
        
        # Step 1: Topic-based resources (Highest Priority)
        query = Resource.query.filter_by(topic_id=topic_id)
        if preferred_format:
            query = query.filter_by(format=preferred_format)
        
        topic_resources = query.all()
        results.extend(topic_resources)
        
        # Step 2: Course-level resources (Fallback if few results)
        if len(results) < 3:
            course_topics = Topic.query.filter_by(course_id=course_id).all()
            course_topic_ids = [t.id for t in course_topics]
            found_ids = [r.id for r in results]
            
            course_resources = Resource.query.filter(Resource.topic_id.in_(course_topic_ids))\
                                             .filter(Resource.id.notin_(found_ids))
            
            if preferred_format:
                course_resources = course_resources.filter_by(format=preferred_format)
                
            results.extend(course_resources.limit(5).all())
            
        # Step 3: Popularity Fallback
        if len(results) == 0:
            popular_resources = Resource.query.limit(5).all()
            results.extend(popular_resources)
            
        # Sort using ML model if available
        if self.model:
            # Predict score for each resource for the current user
            scored_results = []
            preds_df = self.model.get('preds_df')
            
            for r in results:
                score = 0
                try:
                    # Check if user and resource exist in our pre-computed matrix
                    if preds_df is not None and user_id in preds_df.index and r.id in preds_df.columns:
                        score = preds_df.loc[user_id, r.id]
                    else:
                        # Fallback for cold-start users or items
                        score = r.to_dict()['average_rating']
                except Exception:
                    score = r.to_dict()['average_rating']
                
                scored_results.append((r, score))
            
            # Sort by predicted score descending
            scored_results.sort(key=lambda x: x[1], reverse=True)
            results = [x[0] for x in scored_results]
        else:
            # Fallback to existing logic
            results.sort(key=lambda x: x.to_dict()['average_rating'], reverse=True)
        
        return [r.to_dict() for r in results]
