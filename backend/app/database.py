from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv

load_dotenv()

# "production" → tradevault   |   anything else → tradevault_dev
_DB_NAME = "tradevault" if os.getenv("APP_ENV") == "production" else "tradevault_dev"

class Database:
    client: AsyncIOMotorClient = None

    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))

        from app.models.prop_firm import PropFirm
        from app.models.account import Account
        from app.models.trade import Trade
        from app.models.daily_stats import DailyStats

        await init_beanie(
            database=cls.client[_DB_NAME],
            document_models=[PropFirm, Account, Trade, DailyStats]
        )

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()

database = Database()
