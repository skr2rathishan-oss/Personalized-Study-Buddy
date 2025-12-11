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
            
            # 3. Personalization (Did this user like THIS resource?)
            user_boost = 0.0
            
            # Check specific user rating AND engagement for this resource
            # We treat time_spent as an implicit rating (ML feature)
            user_rating_val = 0
            user_time_spent = 0
            
            if res.ratings:
                for r in res.ratings:
                    if r.user_id == user_id:
                        user_rating_val = r.score
                        user_time_spent = r.time_spent if r.time_spent else 0
                        break
            
            # Explicit Rating Boost
            if user_rating_val >= 4:
                user_boost += 5.0
            elif user_rating_val > 0 and user_rating_val <= 2:
                user_boost += -1.0
            
            # Implicit Engagement Boost (Time Spent)
            # 1. Start with what we found in ratings
            # 2. If zero, try querying InteractionLogs for this user & resource
            if user_time_spent == 0:
                # Quick check if logs are loaded/available (simple query)
                log_entry = InteractionLog.query.filter_by(user_id=user_id, resource_id=res.id, interaction_type='view').order_by(InteractionLog.timestamp.desc()).first()
                if log_entry and log_entry.meta_data:
                    try:
                        meta = json.loads(log_entry.meta_data)
                        user_time_spent = meta.get('duration', 0)
                    except:
                        pass

            engagement_boost = 0.0
            if user_time_spent > 60:
                # Significant engagement (watched > 1 min)
                # Boost logic: +1.0 baseline, scaling up to +2.5 for 10 mins
                engagement_boost = 1.0 + (min(user_time_spent, 600) / 600.0) * 1.5
            elif user_time_spent > 10:
                engagement_boost = 0.5 # Small nudge for clicked/briefly viewed

            user_boost += engagement_boost

            # 4. Source Priority & Format Adjustment
            source_boost = 0.0
            if res.source == 'manual' or not res.is_auto_fetched:
                source_boost = 0.2 
            
            # Format Penalty: If it's a PDF and strictly not rated high by user, push it down slightly
            # to allow videos (often preferred) to surface if scores are close.
            format_penalty = 0.0
            if res.format.lower() == 'pdf' and user_rating_val < 3:
                format_penalty = -0.5

            # Weighted Hybrid Formula
            # 30% Content + 70% Quality/Rating + User Boost + Source Boost + Format Penalty
            components = {
                'content': round(cont_score * 0.3, 2),
                'collab': round(collab_score * 2.0, 2),
                'personal': round(user_boost, 2),
                'source': round(source_boost + format_penalty, 2)
            }
            final_score = sum(components.values())
            
            # Attach debug info to resource instance (transient, not saved to DB)
            res.score_breakdown = components
            res.final_score = round(final_score, 2)
            
            print(f"DEBUG: Res {res.id} ({res.format}) | RatingVal: {user_rating_val} | Final: {final_score}")
            
            final_scores.append((res, final_score))
        
        # Sort by final score
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        print("\n--- FINAL RANKING DEBUG ---")
        for i, (r, s) in enumerate(final_scores[:10]):
            print(f"Rank {i+1}: [{r.format.upper()}] {r.title} (ID: {r.id}) - Score: {s:.4f}")
        print("---------------------------\n")
        
        return [item[0] for item in final_scores[:top_k]]
