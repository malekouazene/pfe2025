from fastapi import FastAPI
from app.routes import chat_routes, training_routes, profile_routes 
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Service de Formation IA")

# Configurez CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # L'origine de votre app React
    allow_credentials=True,
    allow_methods=["*"],  # Ou spécifiez ["GET", "POST", "PUT", "DELETE"] etc.
    allow_headers=["*"],
)

# Inclure tous les routeurs
app.include_router(chat_routes.router, prefix="/api/chat", tags=["chat"])
app.include_router(training_routes.router, prefix="/api/training", tags=["training"]) 
app.include_router(profile_routes.router, prefix="/api/profile", tags=["profile"])
app.include_router(training_routes.router, prefix="/api/suggestions", tags=["suggestions"])


@app.get("/")
def read_root():
    return {"status": "Service de formation opérationnel", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.API_PORT,  # Utilisez le port depuis les settings
        reload=True
    )