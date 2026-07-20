@echo off
echo Starting LifeOS Backend and Chatbot...

cd /d "%~dp0"

echo Starting FastAPI Backend...
start cmd /k "venv\Scripts\activate && cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo Starting AI Chatbot...
start cmd /k "venv\Scripts\activate && cd backend\chatbot && python app.py"

echo Both services have been started in new windows.
echo Frontend is already running via Live Server at http://127.0.0.1:5500/frontend/
echo.
echo API Docs: http://localhost:8000/docs
echo.
pause
