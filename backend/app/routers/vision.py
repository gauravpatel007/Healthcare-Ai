import os
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
from app.dependencies import CurrentUserId
from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.admin import AIUsageLog
import time
import logging
import base64
import uuid
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.file_asset import FileAsset

logger = logging.getLogger("lifeos.vision")

router = APIRouter(prefix="/vision", tags=["Vision AI"])
settings = get_settings()

client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY or os.environ.get("OPENAI_API_KEY", "dummy"),
    base_url="https://api.groq.com/openai/v1"
)

class VisionRequest(BaseModel):
    image_data: str  # Base64 string starting with data:image/...
    scan_type: str   # 'food' or 'pill'

@router.get("/models")
async def list_models():
    models = await client.models.list()
    return {"models": [m.id for m in models.data]}

@router.get("/test_groq/{model_name:path}")
async def test_groq(model_name: str):
    import httpx
    groq_api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    base64_img = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    image_url = f"data:image/jpeg;base64,{base64_img}"
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is this?"},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }
        ]
    }
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as http_client:
        response = await http_client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
        return {"status": response.status_code, "text": response.text}

@router.post("/analyze")
async def analyze_image(request: VisionRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Analyze an image using Groq/Gemini Vision API and save it as FileAsset"""
    try:
        # Extract base64 part if it contains the data:image/... prefix
        base64_img = request.image_data
        if base64_img.startswith("data:image"):
            base64_img = base64_img.split(",")[1]
            
        # Save image to file system and FileAsset
        img_bytes = base64.b64decode(base64_img)
        ext = "jpg"
        if request.image_data.startswith("data:image/png"): ext = "png"
        elif request.image_data.startswith("data:image/webp"): ext = "webp"
        
        os.makedirs("uploads/images", exist_ok=True)
        filename = f"vision_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = f"uploads/images/{filename}"
        
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(img_bytes)
            
        file_size = os.path.getsize(filepath)
        new_asset = FileAsset(
            name=f"Vision Scan - {request.scan_type.capitalize()}",
            type=f"image/{ext}",
            category="Images",
            size_bytes=file_size,
            file_path=f"/{filepath}"
        )
        db.add(new_asset)
        await db.commit()

        prompt = ""
        if request.scan_type == "food":
            prompt = """
            Analyze this image of food/meal. Estimate the nutritional content.
            Return ONLY a valid JSON object in the following format:
            {
              "name": "Name of the dish/meal",
              "calories": <integer>,
              "protein": <integer (grams)>,
              "carbs": <integer (grams)>,
              "fats": <integer (grams)>,
              "sodium": <integer (mg)>
            }
            Do not include markdown blocks or any other text.
            """
        elif request.scan_type == "pill":
            prompt = """
            Identify this pill/medication from the image.
            Return ONLY a valid JSON object in the following format:
            {
              "name": "Name of medication",
              "purpose": "Brief description of what it's used for",
              "common_interactions": ["List", "of", "common", "interactions", "or", "warnings"]
            }
            Do not include markdown blocks or any other text.
            """
        else:
            raise HTTPException(status_code=400, detail="Invalid scan_type. Must be 'food' or 'pill'.")

        import httpx
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        
        if gemini_api_key:
            # Use Google Gemini 1.5 Flash API
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            
            mime_type = "image/jpeg"
            if request.image_data.startswith("data:image/png"):
                mime_type = "image/png"
            elif request.image_data.startswith("data:image/webp"):
                mime_type = "image/webp"

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_img
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            }

            async with httpx.AsyncClient() as client:
                start_t = time.time()
                response = await client.post(gemini_url, json=payload, timeout=30.0)
                
                if response.status_code != 200:
                    logger.error(f"Gemini API Error: {response.text}")
                    raise HTTPException(status_code=400, detail="Failed to process image with Gemini")

                resp_data = response.json()
                try:
                    text_content = resp_data["candidates"][0]["content"]["parts"][0]["text"]
                    # Clean markdown if present
                    if text_content.startswith("```json"):
                        text_content = text_content.strip("```json").strip("```").strip()
                    elif text_content.startswith("```"):
                        text_content = text_content.strip("```").strip()
                    
                    parsed_json = json.loads(text_content)
                    
                    # Log AI Usage
                    try:
                        async with AsyncSessionLocal() as db:
                            elapsed_ms = int((time.time() - start_t) * 1000)
                            db.add(AIUsageLog(
                                feature=f"scan_{request.scan_type}", 
                                model_used="gemini-1.5-flash", 
                                prompt_tokens=0, 
                                completion_tokens=0, 
                                response_time_ms=elapsed_ms
                            ))
                            await db.commit()
                    except Exception as log_e:
                        logger.error("Failed to log vision AI usage: %s", log_e)

                    # Save ScannedMeal if food
                    if request.scan_type == "food":
                        from app.models.diet import ScannedMeal
                        new_meal = ScannedMeal(
                            user_id=user_id,
                            name=parsed_json.get("name", "Unknown Meal"),
                            calories=parsed_json.get("calories", 0),
                            protein=parsed_json.get("protein", 0),
                            carbs=parsed_json.get("carbs", 0),
                            fats=parsed_json.get("fats", 0),
                            image_url=f"/{filepath}"
                        )
                        db.add(new_meal)
                        await db.commit()
                        parsed_json["image_url"] = f"/{filepath}"
                        
                    return {"success": True, "data": parsed_json}
                except (KeyError, IndexError, json.JSONDecodeError) as e:
                    logger.error(f"Failed to parse Gemini response: {resp_data} - Error: {e}")
                    raise HTTPException(status_code=500, detail="Invalid response format from Gemini API")
        
        else:
            # Use Groq Vision API (cloud-based, uses existing GROQ_API_KEY)
            groq_api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
            if not groq_api_key:
                raise HTTPException(status_code=500, detail="No vision AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.")

            groq_url = "https://api.groq.com/openai/v1/chat/completions"
            
            mime_type = "image/jpeg"
            if request.image_data.startswith("data:image/png"):
                mime_type = "image/png"
            elif request.image_data.startswith("data:image/webp"):
                mime_type = "image/webp"

            image_url = f"data:{mime_type};base64,{base64_img}"

            payload = {
                "model": "llama-3.2-11b-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt + "\n\nRespond ONLY with a valid JSON block containing the requested keys. Format as:\n```json\n{...}\n```\nDo not include any other text."},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ],
                "temperature": 0.1
            }
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            
            models_to_try = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview", "qwen-2.5-vl-72b-instruct", "qwen/qwen3.6-27b"]
            last_response = None
            
            async with httpx.AsyncClient() as http_client:
                for model_name in models_to_try:
                    payload["model"] = model_name
                    try:
                        response = await http_client.post(groq_url, json=payload, headers=headers, timeout=30.0)
                        if response.status_code == 200:
                            last_response = response
                            break
                        elif response.status_code in [429, 400, 404]:
                            last_response = response
                            continue # Try next model on rate limits or decommissioned/invalid models
                        else:
                            last_response = response
                            break # Other critical errors, break and report
                    except Exception as e:
                        logger.error(f"Failed to connect to Groq Vision API with model {model_name}: {e}")
                        continue
                
                if not last_response:
                    raise HTTPException(status_code=500, detail="Could not connect to Groq Vision API. Check your GROQ_API_KEY.")
                    
                if last_response.status_code != 200:
                    logger.error(f"Groq Vision API Error: {last_response.text}")
                    error_msg = "Unknown error"
                    try:
                        error_msg = last_response.json().get("error", {}).get("message", last_response.text)
                    except:
                        error_msg = last_response.text
                    raise HTTPException(status_code=500, detail=f"Groq Vision API Error: {last_response.status_code} - {error_msg}")
                    
                data = last_response.json()
                result_text = data["choices"][0]["message"]["content"]
        
        # Clean up JSON formatting if the model wrapped it
        # Sometimes models use ```json or just ```
        import re
        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', result_text, re.DOTALL | re.IGNORECASE)
        if json_match:
            result_text = json_match.group(1).strip()
            
        # Try strict parsing first
        try:
            parsed = json.loads(result_text)
            if request.scan_type == "food":
                from app.models.diet import ScannedMeal
                new_meal = ScannedMeal(
                    user_id=user_id,
                    name=parsed.get("name", "Unknown Meal"),
                    calories=parsed.get("calories", 0),
                    protein=parsed.get("protein", 0),
                    carbs=parsed.get("carbs", 0),
                    fats=parsed.get("fats", 0),
                    image_url=f"/{filepath}"
                )
                db.add(new_meal)
                await db.commit()
                parsed["image_url"] = f"/{filepath}"
            return {"success": True, "data": parsed}
        except json.JSONDecodeError:
            # Fallback: try to extract just the first { to the last }
            match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if match:
                try:
                    # Sometimes models forget commas between keys. We can't perfectly fix all,
                    # but extracting the block usually fixes trailing/leading garbage.
                    parsed = json.loads(match.group(0))
                    if request.scan_type == "food":
                        from app.models.diet import ScannedMeal
                        new_meal = ScannedMeal(
                            user_id=user_id,
                            name=parsed.get("name", "Unknown Meal"),
                            calories=parsed.get("calories", 0),
                            protein=parsed.get("protein", 0),
                            carbs=parsed.get("carbs", 0),
                            fats=parsed.get("fats", 0),
                            image_url=f"/{filepath}"
                        )
                        db.add(new_meal)
                        await db.commit()
                        parsed["image_url"] = f"/{filepath}"
                    return {"success": True, "data": parsed}
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse extracted JSON: {match.group(0)} - Error: {e}")
                    # If it STILL fails, the model generated truly broken JSON (e.g. missing quotes/commas)
                    # Let's provide a fallback object so the app doesn't crash
                    if request.scan_type == "pill":
                        return {"success": True, "data": {"name": "Unknown Pill", "purpose": "Analysis failed due to model output formatting.", "common_interactions": []}}
                    else:
                        from app.models.diet import ScannedMeal
                        new_meal = ScannedMeal(
                            user_id=user_id,
                            name="Unknown Meal",
                            calories=0, protein=0, carbs=0, fats=0,
                            image_url=f"/{filepath}"
                        )
                        db.add(new_meal)
                        await db.commit()
                        return {"success": True, "data": {"name": "Unknown Meal", "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "sodium": 0, "image_url": f"/{filepath}"}}
            else:
                # No JSON block found
                raise HTTPException(status_code=500, detail="Model did not return a JSON object.")

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in Vision API: {e}")
        raise HTTPException(status_code=500, detail=str(e))
