import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'app'))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db

client = TestClient(app)

# We need a token or we can override the dependency
from app.dependencies import get_current_user

def override_get_current_user():
    return type("User", (), {"id": "test_user_id"})()

app.dependency_overrides[get_current_user] = override_get_current_user

# Let's override db dependency too if we want to hit a real or test DB?
# Actually we just want to see if validation fails! Validation happens before DB is hit!
# If it's a validation error, we will get 422 Unprocessable Entity!

payload = {
  "id": "some-id",
  "user_id": "test_user_id",
  "title": "Blood Test",
  "category": "Imaging",
  "doctor": None,
  "hospital": None,
  "date": "2026-07-08",
  "findings": "Hemoglobin: 13.2",
  "notes": None,
  "file_path": None,
  "created_at": "2026-07-20T11:12:34",
  "updated_at": "2026-07-20T11:12:34"
}

response = client.put("/api/v1/records/some-id", json=payload)
print(response.status_code)
print(response.json())
