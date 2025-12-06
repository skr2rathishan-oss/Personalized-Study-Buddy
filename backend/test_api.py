import requests
import json
import time

BASE_URL = "http://localhost:5000"

def print_response(response):
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def run_test():
    session = requests.Session()
    
    # 1. Send OTP
    print("--- 1. Sending OTP ---")
    phone = "1234567890"
    res = session.post(f"{BASE_URL}/auth/otp/send", json={"phone_number": phone})
    print(f"Status: {res.status_code}")
    print_response(res)
    
    if res.status_code != 200:
        print("Failed to send OTP")
        return

    # 2. Register
    print("\n--- 2. Registering User ---")
    email = f"test_user_{int(time.time())}@example.com"
    password = "password123"
    payload = {
        "email": email,
        "password": password,
        "phone_number": phone,
        "otp": "123456",
        "first_name": "Test",
        "last_name": "User",
        "role": "student"
    }
    res = session.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"Status: {res.status_code}")
    print_response(res)
    
    # If already exists, we can still login
    
    # 3. Login
    print("\n--- 3. Logging In ---")
    login_payload = {
        "username": email,
        "password": password
    }
    res = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    print(f"Status: {res.status_code}")
    print_response(res)
    
    if res.status_code != 200:
        print("Login failed")
        return
    
    token = res.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 4. Get Courses
    print("\n--- 4. Fetching Courses ---")
    res = session.get(f"{BASE_URL}/courses", headers=headers)
    print(f"Status: {res.status_code}")
    print_response(res)
    
    courses = res.json()
    if not courses:
        print("No courses found. creating one...")
        # Need admin to create course, skipping for now or assume data exists
        return

    course_id = courses[0]['id']
    
    # 5. Get Topics
    print(f"\n--- 5. Fetching Topics for Course {course_id} ---")
    res = session.get(f"{BASE_URL}/courses/{course_id}/topics", headers=headers)
    print(f"Status: {res.status_code}")
    print_response(res)
    
    topics = res.json()
    if not topics:
        print("No topics found.")
        return
        
    topic_id = topics[0]['id']
    
    # 6. Get Recommendations
    print(f"\n--- 6. Getting Recommendations for Topic {topic_id} ---")
    rec_payload = {
        "course_id": course_id,
        "topic_id": topic_id,
        "format": "video" # Testing if format breaks it
    }
    res = session.post(f"{BASE_URL}/recommend", json=rec_payload, headers=headers)
    print(f"Status: {res.status_code}")
    
    with open('backend/response.json', 'w', encoding='utf-8') as f:
        json.dump(res.json(), f, indent=4)
    print("Saved response to backend/response.json")
    
    # 7. Get Recommendations (New API)

    print(f"\n--- 7. Getting Recommendations (New API) for Topic {topic_id} ---")
    res = session.get(f"{BASE_URL}/api/recommendations?topic_id={topic_id}", headers=headers)
    print(f"Status: {res.status_code}")
    print_response(res)

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test Execution Failed: {e}")
