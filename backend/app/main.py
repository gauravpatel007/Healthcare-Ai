"""
LifeOS Backend — FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import close_db, init_db
from app.exceptions import register_exception_handlers
from app.middleware import logging_middleware, setup_cors, setup_logging

# Import all models so they're registered with Base.metadata
import app.models  # noqa: F401

# Import routers
from app.routers import (
    ai_assistant, ai_fitness, ai_mental, ai_nutrition, ai_symptom,
    analytics, appointments, auth, challenges, dashboard, emergency,
    expenses, family, health_trackers, medical_records, medicines, users, share, vision,
    admin, admin_fitness, admin_medicine, admin_disease,
    admin_content, admin_notifications, admin_feedback, admin_diet,
    admin_settings, admin_files, admin_security, admin_audit, admin_analytics,
    user_feedback, user_notifications
)

logger = logging.getLogger("lifeos")


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application startup and shutdown events."""
    setup_logging()
    settings = get_settings()
    logger.info("🚀 Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)

    # Run DB migration for AI models and MealPlans
    try:
        from sqlalchemy import text
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            # MealPlans migration
            try:
                await db.execute(text("ALTER TABLE meal_plans ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'Admin'"))
                await db.execute(text("ALTER TABLE meal_plans ADD COLUMN user_id VARCHAR(36)"))
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.debug(f"Meal plan columns might already exist: {e}")
                
            # UserProfiles organ_preferences migration
            try:
                await db.execute(text("ALTER TABLE user_profiles ADD COLUMN organ_preferences JSON"))
                await db.commit()
                logger.info("Added organ_preferences column to user_profiles")
            except Exception as e:
                await db.rollback()
                logger.debug(f"organ_preferences column might already exist: {e}")
                
            # HealthEntry Enum migration for steps and calories
            try:
                from app.database import engine
                engine_autocommit = engine.execution_options(isolation_level="AUTOCOMMIT")
                async with engine_autocommit.connect() as conn:
                    # Postgres requires ALTER TYPE to run outside a transaction block
                    await conn.execute(text("ALTER TYPE health_category ADD VALUE IF NOT EXISTS 'steps'"))
                    await conn.execute(text("ALTER TYPE health_category ADD VALUE IF NOT EXISTS 'calories'"))
            except Exception as e:
                logger.debug(f"Enum values might already exist or not supported (sqlite): {e}")
                
            # Security and Audit Logs migrations
            try:
                await db.execute(text("ALTER TABLE admin_audit_logs ADD COLUMN device VARCHAR(500)"))
                await db.execute(text("ALTER TABLE admin_audit_logs ADD COLUMN previous_value JSON"))
                await db.execute(text("ALTER TABLE admin_audit_logs ADD COLUMN new_value JSON"))
                await db.commit()
            except Exception as e:
                await db.rollback()
            try:
                await db.execute(text("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1"))
                await db.commit()
            except Exception as e:
                await db.rollback()
            try:
                await db.execute(text("ALTER TABLE login_history ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Success'"))
                await db.commit()
            except Exception as e:
                await db.rollback()
            try:
                await db.execute(text('''
                    CREATE TABLE IF NOT EXISTS blocked_ips (
                        id VARCHAR(36) PRIMARY KEY,
                        ip_address VARCHAR(45) UNIQUE NOT NULL,
                        reason VARCHAR(255),
                        blocked_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
                        expires_at TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                    );
                    CREATE INDEX IF NOT EXISTS ix_blocked_ips_ip_address ON blocked_ips (ip_address);
                '''))
                await db.commit()
            except Exception as e:
                await db.rollback()
                
            # Seed default AI meals into Recipes table
            try:
                from app.routers.ai_nutrition import DEFAULT_MEALS
                from app.models.diet import Recipe
                from sqlalchemy import select
                for meal_type, items in DEFAULT_MEALS.items():
                    for item in items:
                        existing = await db.execute(select(Recipe).where(Recipe.title == item["name"]))
                        if not existing.scalar_one_or_none():
                            new_recipe = Recipe(
                                title=item["name"],
                                description=f"AI recommended {meal_type} option",
                                meal_type=meal_type.title(),
                                calories=item.get("calories", 0),
                                protein=item.get("protein", 0),
                                status="Published",
                            )
                            db.add(new_recipe)
                await db.commit()
            except Exception as e:
                logger.error(f"Error seeding default meals: {e}")
                
            await db.execute(text('''
                ALTER TABLE chat_messages 
                ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS feedback INTEGER;
            '''))
            
            await db.execute(text('''
                CREATE TABLE IF NOT EXISTS ai_prompts (
                    id VARCHAR(36) PRIMARY KEY,
                    module VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    content TEXT NOT NULL,
                    version INTEGER NOT NULL DEFAULT 1,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                );
            '''))
            await db.execute(text('CREATE INDEX IF NOT EXISTS ix_ai_prompts_module ON ai_prompts (module);'))
            
            await db.execute(text('''
                CREATE TABLE IF NOT EXISTS ai_prompt_versions (
                    id VARCHAR(36) PRIMARY KEY,
                    prompt_id VARCHAR(36) NOT NULL REFERENCES ai_prompts(id) ON DELETE CASCADE,
                    module VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                );
            '''))
            await db.execute(text('CREATE INDEX IF NOT EXISTS ix_ai_prompt_versions_prompt_id ON ai_prompt_versions (prompt_id);'))
            
            await db.commit()
    except Exception as e:
        print("Migration failed:", e)

    # Create upload directory
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    # Initialize database tables
    await init_db()
    logger.info("✅ Database tables initialized")

    yield

    # Shutdown
    await close_db()
    logger.info(" %s shutdown complete", settings.APP_NAME)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title=f"{settings.APP_NAME} API",
        description=(
            "**LifeOS** — AI-Powered Healthcare Operating System\n\n"
            "A comprehensive healthcare management platform providing:\n"
            "- 🔐 JWT Authentication with role-based access\n"
            "- 📋 Medical Records with file uploads\n"
            "- 💊 Medicine management with interaction checks\n"
            "- 📅 Appointment scheduling\n"
            "- 🆘 Emergency contacts & SOS system\n"
            "- 👨‍👩‍👧 Family health management\n"
            "- 📊 Smart analytics & health predictions\n"
            "- 🤖 AI-powered health assistant (Groq)\n"
            "- 🔍 AI Symptom checker\n"
            "- 🥗 AI Nutrition planner\n"
            "- 💪 AI Fitness coach\n"
            "- 🧠 AI Mental health support"
        ),
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ─── Middleware ──────────────────────────────────────────────────
    setup_cors(application)
    application.middleware("http")(logging_middleware)
    from app.middleware import ip_blocking_middleware
    application.middleware("http")(ip_blocking_middleware)

    # ─── Exception Handlers ─────────────────────────────────────────
    register_exception_handlers(application)

    # ─── API Routers (all under /api/v1) ────────────────────────────
    api_prefix = "/api/v1"

    application.include_router(auth.router, prefix=api_prefix)
    application.include_router(users.router, prefix=api_prefix)
    application.include_router(dashboard.router, prefix=api_prefix)
    application.include_router(medical_records.router, prefix=api_prefix)
    application.include_router(medicines.router, prefix=api_prefix)
    application.include_router(appointments.router, prefix=api_prefix)
    application.include_router(emergency.router, prefix=api_prefix)
    application.include_router(family.router, prefix=api_prefix)
    application.include_router(health_trackers.router, prefix=api_prefix)
    application.include_router(expenses.router, prefix=api_prefix)
    application.include_router(challenges.router, prefix=api_prefix)
    application.include_router(analytics.router, prefix=api_prefix)
    application.include_router(share.router, prefix=api_prefix)
    application.include_router(ai_assistant.router, prefix=api_prefix)
    application.include_router(ai_symptom.router, prefix=api_prefix)
    application.include_router(ai_nutrition.router, prefix=api_prefix)
    application.include_router(ai_fitness.router, prefix=api_prefix)
    application.include_router(ai_mental.router, prefix=api_prefix)
    application.include_router(vision.router, prefix=api_prefix)
    application.include_router(admin.router, prefix=api_prefix)
    application.include_router(admin_fitness.router, prefix=api_prefix)
    application.include_router(admin_medicine.router, prefix=api_prefix)
    application.include_router(admin_disease.router, prefix=api_prefix)
    application.include_router(admin_content.router, prefix=api_prefix)
    application.include_router(admin_notifications.router, prefix=api_prefix)
    application.include_router(admin_feedback.router, prefix=api_prefix)
    application.include_router(admin_diet.router, prefix=api_prefix)
    application.include_router(admin_settings.router, prefix=api_prefix)
    application.include_router(admin_files.router, prefix=api_prefix)
    application.include_router(admin_security.router, prefix=api_prefix)
    application.include_router(admin_audit.router, prefix=api_prefix)
    application.include_router(admin_analytics.router, prefix=api_prefix)

    # User Modules
    application.include_router(user_feedback.router, prefix=api_prefix)
    application.include_router(user_notifications.router, prefix=api_prefix)

    # ─── Static Files (Uploads) ─────────────────────────────────────
    application.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    # ─── Root Health Check ──────────────────────────────────────────
    @application.get("/", tags=["Health Check"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "healthy",
            "docs": "/docs",
        }

    @application.get("/health", tags=["Health Check"])
    async def health_check():
        return {"status": "ok"}

    return application


# Create the app instance
app = create_app()
