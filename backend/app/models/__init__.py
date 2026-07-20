"""
LifeOS Backend — Database Models Package
Imports all models so Alembic and Base.metadata can discover them.
"""

from app.models.user import User, UserProfile, PasswordResetToken
from app.models.medical_record import MedicalRecord
from app.models.medicine import Medicine
from app.models.appointment import Appointment
from app.models.emergency import EmergencyContact
from app.models.family import FamilyMember, Vaccination
from app.models.health_tracker import HealthEntry, WaterIntake, SleepEntry
from app.models.expense import MedicalExpense
from app.models.challenge import ChallengeProgress, UserBadge
from app.models.mood import MoodEntry, JournalEntry
from app.models.chat import ChatMessage
from app.models.share import SharedLink

__all__ = [
    "User", "UserProfile", "PasswordResetToken",
    "MedicalRecord",
    "Medicine",
    "Appointment",
    "EmergencyContact",
    "FamilyMember", "Vaccination",
    "HealthEntry", "WaterIntake", "SleepEntry",
    "MedicalExpense",
    "ChallengeProgress", "UserBadge",
    "MoodEntry", "JournalEntry",
    "ChatMessage",
    "SharedLink",
]
