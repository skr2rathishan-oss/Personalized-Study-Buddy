import requests
import sys

BASE_URL = "http://127.0.0.1:5000"

users = [
    ("student1", "password123"),
    ("admin1", "password123"),
    ("manager1", "password")
]

print(f"Testing login at {BASE_URL}...")

for username, password in users:
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        if resp.status_code == 200:
            print(f"[SUCCESS] {username}: Login successful. Role: {resp.json().get('role')}")
        else:
            print(f"[FAILED] {username}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[ERROR] {username}: {e}")
