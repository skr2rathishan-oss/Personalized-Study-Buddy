from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import pickle
import sqlite3
import os
# 1. Load Data
base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, '../backend/db.sqlite3')
conn = sqlite3.connect(db_path)
ratings = pd.read_sql_query("SELECT user_id, resource_id, score as rating, time_spent FROM rating", conn)
conn.close()

# 2. Preprocessing
# Normalize engagement
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
ratings['engagement_norm'] = scaler.fit_transform(ratings[['time_spent']])

alpha = 0.6
beta = 0.4
ratings['weighted_rating'] = alpha * (ratings['rating'] / 5) + beta * ratings['engagement_norm']

# Create Pivot Table (Matrix)
# Fill NaN with 0 (assuming 0 means no interaction/low interest)
pivot_table = ratings.pivot(index='user_id', columns='resource_id', values='weighted_rating').fillna(0)

# 3. Model Training (Truncated SVD)
# We need to de-mean the data (normalize by user mean) usually, but for simplicity/SVD matching:
X = pivot_table.values

# Split data for evaluation (Masking some known ratings)
# We flatten the matrix to test known non-zero entries
known_indices = np.where(X > 0)
test_size = 0.2
n_samples = len(known_indices[0])
n_test = int(n_samples * test_size)

# Randomly select indices to mask for testing
np.random.seed(42)
test_idx_in_known = np.random.choice(range(n_samples), n_test, replace=False)

train_X = X.copy()
test_pairs = [] # (row_idx, col_idx, true_val)

for idx in test_idx_in_known:
    r, c = known_indices[0][idx], known_indices[1][idx]
    val = train_X[r, c]
    test_pairs.append((r, c, val))
    train_X[r, c] = 0 # Mask it

# Train SVD on masked matrix
if min(X.shape) < 2:
    print("Not enough data for SVD (need at least 2 users/items). Using placeholder.")
    preds_matrix = np.zeros(X.shape)
else:
    n_components = min(10, min(X.shape) - 1) # Ensure components < min dims
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    U = svd.fit_transform(train_X)
    Sigma = svd.singular_values_
    VT = svd.components_

    # Reconstruct Matrix
    preds_matrix = np.dot(np.dot(U, np.diag(Sigma)), VT)

# 4. Evaluation
y_true = []
y_pred = []

if len(test_pairs) > 0:
    for r, c, val in test_pairs:
        y_true.append(val)
        predicted_val = preds_matrix[r, c]
        y_pred.append(predicted_val)

    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)

    print(f"Test RMSE: {rmse:.4f}")
    print(f"Test MAE: {mae:.4f}")
else:
    print("Not enough data to calculate evaluation metrics.")



# 5. Save Model
# We save the reconstructed prediction matrix for O(1) lookup, 
# or the SVD components if we want to fold in new users (but that's complex).
# For this proposal, saving the prediction matrix dataframe is easiest.
preds_df = pd.DataFrame(preds_matrix, index=pivot_table.index, columns=pivot_table.columns)

model_data = {
    'preds_df': preds_df,
    'user_ids': list(pivot_table.index),
    'resource_ids': list(pivot_table.columns)
}

output_path = os.path.join(base_dir, '../backend/recommendation_model.pkl')
with open(output_path, 'wb') as f:
    pickle.dump(model_data, f)

print(f"Model saved to {output_path}")
