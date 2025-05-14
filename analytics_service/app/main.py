from fastapi import FastAPI
from app.api import feedback, analytics
from app.db.database import client
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="Document Analytics Service",
    description="API for tracking document usage and feedback",
    version="1.0.0"
)
# Configurez CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # L'origine de votre app React
    allow_credentials=True,
    allow_methods=["*"],  # Ou spécifiez ["GET", "POST", "PUT", "DELETE"] etc.
    allow_headers=["*"],
)
# Inclure le routeur analytics


app.include_router(feedback.router)
app.include_router(analytics.router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()