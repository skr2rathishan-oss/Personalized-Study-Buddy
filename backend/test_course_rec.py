import requests
import json
import time

BASE_URL = "http://localhost:5000"

def run_test():
    session = requests.Session()
    
    # 1. Login
    print("\n--- 1. Logging In ---")
    login_payload = {
        "username": "test_user_1765040539@example.com",
        "password": "password123"
    }
    # Try to re-use previous account or register new one if needed, but for now assuming it exists from previous run
    # If not, we can fail gracefully or register again.
    
    res = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    if res.status_code != 200:
        # Register if login fails (previous db might be gone if it was in memory, but here it's sqlite file)
        # Using a new email just in case
        email = f"test_user_{int(time.time())}@example.com"
        print(f"Login failed, registering new user {email}")
        
        # OTP
        session.post(f"{BASE_URL}/auth/otp/send", json={"phone_number": "123"})
        
        # Register
        session.post(f"{BASE_URL}/auth/register", json={
            "email": email,
            "password": "password123",
            "phone_number": "123",
            "otp": "123456",
            "role": "student"
        })
        
        # Login again
        res = session.post(f"{BASE_URL}/auth/login", json={"username": email, "password": "password123"})
        
    print(f"Status: {res.status_code}")
    token = res.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Courses
    res = session.get(f"{BASE_URL}/courses", headers=headers)
    courses = res.json()
    if not courses: 
        print("No courses")
        return
    course_id = courses[0]['id']
    
    # 3. Test Course-Only Recommendation
    print(f"\n--- 3. Testing Course-Only Recommendation (Course {course_id}) ---")
    
    # POST
    payload = {"course_id": course_id, "topic_id": None}
    res = session.post(f"{BASE_URL}/recommend", json=payload, headers=headers)
    print(f"POST Status: {res.status_code}")
    if res.status_code == 200:
        print(f"Received {len(res.json())} recommendations")
    else:
        print(f"Error: {res.text}")
        
    # GET
    res = session.get(f"{BASE_URL}/api/recommendations?course_id={course_id}", headers=headers)
    print(f"GET Status: {res.status_code}")
    if res.status_code == 200:
        print(f"Received {len(res.json())} recommendations")
    else:
        print(f"Error: {res.text}")

if __name__ == "__main__":
    run_test()
