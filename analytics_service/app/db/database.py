from motor.core import AgnosticDatabase
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db: AgnosticDatabase = client[settings.MONGODB_NAME]  # Annotation de type explicite

async def get_db() -> AgnosticDatabase:
    """Retourne la connexion à la base de données"""
    return db