
#config.py
import os
from pydantic_settings import BaseSettings


# Configuration de base
class Settings(BaseSettings):
    # MongoDB
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DB_NAME", "knowledge_db")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "documents")
    
    # Dossier d'upload
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
    
    # Taille maximale de fichier (en octets, défaut 100MB)
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 104857600))
    
    # Configuration du service
    SERVICE_NAME: str = "document-management-service"
    API_VERSION: str = "v1"
    
    # Configuration de l'authentification
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")
    
    # Configuration des événements
    EVENT_BROKER_URL: str = os.getenv("EVENT_BROKER_URL", "amqp://guest:guest@rabbitmq:5672/")
    
    # Types de fichiers autorisés
    ALLOWED_MIME_TYPES: list = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/markdown",
        "image/jpeg",
        "image/png"
    ]
    
    class Config:
        env_file = ".env"

# Instanciation des paramètres
settings = Settings()

# Export des variables pour compatibilité avec le code existant
MONGO_URL = settings.MONGO_URL
DATABASE_NAME = settings.DATABASE_NAME
COLLECTION_NAME = settings.COLLECTION_NAME
UPLOAD_FOLDER = settings.UPLOAD_FOLDER