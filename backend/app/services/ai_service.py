"""
LifeOS Backend — AI Service (Groq Integration)
Central AI client with module-specific prompts and fallback responses.
"""

import logging
from typing import Optional

from app.config import get_settings

logger = logging.getLogger("lifeos.ai")

settings = get_settings()

# ─── Groq Client Initialization ─────────────────────────────────────

_groq_client = None


def _get_groq_client():
    """Lazy-load the Groq client."""
    global _groq_client
    if _groq_client is None and settings.GROQ_API_KEY:
        try:
            from groq import Groq
            _groq_client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq AI client initialized successfully")
        except Exception as e:
            logger.warning("Failed to initialize Groq client: %s", e)
    return _groq_client


# ─── System Prompts ──────────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "assistant": (
        "Respond in clean, professional Markdown with a maximum of 6–8 lines by default. "
        "Keep answers concise and easy to scan. Use **bold** for medicine names, diseases, dosages, warnings, and key medical terms. "
        "Use short bullet points (not paragraphs) and never output a wall of text. "
        "Follow this format unless the user requests more details:\n\n"
        "**[Medicine/Disease Name]**\n\n"
        "**Overview:** One short sentence.\n"
        "**Uses:** 2–3 key uses.\n"
        "**Dosage:** Mention only the recommended dose (if applicable).\n"
        "**Side Effects:** List 2–3 common ones.\n"
        "**Warning:** One important precaution.\n"
        "**Summary:** One-line takeaway."
    ),
    "symptom": (
        "You are a medical symptom analysis AI. Given a list of symptoms, duration, and severity, "
        "provide: 1) Possible conditions with estimated likelihood percentages, "
        "2) Recommended medical specialists, 3) Urgency level (Low/Medium/High), "
        "4) General care recommendations. Always include a disclaimer that this is not a diagnosis. "
        "Format the response as structured JSON with keys: urgency, conditions (list of {condition, probability}), "
        "specialists (list), recommendations (list)."
    ),
    "nutrition": (
        "You are a nutrition expert AI. Based on user profile (age, weight, height, gender, conditions, allergies), "
        "provide personalized meal suggestions, dietary recommendations, and nutritional advice. "
        "Focus on Indian vegetarian cuisine when relevant. Include calorie and protein estimates."
    ),
    "fitness": (
        "You are a fitness coach AI. Provide personalized workout suggestions based on user profile. "
        "Include exercise descriptions, sets/reps, duration, and estimated calories burned. "
        "Consider any health conditions the user has. Offer motivation and safety tips."
    ),
    "mental": (
        "You are a compassionate mental health support AI. Analyze mood patterns and journal entries. "
        "Provide supportive insights, coping strategies, and wellness recommendations. "
        "For concerning patterns, always recommend professional help. "
        "Include Indian helpline numbers when appropriate (iCall: 9152987821)."
    ),
    "report_parser": (
        "You are a highly accurate medical data extraction AI. Given the raw text extracted from a medical lab report, "
        "your job is to extract specific key health metrics and return them in a strict JSON format. "
        "Look for metrics like Hemoglobin (g/dL), Blood Sugar/Glucose (mg/dL), Total Cholesterol (mg/dL), "
        "HDL, LDL, Triglycerides, Vitamin D (ng/mL), Blood Pressure (Systolic/Diastolic mmHg), and Weight (kg). "
        "Format your response as a valid JSON object where keys are the metric names and values are the numeric findings. "
        "Do NOT include units in the values, just numbers. Example JSON: {\"Hemoglobin\": 14.2, \"Blood Sugar\": 95, \"Cholesterol\": 180}. "
        "If a metric is not found, do not include it in the JSON."
    ),
}


# ─── Core AI Function ────────────────────────────────────────────────

async def generate_ai_response(
    module: str,
    user_message: str,
    context: str = "",
    max_tokens: int = 1024,
) -> str:
    """
    Generate an AI response using Groq API.
    Falls back to a generic response if Groq is unavailable.
    """
    client = _get_groq_client()

    if client is None:
        logger.info("Groq client not available, using fallback response")
        return _get_fallback_response(module, user_message)

    system_prompt = SYSTEM_PROMPTS.get(module, SYSTEM_PROMPTS["assistant"])
    if context:
        system_prompt += f"\n\nUser Health Context:\n{context}"

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            model=settings.GROQ_MODEL,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        response = chat_completion.choices[0].message.content
        logger.info("Groq AI response generated for module: %s", module)
        return response

    except Exception as e:
        logger.error("Groq API error: %s", e)
        return _get_fallback_response(module, user_message)


async def generate_json_response(
    module: str,
    user_message: str,
    context: str = "",
    max_tokens: int = 1024,
) -> dict:
    """
    Generate an AI response strictly formatted as a JSON object.
    """
    import json
    client = _get_groq_client()

    if client is None:
        logger.warning("Groq client not available for JSON extraction.")
        return {}

    system_prompt = SYSTEM_PROMPTS.get(module, SYSTEM_PROMPTS["assistant"])
    if context:
        system_prompt += f"\n\nContext:\n{context}"

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            model=settings.GROQ_MODEL,
            max_tokens=max_tokens,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        response_text = chat_completion.choices[0].message.content
        return json.loads(response_text)

    except Exception as e:
        logger.error("Groq JSON API error: %s", e)
        return {"_error": str(e)}


# ─── Fallback Responses ─────────────────────────────────────────────

def _get_fallback_response(module: str, message: str) -> str:
    """Provide local fallback responses when Groq API is unavailable."""
    q = message.lower()

    if module == "assistant":
        return _fallback_assistant(q)
    elif module == "symptom":
        return '{"urgency":"Medium","conditions":[{"condition":"Please consult a doctor for accurate diagnosis","probability":0}],"specialists":["General Physician"],"recommendations":["Stay hydrated","Rest well","Monitor your symptoms","Consult a healthcare professional"]}'
    elif module == "nutrition":
        return "Based on your profile, aim for a balanced diet with adequate protein, complex carbs, and healthy fats. Drink plenty of water and eat 5 servings of fruits and vegetables daily. Consult a nutritionist for a personalized meal plan."
    elif module == "fitness":
        return "For a balanced fitness routine, aim for 150 minutes of moderate cardio per week, 2-3 strength training sessions, and daily stretching. Start slow and gradually increase intensity. Always warm up before exercise and cool down after."
    elif module == "mental":
        return "Thank you for sharing. Remember that it's completely normal to have ups and downs. Practice self-care, maintain social connections, and consider journaling regularly. If you're struggling, please reach out to a mental health professional. Helpline: 9152987821 (iCall)."

    return "I'm here to help with your health questions. Please try again or consult a healthcare professional for specific medical advice."


def _fallback_assistant(q: str) -> str:
    """Keyword-based fallback for the chat assistant."""
    if any(w in q for w in ["paracetamol", "acetaminophen"]):
        return "Paracetamol (Acetaminophen) is used for pain relief and fever reduction. Usual adult dose: 500mg-1g every 4-6 hours. Max: 4g/day. Avoid with alcohol."
    if any(w in q for w in ["headache", "head pain"]):
        return "Headache Management:\n• Stay hydrated\n• Rest in a dark, quiet room\n• Take paracetamol or ibuprofen\n• Apply cold compress\n\n⚠️ See a doctor if severe, sudden, or with fever/vision changes."
    if any(w in q for w in ["fever", "temperature"]):
        return "Fever Management:\n• Rest and stay hydrated\n• Take paracetamol or ibuprofen\n• Use lukewarm sponge bath\n• Wear light clothing\n\n⚠️ Seek help if >103°F or lasting >3 days."
    if any(w in q for w in ["burn", "burnt"]):
        return "Burns First Aid:\n1. Cool under running water for 20 min\n2. Remove jewelry (if not stuck)\n3. Cover with sterile dressing\n4. Do NOT apply ice/butter/toothpaste\n5. Take paracetamol for pain"
    if any(w in q for w in ["hello", "hi ", "hey"]):
        return "Hello! I'm your LifeOS AI Health Assistant. How can I help you today? Ask me about medicines, first aid, or health concerns."
    if "tip" in q or "advice" in q:
        return "💡 Health Tip: Drink at least 8 glasses of water daily, take a 30-minute walk, get 7-9 hours of sleep, and eat 5 servings of fruits and vegetables daily."

    return f'I understand you\'re asking about "{q}". For the most accurate information, please consult a healthcare professional. I can help with medicine info, first aid guidance, and general health tips.'
