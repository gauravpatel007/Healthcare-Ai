import asyncio
from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import *

async def init_models():
    print("Creating new tables asynchronously...")
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    print("Done.")

if __name__ == "__main__":
    asyncio.run(init_models())
