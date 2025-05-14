from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes.document_routes import router as document_router
from app.config import settings
import logging
from fastapi.staticfiles import StaticFiles
import time

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("document-service")

# Création de l'application FastAPI
app = FastAPI(
    title="Document Management Service",
    description="Service de gestion documentaire pour Mobilis Algérie",
    version="1.0.0",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Middleware pour le logging des requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )
    
    return response

# Gestion globale des exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An internal error occurred", "detail": str(exc)}
    )

# Montage des routes
app.include_router(document_router, prefix=f"/api/{settings.API_VERSION}", tags=["documents"])

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": settings.SERVICE_NAME, "version": settings.API_VERSION}

@app.get("/health", tags=["health"])
async def health_check():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.MONGO_URL, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        
        import os
        if not os.path.exists(settings.UPLOAD_FOLDER):
            os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        
        return {
            "status": "healthy",
            "database": "connected",
            "version": settings.API_VERSION,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "detail": str(e),
                "version": settings.API_VERSION,
            }
        )

# Montage des fichiers statiques (optionnel, conservé pour compatibilité)
app.mount("/files", StaticFiles(directory="uploads"), name="files")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)