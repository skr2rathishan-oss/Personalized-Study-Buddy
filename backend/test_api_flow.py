import requests
import json
import time

BASE_URL = "http://localhost:5000"

def run_tests():
    print("=== Starting API Health Check ===\n")

    # 1. Login
    print("[1] Testing Authentication...")
    try:
        auth_payload = {"username": "student1", "password": "password"}
        res = requests.post(f"{BASE_URL}/auth/login", json=auth_payload)
        if res.status_code == 200:
            token = res.json().get('token')
            print("    [PASS] Login successful. Token received.")
        else:
            print(f"    [FAIL] Login failed: {res.text}")
            return
    except Exception as e:
        print(f"    [FAIL] Server not reachable? Error: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Recommendation - Scenario A: Full Context (Topic ID 1 - Loops)
    print("\n[2] Testing Recommendation (Topic Context)...")
    try:
        # Assuming Topic 1 exists from init_db
        payload = {"topic_id": 1} 
        res = requests.post(f"{BASE_URL}/recommend", json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"    [PASS] Success. Received {len(data)} recommendations.")
            if len(data) > 0:
                print(f"           Sample: {data[0]['title']}")
        else:
            print(f"    [FAIL] Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"    [FAIL] Error: {e}")

    # 3. Test Recommendation - Scenario B: Search Only (Agent Mode)
    print("\n[3] Testing Recommendation (Search Query Only - 'Agent Mode')...")
    try:
        # This tests the "Minimum one input" fix
        payload = {
            "search_query": "learn recursion in python",
            "course_id": None,
            "topic_id": None
        } 
        res = requests.post(f"{BASE_URL}/recommend", json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"    [PASS] Success. Received {len(data)} recommendations.")
            if len(data) > 0:
                # Check if it fetched real internet results (mock or real)
                print(f"           Sample: {data[0]['title']}")
                print(f"           Source: {data[0].get('source')}")
        else:
            print(f"    [FAIL] Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"    [FAIL] Error: {e}")

    # 4. Test Recommendation - Scenario C: Course + Search (Context Aware)
    print("\n[4] Testing Recommendation (Course + Search Query)...")
    try:
        # This tests the "Module Name" context injection logic
        # Assuming Course 1 exists (Programming Basics)
        payload = {
            "search_query": "functions",
            "course_id": 1,
            "topic_id": None
        }
        res = requests.post(f"{BASE_URL}/recommend", json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"    [PASS] Success. Received {len(data)} recommendations.")
            if len(data) > 0:
                print(f"           Sample: {data[0]['title']}")
        else:
            print(f"    [FAIL] Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"    [FAIL] Error: {e}")

    print("\n=== Test Complete ===")

if __name__ == "__main__":
    run_tests()
