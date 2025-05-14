import pdfplumber
import re
from datetime import datetime
from pymongo import MongoClient

# Connexion à MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client.evaluation_db
collection = db.documents

# Fonction pour extraire le texte d'un fichier PDF
def extract_text_from_pdf(file_path):
    with pdfplumber.open(file_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text()
    return full_text

# Fonction pour analyser le texte du document (exemple d'analyse basique)
def check_obsolescence(content):
    analysis = {
        'firmware_obsolete': False,
        'logs_mention_issue': False,
        'nlp_score': 0
    }

    # Rechercher des versions obsolètes dans le contenu
    if re.search(r'firmware\s+2\.[0-9]', content):  # Recherche de version de firmware obsolète
        analysis['firmware_obsolete'] = True

    # Exemple de détection de logs d'erreur
    if "reset failed" in content:
        analysis['logs_mention_issue'] = True

    # Exemple d'analyse NLP simple (recherche d'expressions obsolètes)
    if re.search(r'deprecate|obsolete|no longer supported', content, re.IGNORECASE):
        analysis['nlp_score'] = 25

    return analysis

# Fonction principale pour insérer un document dans MongoDB après analyse
def insert_document_into_db(file_path):
    # Extraire le texte du fichier PDF
    document_text = extract_text_from_pdf(file_path)

    # Effectuer l'analyse du contenu
    analysis = check_obsolescence(document_text)

    # Calculer un score d'obsolescence simple (exemple)
    obsolescence_score = 0
    if analysis['firmware_obsolete']:
        obsolescence_score += 40
    if analysis['logs_mention_issue']:
        obsolescence_score += 20
    if analysis['nlp_score']:
        obsolescence_score += analysis['nlp_score']

    # Créer le document à insérer dans MongoDB
    document_data = {
        'file_name': 'extra skill checks_alarm_surveillance.pdf',  # Nom du fichier
        'content': document_text,           # Contenu du fichier extrait
        'analysis': analysis,               # Résultats de l'analyse
        'obsolescence_score': obsolescence_score,  # Score d'obsolescence
        'date_uploaded': datetime.now(),    # Date du téléchargement
        'status': 'Pending Review'          # Statut du document
    }

    # Insérer le document dans la collection MongoDB
    result = collection.insert_one(document_data)

    # Afficher l'ID du document inséré
    print(f"Document inséré avec _id : {result.inserted_id}")

# Appeler la fonction avec le fichier téléchargé
file_path = './extra skill checks_alarm_surveillance.pdf'  # Chemin vers le fichier PDF téléchargé
insert_document_into_db(file_path)
