from datetime import datetime
from bson import ObjectId
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
import httpx
from .sentiment import analyze_sentiment

COLLECTION_NAME = "feedbacks"

# Champs spécifiques par type de feedback
FEEDBACK_FIELDS = {
    "USER_EXPERIENCE": [
        "rating", "navigation_score", "access_score", "clarity_score", "experience_description"
    ],
    "SUGGESTION": [
        "suggestion_type", "resource_concerned", "suggestion_description", "priority", "attachment"
    ],
    "PROBLEM": [
        "problem_resource", "problem_type", "problem_description", "severity"
    ],
    "SUPPORT_REQUEST": [
        "support_subject", "support_context", "urgency", "resource_type"
    ]
}

REQUIRED_FIELDS = {
    "USER_EXPERIENCE": ["rating", "user_id", "user_name"],
    "SUGGESTION": ["suggestion_description", "user_id", "user_name"],
    "PROBLEM": ["problem_description", "user_id", "user_name"],
    "SUPPORT_REQUEST": ["support_subject", "user_id", "user_name"]
}

def validate_feedback_data(feedback_data: dict, feedback_type: str):
    required_fields = REQUIRED_FIELDS.get(feedback_type, [])
    missing_fields = []

    for field in required_fields:
        if field not in feedback_data or feedback_data[field] is None or feedback_data[field] == "":
            missing_fields.append(field)

    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Champs obligatoires manquants pour {feedback_type}: {', '.join(missing_fields)}"
        )

    if feedback_type == "USER_EXPERIENCE":
        rating = feedback_data.get("rating")
        if rating is not None and (rating < 1 or rating > 5):
            raise HTTPException(status_code=400, detail="Le rating doit être entre 1 et 5")

    return True

def make_json_serializable(data: dict) -> dict:
    def serialize_value(v):
        if isinstance(v, datetime):
            return v.isoformat()
        elif isinstance(v, ObjectId):
            return str(v)
        elif isinstance(v, dict):
            return make_json_serializable(v)
        elif isinstance(v, list):
            return [serialize_value(i) for i in v]
        return v

    return {k: serialize_value(v) for k, v in data.items()}

async def create_feedback(feedback_data: dict, db):
    feedback_type = feedback_data.get("feedback_type")

    if not feedback_type or feedback_type not in FEEDBACK_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=f"Type de feedback invalide. Types autorisés: {list(FEEDBACK_FIELDS.keys())}"
        )

    validate_feedback_data(feedback_data, feedback_type)
    allowed_fields = FEEDBACK_FIELDS.get(feedback_type, []) + ["user_id", "user_name"]

    base_fields = {
        "feedback_type": feedback_type,
        "status": "Nouveau",
        "created_at": datetime.utcnow()
    }

    filtered_data = {
        field: feedback_data[field]
        for field in allowed_fields
        if field in feedback_data and feedback_data[field] is not None
    }

    if not filtered_data:
        raise HTTPException(
            status_code=400,
            detail=f"Aucune donnée valide fournie pour le type {feedback_type}"
        )

    final_data = {**base_fields, **filtered_data}

    try:
        result = await db[COLLECTION_NAME].insert_one(final_data)
        inserted_id = str(result.inserted_id)

        # Analyse de sentiment
        feedback_text = (
            filtered_data.get("experience_description") or
            filtered_data.get("suggestion_description") or
            filtered_data.get("problem_description") or
            filtered_data.get("support_context")
        )

        if feedback_text:
            try:
                sentiment_result = analyze_sentiment(feedback_text)
                await db[COLLECTION_NAME].update_one(
                    {"_id": ObjectId(inserted_id)},
                    {"$set": {
                        "sentiment": sentiment_result["sentiment"],
                        "raw_label": sentiment_result["raw_label"],
                        "confidence": sentiment_result["score"]
                    }}
                )
            except Exception as sentiment_err:
                print(f"⚠️ Erreur analyse de sentiment : {sentiment_err}")

        return {
            "id": inserted_id,
            **make_json_serializable(final_data)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'insertion en base: {str(e)}"
        )
# ✅ CORRECTION : Utiliser COLLECTION_NAME partout
async def get_feedbacks_by_status(status: str, db):
    feedbacks = await db[COLLECTION_NAME].find({"status": status}).to_list(length=100)
    
    for feedback in feedbacks:
        feedback["id"] = str(feedback.pop("_id"))
    
    return feedbacks

# Autres fonctions CRUD restent identiques...
async def get_all_feedbacks(db, skip: int = 0, limit: int = 100):
    cursor = db[COLLECTION_NAME].find().skip(skip).limit(limit)
    feedbacks = await cursor.to_list(length=limit)
    
    for feedback in feedbacks:
        feedback["id"] = str(feedback.pop("_id"))
    
    return feedbacks

async def get_feedback_by_id(feedback_id: str, db):
    try:
        object_id = ObjectId(feedback_id)
    except (ValueError, TypeError):  # ✅ Plus spécifique
        raise HTTPException(status_code=400, detail="ID de feedback invalide")
    
    feedback = await db[COLLECTION_NAME].find_one({"_id": object_id})
    
    if feedback:
        feedback["id"] = str(feedback.pop("_id"))
        return feedback
    
    raise HTTPException(status_code=404, detail="Feedback non trouvé")

async def update_feedback_status(feedback_id: str, status: str, db):
    try:
        object_id = ObjectId(feedback_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID de feedback invalide")
    
    result = await db[COLLECTION_NAME].update_one(
        {"_id": object_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feedback non trouvé")
    
    return await get_feedback_by_id(feedback_id, db)

# pour le UX ( resumer de score et les description de users ) -> ADMINE 
async def get_ux_summary(db):
    try:
        feedbacks = await db[COLLECTION_NAME].find({"feedback_type": "USER_EXPERIENCE"}).to_list(length=100)

        if not feedbacks:
            return {
                "average_rating": None,
                "average_navigation": None,
                "average_access": None,
                "average_clarity": None,
                "descriptions": [],
                "sentiments": {
                    "positif": 0,
                    "neutre": 0,
                    "négatif": 0
                }
            }

        count = len(feedbacks)

        def safe_avg(field):
            vals = [fb.get(field) for fb in feedbacks if fb.get(field) is not None]
            return round(sum(vals) / len(vals), 2) if vals else None

        descriptions = []
        sentiments_counter = {"positif": 0, "neutre": 0, "négatif": 0}

        for fb in feedbacks:
            # Récupération des descriptions
            desc = fb.get("experience_description")
            if desc:
                descriptions.append(desc)

            # Comptage des sentiments
            sentiment = fb.get("sentiment", "neutre").lower()
            if sentiment not in sentiments_counter:
                sentiment = "neutre"
            sentiments_counter[sentiment] += 1

        return {
            "average_rating": safe_avg("rating"),
            "average_navigation": safe_avg("navigation_score"),
            "average_access": safe_avg("access_score"),
            "average_clarity": safe_avg("clarity_score"),
            "descriptions": descriptions,
            "sentiments": sentiments_counter
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'agrégation UX: {str(e)}")


# pour les 03 type ( probeleme, suggestion , support )  ( resumer avec leur priorite) -> EXPERT 

async def get_feedbacks_by_priority_level(priority_level: str, db):
    expert_types = ["SUGGESTION", "PROBLEM", "SUPPORT_REQUEST"]
    query = {"feedback_type": {"$in": expert_types}}

    feedbacks = await db[COLLECTION_NAME].find(query).to_list(length=200)

    filtered = []

    for fb in feedbacks:
        level = "LOW"

        if fb["feedback_type"] == "PROBLEM":
            severity = fb.get("severity")
            if severity == "Critique":
                level = "HIGH"
            elif severity == "Modéré":
                level = "MEDIUM"

        elif fb["feedback_type"] == "SUPPORT_REQUEST":
            urgency = fb.get("urgency")
            if urgency == "Urgente":
                level = "HIGH"

        elif fb["feedback_type"] == "SUGGESTION":
            priority = fb.get("priority")
            if priority == "Élevée":
                level = "HIGH"
            elif priority == "Moyenne":
                level = "MEDIUM"

        if level == priority_level:
            fb["id"] = str(fb.pop("_id"))
            filtered.append(fb)

    return filtered
async def analyze_feedbacks_for_expert(db):
    """
    Analyse les feedbacks pour les experts avec statistiques par priorité
    """
    try:
        expert_types = ["SUGGESTION", "PROBLEM", "SUPPORT_REQUEST"]
        feedbacks = await db[COLLECTION_NAME].find(
            {"feedback_type": {"$in": expert_types}}
        ).to_list(length=500)

        if not feedbacks:
            return {
                "total_count": 0,
                "priority_breakdown": {
                    "HIGH": 0,
                    "MEDIUM": 0, 
                    "LOW": 0
                },
                "type_breakdown": {
                    "SUGGESTION": 0,
                    "PROBLEM": 0,
                    "SUPPORT_REQUEST": 0
                },
                "status_breakdown": {},
                "sentiment_breakdown": {
                    "positif": 0,
                    "neutre": 0,
                    "négatif": 0
                }
            }

        # Initialisation des compteurs
        priority_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        type_counts = {"SUGGESTION": 0, "PROBLEM": 0, "SUPPORT_REQUEST": 0}
        status_counts = {}
        sentiment_counts = {"positif": 0, "neutre": 0, "négatif": 0}

        for fb in feedbacks:
            feedback_type = fb["feedback_type"]
            
            # Comptage par type
            type_counts[feedback_type] += 1
            
            # Comptage par statut
            status = fb.get("status", "Nouveau")
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Comptage par sentiment
            sentiment = fb.get("sentiment", "neutre").lower()
            if sentiment not in sentiment_counts:
                sentiment = "neutre"
            sentiment_counts[sentiment] += 1
            
            # Détermination du niveau de priorité
            priority_level = "LOW"  # Par défaut
            
            if feedback_type == "PROBLEM":
                severity = fb.get("severity")
                if severity == "Critique":
                    priority_level = "HIGH"
                elif severity == "Modéré":
                    priority_level = "MEDIUM"
                    
            elif feedback_type == "SUPPORT_REQUEST":
                urgency = fb.get("urgency")
                if urgency == "Urgente":
                    priority_level = "HIGH"
                elif urgency == "Normale":
                    priority_level = "MEDIUM"
                    
            elif feedback_type == "SUGGESTION":
                priority = fb.get("priority")
                if priority == "Élevée":
                    priority_level = "HIGH"
                elif priority == "Moyenne":
                    priority_level = "MEDIUM"
            
            priority_counts[priority_level] += 1

        return {
            "total_count": len(feedbacks),
            "priority_breakdown": priority_counts,
            "type_breakdown": type_counts,
            "status_breakdown": status_counts,
            "sentiment_breakdown": sentiment_counts
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur lors de l'analyse des feedbacks expert: {str(e)}"
        )