
### backend/app/routes/evaluation.py
from flask import Blueprint, jsonify
from app.services.document_scanner import scan_documents
from app.services.obsolescence_checker import check_obsolescence
from app.services.score_calculator import calculate_score
from app.services.alert_dispatcher import send_alert

evaluation_bp = Blueprint('evaluation', __name__)

@evaluation_bp.route('/evaluate', methods=['GET'])
def evaluate_documents():
    documents = scan_documents()
    results = []

    for doc in documents:
        analysis = check_obsolescence(doc)
        score = calculate_score(analysis)
        if score >= 70:
            send_alert(doc, score)
        results.append({
            "doc_id": str(doc.get("_id")),
            "score": score,
            "status": "À réviser" if score >= 70 else "Valide"
        })

    return jsonify(results)
