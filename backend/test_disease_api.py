import httpx

url = "http://127.0.0.1:8000/api/v1/admin/diseases"
payload = {
    "name": "Test Disease",
    "symptoms": ["headache"],
    "causes": ["viral"],
    "treatment": "rest",
    "severity": "Mild",
    "emergency_level": "Low",
    "risk_factors": ["age"],
    "home_remedies": ["water"],
    "doctor_recommendation": "see a doctor",
    "related_diseases": ["flu"]
}

try:
    # Need auth token for admin? 
    # Ah wait, the endpoint is /admin/diseases. Is it protected?
    # Let's check admin_disease.py. It has no dependencies for auth in the router definition except db.
    response = httpx.post(url, json=payload)
    print("Status:", response.status_code)
    print("Body:", response.text)
except Exception as e:
    print("Error:", str(e))
