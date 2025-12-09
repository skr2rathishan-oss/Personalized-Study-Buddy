import requests

try:
    url = "http://localhost:5000/auth/login"
    payload = {"username": "admin1", "password": "password"}
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Admin1 login working.")
    else:
        print("FAILURE: Admin1 login failed.")

except Exception as e:
    print(f"Error: {e}")
