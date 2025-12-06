import sys
import os
import numpy as np
# Add parent directory to path to allow importing models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Resource, Rating, InteractionLog
import json
import logging
import pickle

# Lazy-loaded globals
SentenceTransformer = None
cosine_similarity = None
model = None
svd_model_data = None

def load_ml_libs():
    global SentenceTransformer, cosine_similarity, model, svd_model_data
    
    # Validation: Need both semantic model and SVD model loaded ideally
    if model is None:
        try:
            from sentence_transformers import SentenceTransformer as ST
            from sklearn.metrics.pairwise import cosine_similarity as CS
            SentenceTransformer = ST
            cosine_similarity = CS
            model = ST('all-MiniLM-L6-v2')
            print("ML Semantic Model loaded successfully.")
        except Exception as e:
            print(f"Failed to load Semantic ML model: {e}")
            model = None

    if svd_model_data is None:
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(base_dir, 'recommendation_model.pkl')
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    svd_model_data = pickle.load(f)
                print("SVD Recommendation Model loaded successfully.")
            else:
                print("SVD Model not found (Training needed).")
        except Exception as e:
            print(f"Failed to load SVD model: {e}")
            svd_model_data = None

class HybridRecommender:
    def __init__(self, db_session):
        self.db = db_session
        self.logger = logging.getLogger(__name__)

    def generate_embedding(self, text):
        """Generates a 384-dim vector for text."""
        load_ml_libs()
        if model is None:
            return [0.0] * 384 # Fallback zero vector
        return model.encode(text).tolist()

    def update_resource_embedding(self, resource):
        """Computes and saves embedding for a resource based on title/description."""
        # For simplicity, we use title. If description exists in future, concatenate it.
        text = f"{resource.title}"
        vector = self.generate_embedding(text)
        resource.embedding_vector = json.dumps(vector)
        self.db.commit()

    def get_content_similarity(self, query_text, resources):
        """
        Computes cosine similarity between query and list of resources.
        Returns a dictionary {resource_id: similarity_score}.
        """
        load_ml_libs()
        if model is None or cosine_similarity is None:
            return {}
            
        query_vec = model.encode(query_text).reshape(1, -1)
        scores = {}
        
        for res in resources:
            if not res.embedding_vector:
                self.update_resource_embedding(res)
            
            res_vec = np.array(json.loads(res.embedding_vector)).reshape(1, -1)
            sim = cosine_similarity(query_vec, res_vec)[0][0]
            scores[res.id] = sim
            
        return scores

    def get_collaborative_score(self, user_id, resource):
        """
        Calculates collaborative score using SVD Matrix or fallbacks.
        """
        load_ml_libs()
        
        # 1. Try SVD Prediction
        if svd_model_data:
            user_idx = svd_model_data['user_mapping'].get(user_id)
            res_idx = svd_model_data['res_mapping'].get(resource.id)
            
            # Case A: Known User and Known Resource -> Use SVD Matrix
            if user_idx is not None and res_idx is not None:
                predicted_rating = svd_model_data['preds_matrix'][user_idx, res_idx]
                # Normalize 1-5 prediction to 0-1 range for hybrid formula
                return min(max(predicted_rating / 5.0, 0), 1.0)
                
            # Case B: Unknown User or Resource -> Use Pre-calculated Popularity
            pop_score = svd_model_data['popularity'].get(resource.id)
            if pop_score:
                return min(max(pop_score / 5.0, 0), 1.0)

        # 2. Fallback to Simple Logic (if model missing or completely cold start)
        ratings = resource.ratings
        if not ratings:
            return 0.5
        
        avg_rating = sum(r.score for r in ratings) / len(ratings)
        norm_rating = avg_rating / 5.0 
        popularity = min(len(ratings) / 10.0, 1.0)
        
        return (norm_rating * 0.8) + (popularity * 0.2)

    def recommend(self, user_id, topic_name, resources, top_k=5):
        """
        Hybrid Recommendation Logic.
        """
        if not resources:
            return []

        # 1. Content-Based Scoring (Semantic Similarity to Topic)
        content_scores = self.get_content_similarity(topic_name, resources)
        
        # 2. Collaborative/Popularity Scoring
        final_scores = []
        for res in resources:
            cont_score = content_scores.get(res.id, 0)
            collab_score = self.get_collaborative_score(user_id, res)
            
            # 3. Personalization (Did this user like similar format?)
            # (Simple heuristic: if user rated this format highly before, boost it)
            user_boost = 0.0
            # user_history = ... (query user's high rated resources)
            # if res.format in user_preferred_formats: user_boost = 0.1
            
            # 4. Source Priority (Manual > AI)
            source_boost = 0.0
            if res.source == 'manual' or not res.is_auto_fetched:
                source_boost = 2.0 # Significant boost to ensure manual resources appear first
            
            # Weighted Hybrid Formula
            # 60% Relevancy to Topic + 30% Quality/Popularity + 10% User Boost + Source Priority
            final_score = (cont_score * 0.6) + (collab_score * 0.4) + user_boost + source_boost
            
            final_scores.append((res, final_score))
        
        # Sort by final score
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [item[0] for item in final_scores[:top_k]]
