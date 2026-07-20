"""
LifeOS Backend — Health Trackers Router
Water intake, sleep tracking, health metrics, BMI/BMR.
"""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.models.health_tracker import HealthEntry, SleepEntry, WaterIntake
from app.models.user import UserProfile
from app.schemas.health_tracker import (
    BMIResponse, HealthEntryCreate, HealthEntryResponse,
    SleepEntryCreate, SleepEntryResponse,
    WaterIntakeResponse, WaterIntakeUpdate,
    WearableConnectRequest, WearableSyncResponse, FitbitCallbackRequest, VoiceLogRequest
)
from app.utils.helpers import calculate_bmi, calculate_bmr, calculate_tdee, get_bmi_category
from app.utils.nlp import parse_voice_command

router = APIRouter(prefix="/trackers", tags=["Health Trackers"])

@router.post("/voice-log")
async def process_voice_log(data: VoiceLogRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Process a voice command to log a health metric or trigger a UI action."""
    intent = await parse_voice_command(data.text)
    
    # ── UI Action Intent ──────────────────────────────────────────
    if intent.get("type") == "action":
        return {
            "success": True,
            "type": "action",
            "target_feature": intent.get("target_feature", "dashboard"),
            "action_name": intent.get("action_name", "open_page"),
            "data": intent.get("data", {}),
            "message": f"Navigating to {intent.get('target_feature', 'dashboard')}..."
        }
    
    # ── Health Data Logging ───────────────────────────────────────
    if intent["type"] == "unknown":
        return {"success": False, "message": f"Could not understand the command: '{data.text}'"}

    metric_type = intent["type"]
    val = float(intent.get("value", 0))

    if val <= 0:
        return {"success": False, "message": "Invalid value parsed from the command."}

    d = date.today()

    if metric_type == "water":
        # Increment water
        result = await db.execute(select(WaterIntake).where(WaterIntake.user_id == user_id, WaterIntake.date == d))
        entry = result.scalars().first()
        if entry:
            entry.glasses += int(val)
        else:
            entry = WaterIntake(user_id=user_id, date=d, glasses=int(val))
            db.add(entry)
        await db.commit()
        return {"success": True, "message": f"Logged {int(val)} glasses of water."}

    elif metric_type == "sleep":
        entry = SleepEntry(user_id=user_id, date=d, hours=val, quality=3)
        db.add(entry)
        await db.commit()
        return {"success": True, "message": f"Logged {val} hours of sleep."}

    elif metric_type == "weight":
        entry = HealthEntry(user_id=user_id, category="weight", value=val, recorded_at=datetime.now(timezone.utc))
        db.add(entry)
        await db.commit()
        return {"success": True, "message": f"Logged weight as {val} kg."}

    elif metric_type == "steps":
        # Steps are handled via the fitness API, pass as action
        return {
            "success": True,
            "type": "action",
            "target_feature": "ai-fitness",
            "action_name": "add_steps",
            "data": {"steps": int(val)},
            "message": f"Adding {int(val)} steps..."
        }

    return {"success": False, "message": "Unsupported metric type."}


# ─── Water Intake ────────────────────────────────────────────────────

@router.get("/water", response_model=WaterIntakeResponse)
async def get_water(
    user_id: CurrentUserId,
    target_date: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get water intake for a specific date (defaults to today)."""
    d = target_date or date.today()
    result = await db.execute(
        select(WaterIntake).where(WaterIntake.user_id == user_id, WaterIntake.date == d)
    )
    entry = result.scalars().first()
    return WaterIntakeResponse(date=d, glasses=entry.glasses if entry else 0)


@router.put("/water", response_model=WaterIntakeResponse)
async def set_water(data: WaterIntakeUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Set water intake for a date using an UPSERT to prevent race conditions."""
    from sqlalchemy.dialects.postgresql import insert
    
    d = data.date or date.today()
    
    stmt = insert(WaterIntake).values(
        user_id=user_id,
        date=d,
        glasses=data.glasses
    )
    
    # On conflict (same user and date), just update the glasses count
    stmt = stmt.on_conflict_do_update(
        index_elements=['user_id', 'date'],
        set_={'glasses': data.glasses}
    )
    
    await db.execute(stmt)
    await db.commit()
    
    return WaterIntakeResponse(date=d, glasses=data.glasses)


@router.get("/water/history", response_model=list[WaterIntakeResponse])
async def water_history(
    user_id: CurrentUserId, 
    target_date: date | None = None,
    days: int = 7, 
    db: AsyncSession = Depends(get_db)
):
    """Get water intake history for the past N days."""
    end_date = target_date or date.today()
    start = end_date - timedelta(days=days - 1)
    result = await db.execute(
        select(WaterIntake).where(
            WaterIntake.user_id == user_id, 
            WaterIntake.date >= start,
            WaterIntake.date <= end_date
        ).order_by(WaterIntake.date)
    )
    entries = {e.date: e.glasses for e in result.scalars().all()}

    history = []
    for i in range(days):
        d = start + timedelta(days=i)
        history.append(WaterIntakeResponse(date=d, glasses=entries.get(d, 0)))
    return history


# ─── Sleep Tracking ──────────────────────────────────────────────────

@router.post("/sleep", response_model=SleepEntryResponse, status_code=201)
async def log_sleep(data: SleepEntryCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Log a sleep entry."""
    entry = SleepEntry(
        user_id=user_id,
        date=data.date or date.today(),
        hours=data.hours,
        quality=data.quality,
        bedtime=data.bedtime,
        wake_time=data.wake_time,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/sleep", response_model=list[SleepEntryResponse])
async def get_sleep(user_id: CurrentUserId, limit: int = 7, db: AsyncSession = Depends(get_db)):
    """Get recent sleep entries."""
    result = await db.execute(
        select(SleepEntry).where(SleepEntry.user_id == user_id)
        .order_by(SleepEntry.date.desc()).limit(limit)
    )
    return result.scalars().all()


# ─── Health Metrics ──────────────────────────────────────────────────

@router.post("/health-entry", response_model=HealthEntryResponse, status_code=201)
async def add_health_entry(data: HealthEntryCreate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Log a health metric (blood sugar, BP, weight, etc.)."""
    entry = HealthEntry(
        user_id=user_id,
        category=data.category,
        value=data.value,
        secondary_value=data.secondary_value,
        label=data.label,
        recorded_at=data.recorded_at or datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/health-data", response_model=dict)
async def get_health_data(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get all health data organized by category."""
    result = await db.execute(
        select(HealthEntry).where(HealthEntry.user_id == user_id).order_by(HealthEntry.recorded_at)
    )
    entries = result.scalars().all()

    data = {}
    for e in entries:
        cat = e.category
        if cat not in data:
            data[cat] = []
        entry_data = {
            "value": e.value,
            "label": e.label or "",
            "recorded_at": str(e.recorded_at),
        }
        if e.secondary_value is not None:
            if cat == "blood_pressure":
                entry_data["systolic"] = e.value
                entry_data["diastolic"] = e.secondary_value
            else:
                entry_data["secondary_value"] = e.secondary_value
        data[cat] = data.get(cat, []) + [entry_data]

    return data


# ─── BMI/BMR Calculator ─────────────────────────────────────────────

@router.get("/bmi", response_model=BMIResponse)
async def get_bmi(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Calculate BMI, BMR, and TDEE from user profile."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()

    weight = profile.weight if profile else 70
    height = profile.height if profile else 170
    age = profile.age if profile else 30
    gender = profile.gender if profile else "Male"

    bmi = calculate_bmi(weight, height)
    bmr = calculate_bmr(weight, height, age, gender)

    return BMIResponse(
        bmi=bmi,
        category=get_bmi_category(bmi),
        bmr=bmr,
        tdee_by_activity={
            "sedentary": calculate_tdee(bmr, "sedentary"),
            "light": calculate_tdee(bmr, "light"),
            "moderate": calculate_tdee(bmr, "moderate"),
            "very_active": calculate_tdee(bmr, "very_active"),
            "extra_active": calculate_tdee(bmr, "extra_active"),
        },
        weight=weight,
        height=height,
    )


# ─── Wearable Integration ─────────────────────────────────────────────

@router.get("/wearable/status")
async def get_wearable_status(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get list of connected wearable devices."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    return {"connected_devices": profile.connected_devices if profile and profile.connected_devices else []}


@router.post("/wearable/connect")
async def connect_wearable(data: WearableConnectRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Connect or disconnect a wearable device."""
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        return {"success": False, "message": "Profile not found."}
    
    current_devices = profile.connected_devices or []
    # If device not connected, connect it (simulated)
    if data.device_name not in current_devices:
        new_devices = current_devices + [data.device_name]
        profile.connected_devices = new_devices
        await db.commit()
        return {"success": True, "connected": True, "devices": new_devices}
    return {"success": True, "connected": True, "devices": current_devices}


@router.post("/fitbit/callback")
async def fitbit_callback(data: FitbitCallbackRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Exchange Fitbit auth code for tokens."""
    import urllib.request
    import urllib.parse
    import json
    import base64
    from app.config import get_settings
    settings = get_settings()
    
    if not settings.FITBIT_CLIENT_ID or not settings.FITBIT_CLIENT_SECRET:
        return {"success": False, "message": "Fitbit credentials not configured on server."}

    url = "https://api.fitbit.com/oauth2/token"
    auth_str = f"{settings.FITBIT_CLIENT_ID}:{settings.FITBIT_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    # We must match the exact redirect_uri configured in the Fitbit dev portal
    redirect_uri = "http://localhost:5173/app/trackers"
    
    data_payload = urllib.parse.urlencode({
        "client_id": settings.FITBIT_CLIENT_ID,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
        "code": data.code
    }).encode()
    
    req = urllib.request.Request(url, data=data_payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read())
            
            # Save tokens to profile
            result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
            profile = result.scalars().first()
            if profile:
                profile.fitbit_access_token = res_data.get("access_token")
                profile.fitbit_refresh_token = res_data.get("refresh_token")
                
                # Automatically add Fitbit to connected_devices
                current = profile.connected_devices or []
                if "Fitbit" not in current:
                    profile.connected_devices = current + ["Fitbit"]
                
                await db.commit()
                return {"success": True, "message": "Fitbit successfully connected!"}
    except Exception as e:
        import logging
        logging.getLogger("lifeos").error(f"Fitbit token exchange failed: {e}")
        return {"success": False, "message": "Failed to exchange Fitbit code for tokens."}

    return {"success": False, "message": "Unknown error."}


@router.get("/wearable/sync", response_model=WearableSyncResponse)
async def sync_wearable(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Simulate or fetch REAL data from wearables and save to DB."""
    import random
    import urllib.request
    import json
    
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    
    weight = profile.weight if profile else 70
    height = profile.height if profile else 170
    age = profile.age if profile else 30
    gender = profile.gender if profile else "Male"
    bmr = calculate_bmr(weight, height, age, gender)
    base_tdee = calculate_tdee(bmr, "moderate")
    
    simulated_hr = round(random.uniform(62, 85))
    simulated_sleep = round(random.uniform(6.5, 8.5), 1)
    simulated_steps = int(random.uniform(3000, 12000))
    simulated_cals = int((simulated_steps / 10000) * (base_tdee * 0.2)) + int(base_tdee * 0.1)

    # Attempt REAL Fitbit sync if token exists
    if profile and profile.fitbit_access_token:
        try:
            req = urllib.request.Request("https://api.fitbit.com/1/user/-/activities/date/today.json")
            req.add_header("Authorization", f"Bearer {profile.fitbit_access_token}")
            with urllib.request.urlopen(req) as response:
                fitbit_data = json.loads(response.read())
                summary = fitbit_data.get("summary", {})
                
                if "steps" in summary:
                    simulated_steps = summary["steps"]
                if "caloriesOut" in summary:
                    simulated_cals = summary["caloriesOut"]
                if "restingHeartRate" in summary:
                    simulated_hr = summary["restingHeartRate"]
                    
        except Exception as e:
            import logging
            logging.getLogger("lifeos").error(f"Fitbit API fetch failed (might need refresh): {e}")
            # Fall back to simulation if real fetch fails (e.g., token expired)
            pass

    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")

    steps_entry = HealthEntry(user_id=user_id, category="steps", value=simulated_steps, label=date_str, recorded_at=now)
    cals_entry = HealthEntry(user_id=user_id, category="calories", value=simulated_cals, label=date_str, recorded_at=now)
    hr_entry = HealthEntry(user_id=user_id, category="heart_rate", value=simulated_hr, label=date_str, recorded_at=now)
    
    db.add_all([steps_entry, cals_entry, hr_entry])
    await db.commit()

    return WearableSyncResponse(
        heart_rate=simulated_hr,
        sleep_hours=simulated_sleep,
        steps=simulated_steps,
        calories_burned=simulated_cals
    )
