import os
import openai
from dotenv import load_dotenv
import sys

# Load from backend folder
env_path = os.path.join("backend", ".env")
load_dotenv(env_path)

key = os.getenv('OPENAI_API_KEY')
print(f"Checking Key from: {env_path}")
print(f"Loaded Key: {key[:8]}...{key[-4:] if key else 'None'}")

if not key:
    print("ERROR: No OPENAI_API_KEY found in .env file.")
    sys.exit(1)

from openai import OpenAI

# ... (env loading same) ...
if not key:
    print("ERROR")
    sys.exit(1)

client = OpenAI(api_key=key)

try:
    print("Sending test request to OpenAI...")
    resp = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Test"}],
        max_tokens=5
    )
    print("SUCCESS: API Key is working!")
    print(f"Response: {resp.choices[0].message.content}")
except Exception as e:
    print(f"FAILURE: API Key rejected.")
    print(f"Error Details: {e}")
