import urllib.request
import json

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/auth/login",
    data=json.dumps({"email": "test@example.com", "password": "password"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        token = data["access_token"]
        print("Got token")
        
        req2 = urllib.request.Request(
            "http://127.0.0.1:8000/api/v1/appointments",
            data=json.dumps({
                "doctor": "Dr. Smith",
                "specialty": "General Physician",
                "hospital": "City Hospital",
                "date": "2026-07-20",
                "time": "10:00",
                "notes": "Testing",
                "status": "upcoming"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
        )
        try:
            with urllib.request.urlopen(req2) as res2:
                print("Success:", res2.read().decode())
        except urllib.error.HTTPError as e:
            print("Error on create:", e.code, e.read().decode())
except urllib.error.HTTPError as e:
    print("Error on login:", e.code, e.read().decode())
