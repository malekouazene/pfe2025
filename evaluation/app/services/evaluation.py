import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from fastapi import HTTPException, status
from ..core.config import settings
from ..db.models import EvaluationDB, EvaluationStatus
from ..schemas.evaluation import EvaluationResponse
import asyncio

logger = logging.getLogger(__name__)

class EvaluationService:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=10)
        )

    async def evaluate_document(self, doc_id: str, force: bool = False) -> EvaluationDB:
        """Evaluate a document using data from other services"""
        try:
            # Check for existing valid evaluation
            if not force:
                if existing := await self._get_existing_evaluation(doc_id):
                    return existing

            # Fetch required data from services
            external_data = await self._fetch_external_data(doc_id)
            
            # Calculate all scores
            scores = self._calculate_all_scores(external_data)
            total_score = self._calculate_total_score(scores)
            
            # Create and save evaluation
            evaluation = self._create_evaluation(doc_id, scores, total_score)
            saved_eval = await self._save_evaluation(evaluation)
            
            # Envoie une notification si le document est stale ou pire
            if saved_eval.status in [EvaluationStatus.STALE, EvaluationStatus.OUTDATED, EvaluationStatus.CRITICAL]:
                await self._send_notification(doc_id, saved_eval)
                
            return saved_eval
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Evaluation failed: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Evaluation error: {str(e)}"
            )

    async def _send_notification(self, doc_id: str, evaluation: EvaluationDB) -> Dict:
        """
        Envoie une notification pour un document obsolète
        Version améliorée avec gestion des cas où l'auteur est manquant
        """
        result = {
            "success": False,
            "recipient": None,
            "timestamp": datetime.utcnow(),
            "error": None
        }
        
        try:
            logger.info(f"Tentative d'envoi de notification pour document {doc_id} (status: {evaluation.status})")

            # 1. Récupérer les données complètes du document
            doc_data = await self._get_complete_document_data(doc_id)
            logger.debug(f"Données complètes du document: {doc_data}")
            
            # 2. Trouver l'auteur avec plusieurs champs possibles
            author_id = self._find_author_id(doc_data)
            
            if not author_id:
                # 3. Si aucun auteur trouvé, envoyer à un destinataire par défaut
                author_id = settings.DEFAULT_NOTIFICATION_RECIPIENT
                logger.warning(f"Aucun auteur trouvé, utilisation du destinataire par défaut: {author_id}")

            result["recipient"] = author_id

            # 4. Préparer les données pour la notification
            notification_data = {
                "recipient_id": author_id,
                "document_id": doc_id,
                "title": f"Document nécessite mise à jour - {doc_data.get('title', 'Sans titre')}",
                "message": f"Votre document a été marqué comme {evaluation.status.value}. Score: {evaluation.score}/100",
                "status": "new",
                "document_status": evaluation.status.value,
                "evaluation_date": datetime.utcnow().isoformat()
            }
            
            logger.debug(f"Données de notification préparées: {notification_data}")

            # 5. Envoyer la notification
            response = await self.http_client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/notifications",
                json=notification_data,
                timeout=10.0
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            # 6. Vérification de la réponse
            if not response_data.get("notification_id"):
                raise ValueError("Réponse invalide du service de notification")
            
            logger.info(f"Notification envoyée avec succès. ID: {response_data['notification_id']}")
            result["success"] = True
            
            # 7. Mettre à jour le document avec le statut de notification
            await self._update_document_notification_status(doc_id, True)
            
            return result
        
        except httpx.HTTPStatusError as e:
            error_msg = f"Erreur HTTP: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg)
            result["error"] = error_msg
            return result
        
        except Exception as e:
            error_msg = f"Erreur inattendue: {str(e)}"
            logger.error(error_msg, exc_info=True)
            result["error"] = error_msg
            return result

    async def _get_complete_document_data(self, doc_id: str) -> dict:
        """Récupère toutes les métadonnées du document"""
        try:
            response = await self.http_client.get(
                f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents/{doc_id}",
                params={"fields": "user_id,author_id,owner,title,created_at"}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Échec récupération document: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Impossible de récupérer les données du document"
            )

    def _find_author_id(self, doc_data: dict) -> Optional[str]:
        """Trouve l'ID de l'auteur en vérifiant plusieurs champs possibles"""
        for field in ['user_id', 'author_id', 'owner', 'creator_id', 'author']:
            if doc_data.get(field):
                return doc_data[field]
        return None

    async def _update_document_notification_status(self, doc_id: str, success: bool):
        """Met à jour le statut de notification du document"""
        try:
            await self.collection.update_one(
                {"document_id": doc_id},
                {"$set": {
                    "notification_sent": success,
                    "last_notification_attempt": datetime.utcnow()
                }}
            )
        except Exception as e:
            logger.error(f"Échec mise à jour statut notification: {str(e)}")        

    async def _fetch_external_data(self, doc_id: str) -> Dict:
        """Fetch required data from dependent services"""
        try:
            # Execute all requests concurrently
            analytics_req = self.http_client.get(
                f"{settings.ANALYTICS_SERVICE_URL}/analytics/document/{doc_id}"
            )
            feedback_req = self.http_client.get(
                f"{settings.FEEDBACK_SERVICE_URL}/feedback/stats/{doc_id}"
            )
            document_req = self.http_client.get(
                   f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents/{doc_id}",
                    params={"fields": "last_updated,created_at,references,related_docs"}
            )

            analytics_res, feedback_res, document_res = await asyncio.gather(
                analytics_req, feedback_req, document_req,
                return_exceptions=True
            )

            # Process responses
            if isinstance(analytics_res, Exception):
                raise analytics_res
            analytics_res.raise_for_status()
            analytics_data = analytics_res.json()

            feedback_data = {}
            if not isinstance(feedback_res, Exception) and feedback_res.status_code == 200:
                feedback_data = feedback_res.json()

            if isinstance(document_res, Exception):
                raise document_res
            document_res.raise_for_status()
            document_data = document_res.json()

            return {
                "metadata": {
                    "last_updated": document_data.get("last_updated"),
                    "created_at": document_data.get("created_at"),
                    "references": document_data.get("references", []),
                    "related_docs": document_data.get("related_docs", [])
                },
                "analytics": {
                    "views": analytics_data.get("total_views", 0),
                    "avg_rating": feedback_data.get("average"),
                    "rating_distribution": feedback_data.get("distribution", {})
                }
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"Service error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Service error: {str(e)}"
            )
        except httpx.RequestError as e:
            logger.error(f"Connection error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service unavailable"
            )

    # Score calculation methods
    def _calculate_age_score(self, last_updated: Optional[str], created_at: Optional[str]) -> float:
        """Calculate document age score"""
        try:
            date_str = last_updated or created_at
            if not date_str:
                return 100.0
                
            dt = (
                datetime.fromisoformat(date_str) 
                if isinstance(date_str, str) 
                else date_str
            )
            
            days = (datetime.utcnow() - dt).days
            return min(100.0, days * 1.5)
            
        except Exception as e:
            logger.error(f"Age calculation error: {str(e)}")
            return 100.0

    def _calculate_usage_score(self, views: int) -> float:
        """Calculate usage score based on views"""
        if views > 1000: return 0.0
        elif views > 500: return 20.0
        elif views > 100: return 40.0
        elif views > 50: return 60.0
        elif views >= 1: return 70.0 
        else: return 80.0

    def _calculate_feedback_score(self, rating: Optional[float]) -> float:
        """Calculate feedback score"""
        if rating is None: return 0.0
        if rating >= 4.5: return 0.0
        elif rating >= 4.0: return 20.0
        elif rating >= 3.0: return 40.0
        elif rating >= 2.0: return 60.0
        else: return 100.0

    def _calculate_version_score(self, references: List[Dict]) -> float:
        """Calculate version obsolescence score"""
        if not references: return 0.0
        obsolete = sum(1 for ref in references 
                     if ref.get('status') in ['end-of-life', 'deprecated'] or 
                        ref.get('is_obsolete', False))
        return min(100.0, (obsolete / len(references)) * 100)

    def _calculate_related_score(self, related_docs: List[Dict]) -> float:
        """Calculate related documents freshness score"""
        if not related_docs: return 0.0
        try:
            updated = sum(1 for doc in related_docs 
                         if (datetime.utcnow() - datetime.fromisoformat(doc['last_updated'])).days < 180)
            ratio = updated / len(related_docs)
            if ratio > 0.8: return 0.0
            elif ratio > 0.5: return 30.0
            elif ratio > 0.2: return 60.0
            return 100.0
        except Exception as e:
            logger.error(f"Related docs calculation error: {str(e)}")
            return 100.0

    def _calculate_all_scores(self, external_data: Dict) -> Dict[str, float]:
        """Calculate all individual scores"""
        return {
            'age': self._calculate_age_score(
                external_data["metadata"].get("last_updated"),
                external_data["metadata"].get("created_at")
            ),
            'usage': self._calculate_usage_score(external_data["analytics"]["views"]),
            'feedback': self._calculate_feedback_score(external_data["analytics"].get("avg_rating")),
            'versions': self._calculate_version_score(external_data["metadata"].get("references", [])),
            'related': self._calculate_related_score(external_data["metadata"].get("related_docs", []))
        }

    def _calculate_total_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted total score"""
        return sum(
            scores[k] * settings.CRITERIA_WEIGHTS.get(k, 0.0) 
            for k in scores
        )

    def _determine_status(self, score: float) -> EvaluationStatus:
        """Determine evaluation status based on score"""
        if score <= settings.SCORE_THRESHOLDS.get('fresh', 30):
            return EvaluationStatus.FRESH
        elif score <= settings.SCORE_THRESHOLDS.get('stale', 60):
            return EvaluationStatus.STALE
        elif score <= settings.SCORE_THRESHOLDS.get('outdated', 80):
            return EvaluationStatus.OUTDATED
        return EvaluationStatus.CRITICAL

    async def _get_existing_evaluation(self, doc_id: str) -> Optional[EvaluationDB]:
        """Get existing valid evaluation if available"""
        existing = await self.collection.find_one(
            {"document_id": doc_id},
            sort=[("evaluated_at", -1)]
        )
        if existing and existing.get("next_evaluation", datetime.min) > datetime.utcnow():
            return EvaluationDB(**existing)
        return None

    def _create_evaluation(self, doc_id: str, scores: Dict[str, float], total_score: float) -> EvaluationDB:
        """Create new evaluation object"""
        return EvaluationDB(
            document_id=doc_id,
            score=round(total_score, 2),
            status=self._determine_status(total_score),
            details=scores,
            next_evaluation=datetime.utcnow() + timedelta(days=settings.RE_EVALUATION_DAYS),
            notification_sent=False,  # Ajout d'un champ pour suivre l'état
            notification_attempts=[]  # Historique des tentatives
        )

    async def _save_evaluation(self, evaluation: EvaluationDB) -> EvaluationResponse:
        """Save evaluation to database"""
        result = await self.collection.insert_one(evaluation.dict(by_alias=True))
        inserted = await self.collection.find_one({"_id": result.inserted_id})
        return EvaluationResponse(**inserted)

    async def close(self):
        """Clean up resources"""
        await self.http_client.aclose()
