import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "admin")

async def main():
    if not MONGO_URL:
        print({"ok": False, "error": "MONGO_URL is not set"})
        return
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        # ping the server
        result = await client[DB_NAME].command("ping")
        print({"ok": True, "result": result})
    except Exception as e:
        print({"ok": False, "error": str(e)})

if __name__ == "__main__":
    asyncio.run(main())
