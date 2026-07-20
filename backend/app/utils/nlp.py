import os
import json
import logging
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize AsyncOpenAI client pointing to Groq for ultra-fast NLP
client = AsyncOpenAI(
    api_key=os.environ.get("GROQ_API_KEY", os.environ.get("OPENAI_API_KEY", "dummy")),
    base_url="https://api.groq.com/openai/v1"
)

async def parse_voice_command(text: str) -> dict:
    """
    Parses a natural language voice command.
    Detects health logging, UI navigation, form filling, feature triggers, and more.
    """
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set. Cannot parse voice command.")
        return {"type": "unknown", "value": 0, "unit": ""}

    prompt = f"""
    You are an intelligent health app voice assistant. Parse the user's spoken command.
    
    CATEGORY A — HEALTH DATA LOG (user wants to record a metric):
      Types: 'water' (glasses), 'sleep' (hours), 'weight' (kg)
      Return: {{ "type": "<water|sleep|weight>", "value": <number>, "unit": "<string>" }}
      Examples:
      - "log 3 glasses of water" → {{ "type": "water", "value": 3, "unit": "glasses" }}
      - "I slept 7 hours" → {{ "type": "sleep", "value": 7, "unit": "hours" }}

    CATEGORY B — UI ACTION (navigate, open modals, trigger features):
      Return: {{ "type": "action", "target_feature": "<id>", "action_name": "<action>", "data": {{...}} }}
      
      Feature IDs and actions:
      - "appointments": open_page, open_add_modal, fill_form
      - "medicine": open_page, open_add_modal, fill_form
      - "records": open_page, open_add_modal, compare_reports, ai_summary
      - "emergency": open_page, trigger_sos
      - "dashboard": open_page
      - "ai-chat": open_page, send_message
      - "ai-symptom": open_page, check_symptoms
      - "ai-nutrition": open_page, regenerate_plan
      - "ai-fitness": open_page, add_steps, log_exercise
      - "ai-mental": open_page, start_meditation
      - "trackers": open_page
      - "settings": open_page
      - "analytics": open_page
      - "auth": logout

      APPOINTMENT FORM FILLING — when user says things like "set time to 12 PM" or "doctor name is Dr. Sharma" while presumably on the appointment form:
      {{ "type": "action", "target_feature": "appointments", "action_name": "fill_form", "data": {{ "time": "12:00", "doctor": "Dr. Sharma", "date": "2026-07-25", "specialty": "...", "hospital": "...", "notes": "..." }} }}
      Only include fields the user actually mentioned. Omit fields not mentioned.

      MEDICINE FORM FILLING — "set medicine name to Paracetamol, dosage 500mg":
      {{ "type": "action", "target_feature": "medicine", "action_name": "fill_form", "data": {{ "name": "Paracetamol", "dosage": "500mg", "type": "tablet", "frequency": "once_daily", "purpose": "..." }} }}

      COMPARE REPORTS:
      - "compare reports" → {{ "type": "action", "target_feature": "records", "action_name": "compare_reports" }}
      
      AI SUMMARY FOR RECORD:
      - "find AI summary for blood test" → {{ "type": "action", "target_feature": "records", "action_name": "ai_summary", "data": {{ "record_name": "blood test" }} }}

      AI CHAT — send message directly:
      - Any command after "Hey AI" wake word → {{ "type": "action", "target_feature": "ai-chat", "action_name": "send_message", "data": {{ "message": "<the user's question>" }} }}

      SYMPTOM CHECKER:
      - "check symptoms for headache and fever" → {{ "type": "action", "target_feature": "ai-symptom", "action_name": "check_symptoms", "data": {{ "symptoms": ["headache", "fever"], "duration": "1-3 days", "severity": "Moderate", "age_group": "Adult (18-60)" }} }}
      If user specifies duration, severity, age_group, include them. Otherwise use defaults above.
      
      NUTRITION:
      - "regenerate my meal" → {{ "type": "action", "target_feature": "ai-nutrition", "action_name": "regenerate_plan" }}

      FITNESS:
      - "add 1000 steps" → {{ "type": "action", "target_feature": "ai-fitness", "action_name": "add_steps", "data": {{ "steps": 1000 }} }}
      - "I did brisk walking" or "log brisk walking" → {{ "type": "action", "target_feature": "ai-fitness", "action_name": "log_exercise", "data": {{ "exercise": "Brisk Walking", "calories": 150 }} }}
      Use reasonable calorie estimates: Brisk Walking=150, Running=300, Cycling=250, Yoga=120, Swimming=400, Jump Rope=350.

      MENTAL HEALTH:
      - "start deep breathing" → {{ "type": "action", "target_feature": "ai-mental", "action_name": "start_meditation", "data": {{ "meditation": "Deep Breathing" }} }}
      - "start body scan" → {{ "type": "action", "target_feature": "ai-mental", "action_name": "start_meditation", "data": {{ "meditation": "Body Scan" }} }}

      EMERGENCY:
      - "call SOS" / "trigger SOS" → {{ "type": "action", "target_feature": "emergency", "action_name": "trigger_sos" }}

      LOGOUT:
      - "log out" / "logout" / "sign out" → {{ "type": "action", "target_feature": "auth", "action_name": "logout" }}

    CATEGORY C — UNKNOWN:
      {{ "type": "unknown", "value": 0, "unit": "" }}

    User Command: "{text}"
    
    Return ONLY a strict JSON object. No explanation.
    """
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that always outputs valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        result_text = response.choices[0].message.content
        return json.loads(result_text)
    except Exception as e:
        logger.error(f"Failed to parse voice command: {e}")
        return {"type": "unknown", "value": 0, "unit": ""}
