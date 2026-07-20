import asyncio
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def get_token(client):
    try:
        # Try a few common dummy accounts to get a token
        accounts = [
            ("gaurav@gmail.com", "1234"),
            ("gaurav@gmail.com", "123"),
            ("test@test.com", "1234"),
        ]
        for email, pwd in accounts:
            res = await client.post(f"{BASE_URL}/auth/login", data={"username": email, "password": pwd})
            if res.status_code == 200:
                print(f"Logged in as {email}")
                return res.json()["access_token"]
        return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

async def main():
    async with httpx.AsyncClient() as client:
        token = await get_token(client)
        if not token:
            print("Could not get auth token. Skipping test.")
            return

        headers = {"Authorization": f"Bearer {token}"}
        
        print("\n1. Sending a test question to AI Chat...")
        post_res = await client.post(
            f"{BASE_URL}/ai/chat", 
            json={"message": "Test question from automated script"},
            headers=headers,
            timeout=30.0
        )
        print(f"POST /ai/chat status: {post_res.status_code}")
        
        print("\n2. Getting chat history...")
        hist_res = await client.get(f"{BASE_URL}/ai/chat/history", headers=headers)
        print(f"History count: {len(hist_res.json())}")
        
        print("\n3. Clearing chat history...")
        del_res = await client.delete(f"{BASE_URL}/ai/chat/history", headers=headers)
        print(f"DELETE /ai/chat/history status: {del_res.status_code}")
        
        print("\n4. Refreshing chat history (simulating page refresh)...")
        refresh_res = await client.get(f"{BASE_URL}/ai/chat/history", headers=headers)
        final_history = refresh_res.json()
        print(f"Final History count: {len(final_history)}")
        if len(final_history) == 0:
            print("✅ SUCCESS! Chat history is completely empty after refresh.")
        else:
            print("❌ FAILED! Chat history still contains messages.")
            print(final_history)

if __name__ == "__main__":
    asyncio.run(main())
