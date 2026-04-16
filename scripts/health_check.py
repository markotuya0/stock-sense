import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import text
from db.session import engine

# Make sure we load the root .env
load_dotenv()

async def check_health():
    print("🔍 Starting Local Health Check...")
    
    # 1. Check Env
    required_vars = ["DATABASE_URL", "GROQ_API_KEY", "GOOGLE_API_KEY", "SECRET_KEY"]
    for var in required_vars:
        val = os.getenv(var)
        if not val or val.strip() == "":
            print(f"❌ Missing or empty Env Var: {var}")
        else:
            # Mask the key for logs
            masked = val[:4] + "..." + val[-4:] if len(val) > 8 else "****"
            print(f"✅ Found Var: {var} ({masked})")

    # 2. Check Database
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT count(*) FROM users"))
            count = result.scalar()
            print(f"✅ Supabase Connected! Current user count: {count}")
    except Exception as e:
        print(f"❌ Database Connection Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_health())
