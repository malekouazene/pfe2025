from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gestionnaire centralisé des connexions MongoDB"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None

    def is_connected(self) -> bool:
        """Vérifie si la connexion est active (Nouvelle méthode ajoutée ici)"""
        return self.db is not None
    
    async def ensure_connection(self):
        """Garantit qu'une connexion active existe (thread-safe)"""
        async with self._lock:
            if not self.is_connected():
                await self.connect_to_mongo()
    async def connect_to_mongo(self):
        """Établit la connexion à MongoDB"""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=100,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000
            )
            self.db = self.client[settings.MONGODB_NAME]
            
            await self.db.command("ping")
            logger.info("Successfully connected to MongoDB")
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {str(e)}")
            raise

    async def _create_indexes(self):
        """Crée les index nécessaires"""
        try:
            await self.db.evaluations.create_index(
                [("document_id", 1), ("evaluated_at", -1)],
                name="document_evaluation_idx"
            )
            await self.db.evaluations.create_index(
                [("status", 1), ("next_evaluation", 1)],
                name="status_notification_idx"
            )
            logger.info("MongoDB indexes created/verified")
        except Exception as e:
            logger.error(f"Index creation failed: {str(e)}")
            raise

    async def close_connection(self):
        """Ferme proprement la connexion MongoDB"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    def get_db(self) -> AsyncIOMotorDatabase:
        """Retourne l'instance de base de données"""
        if not self.is_connected():  # Utilisation de la nouvelle méthode ici
            raise RuntimeError("Database not initialized")
        return self.db


   
# Instance singleton
db_manager = DatabaseManager()

# Fonctions pour l'injection de dépendances FastAPI
async def connect_to_mongo():
    await db_manager.connect_to_mongo()

async def close_mongo_connection():
    await db_manager.close_connection()

async def get_db() -> AsyncIOMotorDatabase:
    return db_manager.get_db()
