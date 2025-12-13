import requests
import time

BASE_URL = "http://127.0.0.1:5000"
DEMO_PHONE = "0771234567"  # Ends in 1234567 triggers demo mode
DEMO_OTP = "123456"

def test_full_flow():
    print(">>> 1. Requesting OTP (Demo Mode)...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/otp/send", json={
            "phone_number": DEMO_PHONE,
            "purpose": "registration"
        })
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        
        if resp.status_code != 200:
            print("Failed to send OTP.")
            return

        print("\n>>> 2. Verifying OTP...")
        resp = requests.post(f"{BASE_URL}/auth/otp/verify", json={
            "identifier": DEMO_PHONE,
            "otp": DEMO_OTP
        })
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")

        if resp.status_code != 200:
            print("Failed to verify OTP.")
            return

        print("\n>>> 3. Registering User...")
        # Randomize email to allow repeated tests
        email = f"testuser_{int(time.time())}@example.com"
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email,
            "password": "password123",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": DEMO_PHONE,
            "otp": DEMO_OTP,
            "university": "Test Uni",
            "university_course": "Test Degree",
            "nic": "123456789V"
        })
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")

        if resp.status_code == 200:
            print("\n✅ SUCCESS: Logic is working correctly (using Demo bypass)!")
        elif "already exists" in resp.text:
             print("\n✅ SUCCESS: Logic is working (User already registered)!")
        else:
            print("\n❌ FAILURE: Registration failed.")

    except Exception as e:
        print(f"\n❌ ERROR: Could not connect to server. Is it running? {e}")

if __name__ == "__main__":
    test_full_flow()
