# app/main.py
from fastapi import FastAPI
from .db.database import connect_to_mongo, close_mongo_connection
from .api.endpoints import router as evaluation_router
import logging
import uvicorn
from .db.database import db_manager
from .scheduler import start_scheduler  # Import corrigé
from .core.config import settings
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Evaluation Service",
    version="1.0.0",
    description="Microservice for evaluating document obsolescence"
)

# Configurez CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Autorisez votre frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
async def startup_event():
    try:
        await db_manager.connect_to_mongo()
        start_scheduler()  # Démarrage du scheduler
        logger.info("Application et scheduler démarrés")
    except Exception as e:
        logger.critical(f"Échec du démarrage: {str(e)}")
        raise

app.include_router(evaluation_router)

@app.on_event("shutdown")
async def shutdown_event():
    await db_manager.close_connection()
    logger.info("Application arrêtée proprement")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8004,
        reload=False,  # Désactivé pour éviter les problèmes
        workers=1
    )