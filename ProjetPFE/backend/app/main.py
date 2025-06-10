from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app import crud, schemas
from app.database import get_db
import logging
from fastapi import Query

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/feedbacks/", response_model=schemas.FeedbackResponse)
async def create_feedback(feedback: schemas.FeedbackCreate, db=Depends(get_db)):
    logger.info(f"📝 Nouveau feedback reçu de {feedback.user_name} (ID: {feedback.user_id})")
    try:
        result = await crud.create_feedback(feedback.dict(), db)
        logger.info(f"✅ Feedback inséré avec ID: {result['id']}")
        return result
    except Exception as e:       
        logger.error(f"❌ Erreur d'insertion: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement du feedback.")

@app.get("/feedbacks/", response_model=List[schemas.FeedbackResponse])
async def get_feedbacks(status: str = Query(...), db=Depends(get_db)):
    try:
        feedbacks = await crud.get_feedbacks_by_status(status, db)
        return feedbacks
    except Exception as e:
        logger.error(f"❌ Erreur de récupération: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des feedbacks.")
        
# pour admine
@app.get("/feedbacks/ux-summary")
async def get_ux_summary(db=Depends(get_db)):
    try:
        result = await crud.get_ux_summary(db)
        return result
    except Exception as e:
        logger.error(f"❌ Erreur résumé UX: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du résumé UX.")
# pour expert 
@app.get("/feedbacks/expert-priority-stats")
async def get_expert_priority_stats(db=Depends(get_db)):
    try:
        stats = await crud.analyze_feedbacks_for_expert(db)
        return stats 
    except Exception as e:
        logger.error(f"❌ Erreur stats expert : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur statistiques expert.")
@app.get("/feedbacks/by-priority/", response_model=List[schemas.FeedbackResponse])
async def get_feedbacks_by_priority(priority: str, db=Depends(get_db)):
    """
    Retourne la liste des feedbacks classés comme HIGH, MEDIUM ou LOW
    (peu importe leur type : SUGGESTION, PROBLEM, SUPPORT_REQUEST)
    """
    if priority not in ["HIGH", "MEDIUM", "LOW"]:
        raise HTTPException(status_code=400, detail="Priorité invalide. Choisir HIGH, MEDIUM ou LOW.")

    try:
        feedbacks = await crud.get_feedbacks_by_priority_level(priority, db)
        return feedbacks
    except Exception as e:
        logger.error(f"❌ Erreur récupération feedbacks par priorité : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur récupération feedbacks par priorité.")
