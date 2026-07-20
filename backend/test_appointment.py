import asyncio
import httpx

async def test_create_appointment():
    # Login first
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Assuming the seed user credentials
        login_res = await client.post("/auth/login", data={"username": "demo@lifeos.com", "password": "password"})
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
        token = login_res.json()["access_token"]
        
        # Test creating appointment
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "doctor": "Dr. Test",
            "specialty": "General Physician",
            "hospital": "Test Hospital",
            "date": "2026-07-20",
            "time": "10:00",
            "notes": "",
            "status": "upcoming"
        }
        res = await client.post("/appointments", json=payload, headers=headers)
        print("Status code:", res.status_code)
        print("Response:", res.text)

if __name__ == "__main__":
    asyncio.run(test_create_appointment())
