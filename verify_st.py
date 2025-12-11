
try:
    from sentence_transformers import SentenceTransformer
    print("SentenceTransformers imported successfully.")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error: {e}")
