def send_alert(doc, score):
    print(f"ALERTE: Le document {doc['_id']} a un score d'obsolescence de {score}%")
