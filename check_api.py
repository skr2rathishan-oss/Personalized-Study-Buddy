import requests
import json

BASE_URL = "http://localhost:5000"

def test_api():
    # Login as student1
    print("Logging in...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "student1", "password": "password"})
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return
        
        token = resp.json()['token']
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # Get Courses
        print("\nFetching Courses...")
        resp = requests.get(f"{BASE_URL}/courses", headers=headers)
        print("Raw Response:", resp.text)
        courses = resp.json()
        
        if isinstance(courses, dict):
             print("Error: returned dict instead of list.")
             return

        print(f"Found {len(courses)} courses:")
        for c in courses:
            print(f"- {c['name']} (ID: {c['id']})")

        # Check for Web Development
        web_dev = next((c for c in courses if "Web Development" in c['name']), None)
        if not web_dev:
            print("ERROR: Web Development course not found!")
            return

        # Get Topics for Web Dev
        print(f"\nFetching Topics for {web_dev['name']}...")
        resp = requests.get(f"{BASE_URL}/courses/{web_dev['id']}/topics", headers=headers)
        topics = resp.json()
        print(f"Found {len(topics)} topics:")
        for t in topics:
            print(f"- {t['name']} (ID: {t['id']})")
        
        # Check Recommendations for HTML Basics
        html_topic = next((t for t in topics if "HTML" in t['name']), None)
        if html_topic:
            print(f"\nFetching Recommendations for {html_topic['name']}...")
            resp = requests.post(f"{BASE_URL}/recommend", json={
                "course_id": web_dev['id'],
                "topic_id": html_topic['id']
            }, headers=headers)
            resources = resp.json()
            print(f"Found {len(resources)} resources:")
            for r in resources:
                print(f"- {r['title']} ({r['format']}) - Rating: {r['average_rating']}")
    except Exception as e:
        print(f"Error checking API: {e}")

if __name__ == "__main__":
    test_api()
