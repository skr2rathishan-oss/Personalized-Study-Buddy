import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from models import Resource, Rating, InteractionLog
import json
import logging

# Initialize Sentence Transformer (Lightweight model)
model = SentenceTransformer('all-MiniLM-L6-v2')

class HybridRecommender:
    def __init__(self, db_session):
        self.db = db_session
        self.logger = logging.getLogger(__name__)

    def generate_embedding(self, text):
        """Generates a 384-dim vector for text."""
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
        query_vec = model.encode(query_text).reshape(1, -1)
        scores = {}
        
        for res in resources:
            if not res.embedding_vector:
                self.update_resource_embedding(res)
            
            res_vec = np.array(json.loads(res.embedding_vector)).reshape(1, -1)
            sim = cosine_similarity(query_vec, res_vec)[0][0]
            scores[res.id] = sim
            
        return scores

    def get_collaborative_score(self, resource):
        """
        Calculates a score based on user ratings and engagement.
        Score = (AvgRating * 0.7) + (NormWatchTime * 0.3)
        """
        ratings = resource.ratings
        if not ratings:
            return 0.5  # Cold start default neutral score
        
        avg_rating = sum(r.score for r in ratings) / len(ratings)
        # Normalize 1-5 to 0-1
        norm_rating = avg_rating / 5.0 
        
        # Simple popularity boost (could be more complex SVD later)
        popularity = min(len(ratings) / 10.0, 1.0) # Cap at 10 ratings
        
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
            collab_score = self.get_collaborative_score(res)
            
            # 3. Personalization (Did this user like similar format?)
            # (Simple heuristic: if user rated this format highly before, boost it)
            user_boost = 0.0
            # user_history = ... (query user's high rated resources)
            # if res.format in user_preferred_formats: user_boost = 0.1
            
            # Weighted Hybrid Formula
            # 60% Relevancy to Topic + 30% Quality/Popularity + 10% User Boost
            final_score = (cont_score * 0.6) + (collab_score * 0.4) + user_boost
            
            final_scores.append((res, final_score))
        
        # Sort by final score
        final_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [item[0] for item in final_scores[:top_k]]
