# app/scheduler.py
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.db.database import get_db
from app.services.evaluation import EvaluationService
from app.core.config import settings
from fastapi import HTTPException  # Ajout de l'import manquant
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def evaluate_all_documents():
    """Tâche périodique pour évaluer tous les documents"""
    try:
        db = await get_db()
        eval_service = EvaluationService(db.evaluations)
        
        try:
            transport = httpx.AsyncHTTPTransport(retries=3)
            async with httpx.AsyncClient(transport=transport, timeout=30.0) as client:
                # Test de connexion
                try:
                    health_check = await client.get(
                        f"{settings.DOCUMENT_SERVICE_URL}/health",
                        headers={"Accept": "application/json"}
                    )
                    health_check.raise_for_status()
                except Exception as e:
                    logger.error(f"Service health check failed: {str(e)}")
                    return
                
                # Récupération des documents
                try:
                    response = await client.get(
                        f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents",
                        params={"status": "published"},
                        headers={"Accept": "application/json"}
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    if not isinstance(data, dict) or 'documents' not in data:
                        logger.error(f"Format de réponse inattendu: {data.keys()}")
                        return
                    
                    documents = data['documents']
                    total_processed = 0
                    
                    for doc in documents:
                        doc_id = str(doc.get('id', ''))
                        if not doc_id:
                            logger.error("Document sans ID")
                            continue
                            
                        try:
                            await eval_service.evaluate_document(doc_id, force=True)
                            total_processed += 1
                        except HTTPException as e:
                            logger.error(f"Evaluation failed for {doc_id}: {e.detail}")
                        except Exception as e:
                            logger.error(f"Unexpected error for {doc_id}: {str(e)}")
                    
                    logger.info(f"Évaluation terminée - {total_processed}/{len(documents)} documents traités")
                    
                except Exception as e:
                    logger.error(f"Failed to fetch documents: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            
    except Exception as e:
        logger.critical(f"Global evaluation failure: {str(e)}", exc_info=True)

def start_scheduler():
    """Démarre le scheduler automatiquement"""
    if not scheduler.running:
        scheduler.add_job(
            evaluate_all_documents,
            'interval',
            minutes=settings.SCHEDULER_INTERVAL_MINUTES,
            next_run_time=datetime.now()
        )
        scheduler.start()
        logger.info(f"Scheduler démarré avec intervalle de {settings.SCHEDULER_INTERVAL_MINUTES} minutes")