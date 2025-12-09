import requests
import sys

def test_login(username, password):
    try:
        url = "http://localhost:5000/auth/login"
        payload = {"username": username, "password": password}
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            print(f"[PASS] {username}")
        else:
            print(f"[FAIL] {username} - {response.status_code}")
    except Exception as e:
        print(f"[ERR] {username} - {e}")

if __name__ == "__main__":
    print("Testing Logins...")
    test_login("admin1", "password")
    test_login("manager1", "password")
    test_login("student1", "password")
