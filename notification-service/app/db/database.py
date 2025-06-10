# app/db/database.py
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

# Client séparé pour la base de données de notifications
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_NOTIFICATIONS_DATABASE]

def get_notification_collection():
    return db[settings.MONGODB_NOTIFICATIONS_COLLECTION]

async def get_db() -> AsyncIOMotorDatabase:
    """Renvoie la base de données de notifications"""
    return db