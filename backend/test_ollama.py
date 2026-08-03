import requests
import json

url = "http://localhost:11434/api/generate"

# A 1x1 black pixel in base64
dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

payload = {
    "model": "llava",
    "prompt": "Analyze this image of food/meal. Estimate the nutritional content. Return ONLY a valid JSON object in the following format: {\"name\": \"dish name\", \"calories\": 500, \"protein\": 20, \"carbs\": 50, \"fats\": 10, \"sodium\": 200}",
    "images": [dummy_image],
    "stream": False,
    "format": "json"
}

try:
    response = requests.post(url, json=payload)
    print("STATUS CODE:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        result_text = data.get("response", "")
        print("RAW RESPONSE:", result_text)
        try:
            parsed = json.loads(result_text)
            print("SUCCESSFULLY PARSED JSON:", parsed)
        except Exception as e:
            print("JSON PARSE ERROR:", e)
    else:
        print("ERROR RESPONSE:", response.text)
except Exception as e:
    print("REQUEST EXCEPTION:", e)
