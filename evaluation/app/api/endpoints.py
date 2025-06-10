from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from ..services.evaluation import EvaluationService
from ..schemas.evaluation import (
    EvaluationRequest,
    EvaluationResponse,
    BatchEvaluationRequest,
    BatchEvaluationResponse,
    EvaluationsListResponse  # You'll need to create this schema
)
from ..db.database import get_db
from ..core.config import settings
from ..db.models import EvaluationStatus
import logging
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/evaluations",
    tags=["Evaluations"],
    responses={404: {"description": "Not found"}}
)

logger = logging.getLogger(__name__)

@router.post(
    "/",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Évalue un document",
    description="Effectue une évaluation complète d'un document selon les critères configurés"
)
async def evaluate_document(
    request: EvaluationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    service = EvaluationService(db[settings.EVALUATION_COLLECTION])
    try:
        evaluation = await service.evaluate_document(
            request.document_id, 
            request.force_refresh
        )
        return evaluation
    finally:
        await service.close()

@router.post(
    "/batch",
    response_model=BatchEvaluationResponse,
    summary="Évalue plusieurs documents",
    description="Effectue des évaluations en batch pour plusieurs documents"
)
async def batch_evaluate(
    request: BatchEvaluationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    service = EvaluationService(db[settings.EVALUATION_COLLECTION])
    try:
        results = []
        failed = 0
        
        for doc_id in request.document_ids:
            try:
                eval = await service.evaluate_document(doc_id, request.force_refresh)
                results.append(eval)
            except Exception as e:
                logger.error(f"Failed to evaluate {doc_id}: {str(e)}")
                failed += 1
        
        # Calcul du résumé par statut
        status_summary = {
            status.value: sum(1 for e in results if e.status == status) 
            for status in EvaluationStatus
        }
        
        return BatchEvaluationResponse(
            processed_count=len(results),
            failed_count=failed,
            results=results,
            status_summary=status_summary
        )
    finally:
        await service.close()

@router.get(
    "/{document_id}/history",
    response_model=List[EvaluationResponse],
    summary="Historique des évaluations",
    description="Récupère l'historique des évaluations pour un document"
)
async def get_evaluation_history(
    document_id: str,
    limit: int = 5,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    service = EvaluationService(db[settings.EVALUATION_COLLECTION])
    try:
        evaluations = await service.collection.find(
            {"document_id": document_id},
            limit=limit,
            sort=[("evaluated_at", -1)]
        ).to_list(length=limit)
        
        return [EvaluationResponse(**eval) for eval in evaluations]
    finally:
        await service.close()

@router.get(
    "/",
    response_model=EvaluationsListResponse,
    summary="Liste des évaluations",
    description="Récupère une liste des évaluations pour tous les documents avec possibilité de filtrage"
)
async def list_evaluations(
    status: Optional[str] = Query(None, description="Filtrer par statut d'évaluation"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Score minimum"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Score maximum"),
    notification_sent: Optional[bool] = Query(None, description="Filtre sur l'envoi de notification"),
    days: Optional[int] = Query(7, ge=1, description="Évaluations des N derniers jours"),
    skip: int = Query(0, ge=0, description="Nombre d'enregistrements à sauter (pagination)"),
    limit: int = Query(20, ge=1, le=100, description="Nombre maximum d'enregistrements à retourner"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    service = EvaluationService(db[settings.EVALUATION_COLLECTION])
    try:
        # Construire la requête avec les filtres fournis
        query = {}
        
        if status:
            try:
                eval_status = EvaluationStatus(status)
                query["status"] = eval_status
            except ValueError:
                valid_statuses = [s.value for s in EvaluationStatus]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Statut invalide. Valeurs autorisées: {', '.join(valid_statuses)}"
                )
        
        if min_score is not None or max_score is not None:
            score_query = {}
            if min_score is not None:
                score_query["$gte"] = min_score
            if max_score is not None:
                score_query["$lte"] = max_score
            if score_query:
                query["score"] = score_query
        
        if notification_sent is not None:
            query["notification_sent"] = notification_sent
            
        if days:
            date_limit = datetime.utcnow() - timedelta(days=days)
            query["evaluated_at"] = {"$gte": date_limit}
        
        # Exécuter la requête avec pagination
        total_count = await service.collection.count_documents(query)
        
        evaluations = await service.collection.find(
            query,
            skip=skip,
            limit=limit,
            sort=[("evaluated_at", -1)]
        ).to_list(length=limit)
        
        # Préparer le résumé des statuts pour les résultats filtrés
        status_counts = {}
        for status in EvaluationStatus:
            status_query = {**query, "status": status}
            status_counts[status.value] = await service.collection.count_documents(status_query)
        
        return EvaluationsListResponse(
            total_count=total_count,
            page_size=limit,
            current_page=skip // limit + 1 if limit > 0 else 1,
            evaluations=[EvaluationResponse(**eval) for eval in evaluations],
            status_summary=status_counts
        )
    finally:
        await service.close()