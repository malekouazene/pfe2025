
# app/main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.routes import notifications

# Configuration du logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Service de notifications pour les documents obsolètes",
    version="1.0.0",
)

# Configuration CORS

# Configurez CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # L'origine de votre app React
    allow_credentials=True,
    allow_methods=["*"],  # Ou spécifiez ["GET", "POST", "PUT", "DELETE"] etc.
    allow_headers=["*"],
)
# Inclusion des routes
app.include_router(
    notifications.router, 
    prefix=f"{settings.API_PREFIX}/notifications"
)

@app.get("/", tags=["Status"])
async def root():
    """Vérification de santé du service"""
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }

@app.get("/health", tags=["Status"])
async def health_check():
    """Endpoint de vérification de santé pour les balanceurs de charge"""
    return {"status": "healthy"}