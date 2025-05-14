from fastapi import FastAPI

from .db.mongodb import get_db
from app.api.endpoints import router
import uvicorn  

app = FastAPI(
    title="Ticket Service",
    description="Service de gestion des signalements de documents",
    version="1.0.0"
)

app.include_router(router)

@app.on_event("shutdown")
async def shutdown_db_client():
    db = await get_db()
    db.client.close()


# Nouveau bloc pour l'exécution directe
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)