# hybrid_recommender_full.py
import pandas as pd
import numpy as np
import sqlite3
import os
import pickle
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import mean_squared_error, mean_absolute_error

# -----------------------------
# 1. Load Ratings from Database
# -----------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, '../backend/data/db.sqlite3')

conn = sqlite3.connect(db_path)
ratings = pd.read_sql_query("""
    SELECT user_id, resource_id, score as rating, time_spent 
    FROM rating
""", conn)
conn.close()

if ratings.empty:
    print("No ratings found. Exiting.")
    exit()

# -----------------------------
# 2. Normalize Engagement
# -----------------------------
scaler = MinMaxScaler()
ratings['engagement_norm'] = scaler.fit_transform(ratings[['time_spent']])
ratings['engagement_scaled'] = ratings['engagement_norm'] * 4 + 1  # scale 1-5

# Weighted rating: combine explicit rating + engagement
alpha = 0.7  # explicit rating weight
beta = 0.3   # engagement weight
ratings['weighted_rating'] = alpha * ratings['rating'] + beta * ratings['engagement_scaled']

# -----------------------------
# 3. Popularity & User-Item Matrix
# -----------------------------
# Popularity scores
popularity = ratings.groupby('resource_id')['weighted_rating'].mean().to_dict()

# Pivot table for SVD
# Handle duplicates by averaging scores if multiple entries exist for (user, resource)
ratings_agg = ratings.groupby(['user_id', 'resource_id'])['weighted_rating'].mean().reset_index()
pivot_table = ratings_agg.pivot(index='user_id', columns='resource_id', values='weighted_rating').fillna(0)
X = pivot_table.values
user_ids = list(pivot_table.index)
resource_ids = list(pivot_table.columns)
user_to_idx = {u: i for i, u in enumerate(user_ids)}
res_to_idx = {r: i for i, r in enumerate(resource_ids)}

# -----------------------------
# 4. Train SVD (Collaborative Filtering)
# -----------------------------
mask_test = X > 0
test_indices = np.where(mask_test)
n_known = len(test_indices[0])

if n_known > 5:
    np.random.seed(42)
    test_size = 0.2
    n_test = int(n_known * test_size)
    test_idx = np.random.choice(range(n_known), n_test, replace=False)
    X_train = X.copy()
    y_true = []
    test_pairs = []
    for i in test_idx:
        r, c = test_indices[0][i], test_indices[1][i]
        y_true.append(X[r, c])
        test_pairs.append((r, c))
        X_train[r, c] = 0
else:
    X_train = X
    y_true = []
    test_pairs = []

n_components = min(20, min(X.shape) - 1)
n_components = max(n_components, 1)
svd = TruncatedSVD(n_components=n_components, random_state=42)
U = svd.fit_transform(X_train)
Sigma = svd.singular_values_
VT = svd.components_
preds_matrix = np.dot(np.dot(U, np.diag(Sigma)), VT)

# Clip predictions to rating range
preds_matrix = np.clip(preds_matrix, 1, 5)

# -----------------------------
# 5. Evaluate Model
# -----------------------------
if test_pairs:
    y_pred = [preds_matrix[r, c] for r, c in test_pairs]
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    print(f"Test RMSE: {rmse:.4f}, Test MAE: {mae:.4f}")
else:
    print("Not enough data for evaluation metrics.")

# -----------------------------
# 6. Hybrid Recommendation Function
# -----------------------------
def recommend_top_n(user_id, available_resource_ids, n=10, w_svd=0.5, w_pop=0.5):
    """
    Hybrid top-N recommendation:
    final_score = weighted combination of SVD prediction + Popularity
    """
    scores = []
    u_idx = user_to_idx.get(user_id)
    for res_id in available_resource_ids:
        svd_score = preds_matrix[u_idx, res_to_idx[res_id]] if (u_idx is not None and res_id in res_to_idx) else 0
        pop_score = popularity.get(res_id, 3.0)
        final_score = w_svd * svd_score + w_pop * pop_score
        final_score = np.clip(final_score, 1, 5)  # ensure score is within range
        scores.append((res_id, final_score))
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:n]

# Example Usage
if user_ids:
    user_example = user_ids[0]
    top_resources = recommend_top_n(user_example, resource_ids, n=10)
    print(f"Top 10 Hybrid Recommendations for user {user_example}:", top_resources)

# -----------------------------
# 7. Save/Update Model Automatically
# -----------------------------
output_path = os.path.join(base_dir, '../backend/services/recommendation_model.pkl')

# Backup old model
if os.path.exists(output_path):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(base_dir, f'../backend/recommendation_model_backup_{timestamp}.pkl')
    os.rename(output_path, backup_path)
    print(f"Previous model backed up: {backup_path}")

# Save new model
model_data = {
    'preds_matrix': preds_matrix,
    'user_mapping': user_to_idx,
    'res_mapping': res_to_idx,
    'popularity': popularity
}
with open(output_path, 'wb') as f:
    pickle.dump(model_data, f)
print(f"Hybrid SVD model saved/updated: {output_path}")
