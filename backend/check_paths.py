import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.medical_record import MedicalRecord
from app.models.file_asset import FileAsset

async def main():
    async with async_session_maker() as db:
        print("--- Medical Records ---")
        res = await db.execute(select(MedicalRecord).where(MedicalRecord.file_path.isnot(None)))
        records = res.scalars().all()
        for r in records:
            print(f"ID: {r.id}, Title: {r.title}, Path: {r.file_path}")
            
        print("\n--- File Assets ---")
        res2 = await db.execute(select(FileAsset))
        assets = res2.scalars().all()
        for a in assets:
            print(f"ID: {a.id}, Name: {a.name}, Path: {a.file_path}")

if __name__ == "__main__":
    asyncio.run(main())
