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
            from sklearn.metrics.pairwise import cosine_similarity as cs
            SentenceTransformer = ST
            cosine_similarity = cs
            try:
                model = ST('all-MiniLM-L6-v2')
            except Exception as dl_err:
                print(f"Internet/Model Download Failed: {dl_err}. Using Mock Model.")
                class MockModel:
                    def encode(self, texts):
                        import numpy as np
                        # Return random vectors of shape (len(texts), 384)
                        return np.random.rand(len(texts), 384)
                model = MockModel()

            print("ML Semantic Model loaded successfully (or mock).")
        except Exception as e:
            print(f"Failed to load Semantic ML libs: {e}")
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

    def warmup(self):
        """Pre-loads ML libraries in background to avoid latency on first request."""
        print("Warming up ML models...")
        load_ml_libs()
        print("ML models warmed up.")

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

    def update_resource_embeddings_batch(self, resources):
        """Computes and saves embeddings for a list of resources in one batch (Faster)."""
        load_ml_libs()
        if not resources: return
        
        texts = [f"{r.title}" for r in resources]
        
        if model is None:
            # Fallback if model failed to load
            for r in resources:
                r.embedding_vector = json.dumps([0.0]*384)
        else:
            # Batch encode
            vectors = model.encode(texts)
            for i, r in enumerate(resources):
                r.embedding_vector = json.dumps(vectors[i].tolist())
        
        self.db.commit()

    def get_content_similarity(self, query_text, resources):
        """
        Computes cosine similarity between query and list of resources.
        Returns a dictionary {resource_id: similarity_score}.
        """
        load_ml_libs()
        if model is None or cosine_similarity is None:
            return {}
            
        # Optimization: Pre-check and batch update missing embeddings
        missing_embedding_resources = [r for r in resources if not r.embedding_vector]
        if missing_embedding_resources:
            self.update_resource_embeddings_batch(missing_embedding_resources)

        query_vec = model.encode(query_text).reshape(1, -1)
        scores = {}
        
        for res in resources:
            if not res.embedding_vector:
                # Should have been fixed by batch update, but safety check
                self.update_resource_embedding(res)
            
            try:
                res_vec = np.array(json.loads(res.embedding_vector)).reshape(1, -1)
                sim = cosine_similarity(query_vec, res_vec)[0][0]
                scores[res.id] = sim
            except Exception as e:
                self.logger.error(f"Error computing similarity for resource {res.id}: {e}")
                scores[res.id] = 0.0
            
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
        New Weighted Recommendation Logic (User Request):
        1. **Admin/Source Trust**: 50%
        2. **Engagement (Rating + Time)**: 30%
        3. **Relevance & Popularity**: 20%
        """
        if not resources:
            return []

        # 1. Content-Based Relevance (Semantic Similarity)
        # We use this as part of the 20% Relevance block
        content_scores = self.get_content_similarity(topic_name, resources)
        
        final_scores = []
        for res in resources:
            # --- COMPONENT 1: Source Trust (50%) ---
            # "Admin upload files give them 50% of score"
            if res.source == 'manual' or not res.is_auto_fetched:
                source_score_raw = 100 # Admin/Manual = Perfect Trust
            else:
                source_score_raw = 0  # Web/Auto = Zero Trust Score (User Requirement)
                
            weighted_source = source_score_raw * 0.50
            
            # --- COMPONENT 2: Engagement (30%) ---
            # "Rating with time"
            
            # 2a. Average Rating (0-100 scale)
            avg_rating = 0
            if res.ratings:
                avg_rating = (sum(r.score for r in res.ratings) / len(res.ratings)) / 5.0 * 100
            else:
                avg_rating = 50 # Neutral start
            
            # 2b. Time Factor (Implicit)
            # Check user's specific time or average time
            # For general ranking, we use average time of all users
            avg_time = 0
            if res.ratings:
                total_time = sum(r.time_spent for r in res.ratings if r.time_spent)
                count = len([r for r in res.ratings if r.time_spent])
                if count > 0:
                    avg_time = total_time / count
            
            # Simple Time Scorer: > 2 mins = 100, > 30s = 70, else 40
            if avg_time > 120:
                time_score = 100
            elif avg_time > 30:
                time_score = 70
            else:
                time_score = 40
                
            # Combine Rating (60%) and Time (40%) within the Engagement block
            engagement_raw = (avg_rating * 0.6) + (time_score * 0.4)
            weighted_engagement = engagement_raw * 0.30
            
            # --- COMPONENT 3: Relevance & Popularity (20%) ---
            # "Relevance of the topic and the popularity in the environment"
            
            # 3a. Relevance (Content Sim)
            sim_score = content_scores.get(res.id, 0) * 100 # Convert 0-1 to 0-100
            
            # 3b. Popularity (Rating Count)
            # Logarithmic scale for popularity (1 rating -> 20, 10 ratings -> 80, 50+ -> 100)
            rating_count = len(res.ratings)
            if rating_count == 0:
                pop_score = 0
            else:
                pop_score = min(100, 20 + (np.log(rating_count) * 25))
            
            # Combine Relevance (70%) and Popularity (30%) within the block
            relevance_raw = (sim_score * 0.7) + (pop_score * 0.3)
            weighted_relevance = relevance_raw * 0.20
            
            # --- TOTAL SCORE ---
            final_score = weighted_source + weighted_engagement + weighted_relevance
            
            # Score Breakdown for UI
            # We map to keys expected by the frontend (or new keys if we update frontend)
            # Let's use new descriptive keys and update frontend to match.
            res.score_breakdown = {
                'source_trust': round(weighted_source, 1), # Max 50
                'engagement': round(weighted_engagement, 1), # Max 30
                'relevance': round(weighted_relevance, 1)    # Max 20
            }
            res.final_score = round(final_score, 1)
            
            final_scores.append((res, final_score))
        
        # Sort
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        print("\n--- UPDATED RANKING 50/30/20 ---")
        for i, (r, score) in enumerate(final_scores[:5]):
            print(f"Rank {i+1}: {r.title} | Score: {score} | BD: {r.score_breakdown}")
        print("--------------------------------\n")
        
        return [item[0] for item in final_scores[:top_k]]
