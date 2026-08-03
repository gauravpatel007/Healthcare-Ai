import os
import json
from dotenv import load_dotenv
import urllib.request

load_dotenv()
api_key = os.environ.get("GROQ_API_KEY")

if not api_key:
    print("GROQ_API_KEY not found in .env")
else:
    req = urllib.request.Request("https://api.groq.com/openai/v1/models")
    req.add_header("Authorization", f"Bearer {api_key}")
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        vision_models = [m["id"] for m in data["data"] if "vision" in m["id"].lower() or "llava" in m["id"].lower() or "qwen" in m["id"].lower()]
        print("Available Vision Models:")
        for m in vision_models:
            print("-", m)
    except Exception as e:
        print("Error fetching models:", e)
