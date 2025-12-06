import sys
import os

# Add current directory to path so we can import models and recommender
sys.path.append(os.getcwd())

from recommender import Recommender
# We don't strictly need app/db to test the pickle load, but models needs to be importable
try:
    from models import Resource
except ImportError as e:
    print(f"Import Error: {e}")

print("--- Testing Model Connection ---")

# Initialize Recommender
rec = Recommender()

# Check if model is loaded
if rec.model is not None:
    print("[SUCCESS] ML Model is loaded into the Recommender.")
    
    # Check if it has the expected data
    if 'preds_df' in rec.model:
        df = rec.model['preds_df']
        print(f"[SUCCESS] Prediction Matrix found. Shape: {df.shape}")
        print("Model is ready to serve recommendations.")
    else:
        print("[FAIL] Model loaded but 'preds_df' is missing.")
else:
    print("[FAIL] Recommender could not load the model file.")

print("--------------------------------")
