# database.py
import motor.motor_asyncio
from fastapi import Depends
import os
from typing import Dict, Any
from dotenv import load_dotenv
load_dotenv()
# Configuration de la base de données
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "feedback_db")
COLLECTION_NAME = "feedbacks"  # Nom de collection simple, sans répétition

# Client MongoDB
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
database = client[DB_NAME]

# Index pour optimiser les requêtes
async def create_indexes():
    await database[COLLECTION_NAME].create_index("feedback_type")
    await database[COLLECTION_NAME].create_index("created_at")
    await database[COLLECTION_NAME].create_index("status")

# Dépendance pour injecter la base de données dans les routes
async def get_db():
    return database