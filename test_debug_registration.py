import requests
import time
import random

BASE_URL = "http://127.0.0.1:5000"
# Use a semi-random demo number ending in 1234567 to trigger bypass
# Prefix 077 + 2 random digits + 1234567 (Wait, length constraint?)
# Let's just use a fixed but different one or random.
import random
suffix = "1234567"
prefix = f"077{random.randint(10,99)}" 
DEMO_PHONE = f"{prefix}{suffix}" # e.g. 077991234567 (This might be too long for SL phones? SL is 10 digits usually: 07x xxxxxxx)
# Standard SL Mobile: 077 1234567 (10 digits).
# So we need to end with 1234567. 
# 07 + X + 1234567 = 10 digits.
digits = "07" + str(random.randint(0,9)) + "1234567"
DEMO_PHONE = digits
DEMO_OTP = "123456"

def debug_registration_flow():
    print(f"--- Starting Detailed Debug Registration Flow ---")
    print(f"Target Server: {BASE_URL}")
    print(f"Phone: {DEMO_PHONE}")
    
    # Step 1: Request OTP
    print(f"\n[STEP 1] Requesting OTP...")
    try:
        otp_resp = requests.post(f"{BASE_URL}/auth/otp/send", json={
            "phone_number": DEMO_PHONE,
            "purpose": "registration"
        })
        print(f"Status: {otp_resp.status_code}")
        print(f"Body: {otp_resp.text}")
        
        if otp_resp.status_code != 200:
            print("❌ STOP: OTP Request Failed.")
            return
    except Exception as e:
        print(f"❌ ERROR: Failed to connect for Step 1: {e}")
        return

    # Step 2: Verify OTP
    print(f"\n[STEP 2] Verifying OTP...")
    try:
        verify_resp = requests.post(f"{BASE_URL}/auth/otp/verify", json={
            "identifier": DEMO_PHONE,
            "otp": DEMO_OTP
        })
        print(f"Status: {verify_resp.status_code}")
        print(f"Body: {verify_resp.text}")

        if verify_resp.status_code != 200:
            print("❌ STOP: OTP Verification Failed.")
            return
    except Exception as e:
         print(f"❌ ERROR: Failed to connect for Step 2: {e}")
         return

    # Step 3: Register
    print(f"\n[STEP 3] Calling Register Endpoint...")
    # Create a unique email to ensure we aren't blocked by email uniqueness constraint
    unique_email = f"debug_user_{random.randint(1000,9999)}_{int(time.time())}@example.com"
    
    payload = {
        "email": unique_email,
        "password": "password123",
        "first_name": "Debug",
        "last_name": "User",
        "phone_number": DEMO_PHONE,
        "otp": DEMO_OTP,
        "university": "Debug University",
        "university_course": "Debug Science",
        "nic": f"{random.randint(100000000,999999999)}V"
    }
    
    try:
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
        print(f"Status: {reg_resp.status_code}")
        print(f"Body: {reg_resp.text}")
        
        if reg_resp.status_code in [200, 201]:
             print(f"\n✅ SUCCESS: Registration logic is working correctly.")
        elif "already exists" in reg_resp.text:
             print(f"\n⚠️ NOTE: User already exists. This confirms the logic IS reachable but blocked by existing data.")
        else:
             print(f"\n❌ FAILURE: Registration blocked/failed with unexpected error.")
             
    except Exception as e:
         print(f"❌ ERROR: Failed to connect for Step 3: {e}")

if __name__ == "__main__":
    debug_registration_flow()
