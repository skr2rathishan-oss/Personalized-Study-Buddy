import requests
import os
from dotenv import load_dotenv

# Load Env
load_dotenv()

APP_ID = os.getenv('MSPACE_APP_ID')
PASSWORD = os.getenv('MSPACE_PASSWORD')
URL = "https://api.mspace.lk/otp/request"

# Hardcode your number for testing (change this if needed)
TEST_NUMBER = "tel:94703020635" 

print(f"--- MSPACE OTP TESTER ---")
print(f"App ID: {APP_ID}")
print(f"Target: {TEST_NUMBER}")

# Brute Force Variations to SOLVE E1312
variations = [
    {
        "name": "Variation A: appCode = APP_ID",
        "payload": {
            "applicationId": APP_ID,
            "password": PASSWORD,
            "subscriberId": TEST_NUMBER,
            "applicationMetaData": {
                "client": "WEB",
                "device": "Browser",
                "os": "Web",
                "appCode": APP_ID  # Try using the App ID itself
            }
        }
    },
    {
        "name": "Variation B: appCode = 'WEB'",
        "payload": {
            "applicationId": APP_ID,
            "password": PASSWORD,
            "subscriberId": TEST_NUMBER,
             "applicationMetaData": {
                "client": "WEB",
                "device": "Browser",
                "os": "Web",
                "appCode": "WEB"
            }
        }
    },
    {
        "name": "Variation C: appCode = 'hash123'",
        "payload": {
            "applicationId": APP_ID,
            "password": PASSWORD,
            "subscriberId": TEST_NUMBER,
             "applicationMetaData": {
                "client": "WEB",
                "device": "Browser",
                "os": "Web",
                "appCode": "hash123"
            }
        }
    },
    {
        "name": "Variation D: appCode = '009650' (ID without prefix)",
        "payload": {
            "applicationId": APP_ID,
            "password": PASSWORD,
            "subscriberId": TEST_NUMBER,
             "applicationMetaData": {
                "client": "WEB",
                "device": "Browser",
                "os": "Web",
                "appCode": "009650"
            }
        }
    }
]

for v in variations:
    print(f"\n--- Testing {v['name']} ---")
    try:
        response = requests.post(URL, json=v['payload'], headers={"Content-Type": "application/json"})
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text}")
        
        if response.status_code == 200 and response.json().get('statusCode') == 'S1000':
            print("✅ SUCCESS! OTP SENT.")
            break
        else:
            print("❌ FAILED")

    except Exception as e:
        print(f"EXCEPTION: {e}")

