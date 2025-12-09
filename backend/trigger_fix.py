import requests
import time

url = "http://localhost:5000/api/fix-admin"
print(f"Calling {url}...")
try:
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
