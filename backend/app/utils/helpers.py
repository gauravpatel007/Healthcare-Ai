"""
LifeOS Backend — Helper Utilities
BMI/BMR calculators, formatters, and other shared helpers.
"""

import math
from datetime import date, datetime


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """Calculate BMI from weight (kg) and height (cm)."""
    if height_cm <= 0 or weight_kg <= 0:
        return 0.0
    height_m = height_cm / 100
    bmi = weight_kg / (height_m * height_m)
    return round(bmi, 1)


def get_bmi_category(bmi: float) -> str:
    """Return BMI category label."""
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25:
        return "Normal"
    if bmi < 30:
        return "Overweight"
    return "Obese"


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> int:
    """Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation."""
    if gender.lower() == "male":
        return round(88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age))
    return round(447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age))


def calculate_tdee(bmr: int, activity_level: str = "moderate") -> int:
    """Calculate Total Daily Energy Expenditure."""
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "very_active": 1.725,
        "extra_active": 1.9,
    }
    return round(bmr * multipliers.get(activity_level, 1.55))


def days_until(target_date: date) -> int:
    """Calculate days between today and target date."""
    today = date.today()
    return (target_date - today).days


def predict_refill_days(remaining: int, frequency: str) -> int:
    """Predict number of days until medicine needs refill."""
    freq_map = {
        "once_daily": 1,
        "twice_daily": 2,
        "thrice_daily": 3,
        "once_weekly": 1 / 7,
        "as_needed": 0.5,
    }
    daily_use = freq_map.get(frequency, 1)
    if daily_use <= 0:
        return 999
    return max(1, round(remaining / daily_use))


def calculate_health_score(
    bmi: float,
    water_glasses: int,
    active_medicines: int,
    upcoming_appointments: int,
) -> int:
    """Calculate overall health score (0-100)."""
    score = 70  # Base score

    # BMI contribution (0-15)
    category = get_bmi_category(bmi)
    if category == "Normal":
        score += 15
    elif category == "Overweight":
        score += 8
    elif category == "Underweight":
        score += 5

    # Water intake (0-5)
    score += min(5, round(water_glasses / 8 * 5))

    # Medicine adherence (0-5)
    if active_medicines > 0:
        score += 5

    # Recent appointments (0-5)
    if upcoming_appointments > 0:
        score += 5

    return min(100, max(0, score))


def simple_linear_prediction(values: list[float], steps_ahead: int = 3) -> float:
    """Simple linear regression prediction for future values."""
    if len(values) < 2:
        return values[-1] if values else 0.0

    n = len(values)
    x_values = list(range(n))
    x_mean = sum(x_values) / n
    y_mean = sum(values) / n

    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, values))
    denominator = sum((x - x_mean) ** 2 for x in x_values)

    if denominator == 0:
        return values[-1]

    slope = numerator / denominator
    intercept = y_mean - slope * x_mean

    prediction = slope * (n - 1 + steps_ahead) + intercept
    return round(max(0.0, prediction), 1)
