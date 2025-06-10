# app/db/database.py
from app.core.config import settings
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)

try:
    client = MongoClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000  # 5s timeout
    )
    db = client[settings.MONGO_DB_NAME]
    
    # Test de connexion immédiat
    client.server_info()
    logger.info(f"Connected to MongoDB at {settings.MONGO_URI}/{settings.MONGO_DB_NAME}")
    
except ConnectionFailure as e:
    logger.error(f"MongoDB connection failed: {e}")
    raise

def get_collection(collection_name: str):
    """Retourne une collection MongoDB avec vérification"""
    if collection_name not in db.list_collection_names():
        logger.warning(f"Collection {collection_name} doesn't exist. Creating it...")
        db.create_collection(collection_name)
    return db[collection_name]