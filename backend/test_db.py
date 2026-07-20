import asyncio
import asyncpg
from datetime import date

async def main():
    try:
        conn = await asyncpg.connect('postgresql://postgres:1234@localhost:5432/lifeos_db')
        
        # Test 1: Count rows in water_intake
        rows = await conn.fetch('SELECT * FROM water_intake')
        print(f"Total water intake rows: {len(rows)}")
        for r in rows:
            print(dict(r))
            
        await conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
