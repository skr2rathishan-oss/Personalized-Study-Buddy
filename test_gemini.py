import os
import google.generativeai as genai
from dotenv import load_dotenv
import sys

# Load from backend folder
env_path = os.path.join("backend", ".env")
load_dotenv(env_path)

key = os.getenv('GEMINI_API_KEY')
print(f"Checking Key from: {env_path}")
print(f"Loaded Key: {key[:8]}...{key[-4:] if key else 'None'}")

if not key:
    print("ERROR: No GEMINI_API_KEY found in .env file.")
    sys.exit(1)

genai.configure(api_key=key)

try:
    print("Checking for 'gemini-1.5-flash'...")
    found_flash = False
    all_models = []
    
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            all_models.append(m.name)
            if 'gemini-1.5-flash' in m.name:
                found_flash = True
                print(f"FOUND: {m.name}")
    
    if found_flash:
        print("SUCCESS: gemini-1.5-flash is available!")
    else:
        print("WARNING: gemini-1.5-flash NOT found.")
        print("Available models:")
        for m in all_models:
            print(f" - {m}")
            
except Exception as e:
    print(f"FAILURE: {e}")
except Exception as e:
    print(f"FAILURE: Gemini API Key rejected or Error.")
    print(f"Error Details: {e}")
