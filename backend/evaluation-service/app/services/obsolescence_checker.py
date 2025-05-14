import re
from datetime import datetime, timedelta
from rdflib import Graph, URIRef, Namespace
import spacy
from spacy.matcher import Matcher
import requests
from pymongo import MongoClient
import pdfplumber
import os

# Initialiser le modèle Spacy pour l'analyse NLP
nlp = spacy.load("fr_core_news_lg")
EX = Namespace("http://example.org/ontology#")

# Token d'API Hugging Face
API_TOKEN = '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'

# Définir l'URL de l'API Hugging Face pour le modèle de classification
API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased"

# Définir les motifs comme variable globale pour la détection d'obsolescence
OBSOLESCENCE_PATTERNS = [
    [{"LEMMA": "replace"}, {"POS": "ADP", "OP": "?"}, {"POS": "NOUN"}],
    [{"LOWER": "incompatibility"}],
    [{"LEMMA": "not"}, {"LEMMA": "work"}],
    [{"LEMMA": "deprecate"}],
    [{"LOWER": "outdated"}],
    [{"LOWER": "unsupported"}],
    [{"LOWER": "obsolete"}],  # Ajout de "obsolete"
    [{"LOWER": "version obsolète"}],  # Expression en français
    [{"TEXT": {"REGEX": ".*incompatible.*"}}],  # Détecter "incompatible"
    [{"TEXT": {"REGEX": ".*mise à jour.*"}}],  # Recherche de "mise à jour"
    # Motifs français améliorés
    [{"LOWER": "obsolète"}],
    [{"LOWER": "déprécié"}],
    [{"LOWER": "périmé"}],
    [{"LOWER": "abandonné"}],
    [{"LOWER": "non maintenu"}],
    [{"LOWER": "incompatible"}],
    [{"LOWER": "mise à jour nécessaire"}],
    [{"LOWER": "ancienne version"}],
    [{"LOWER": "remplacé par"}],
    [{"LOWER": "ne fonctionne plus"}],
    [{"LOWER": "hors support"}],
    [{"TEXT": {"REGEX": ".*ancien.*technolog.*"}}],
    [{"TEXT": {"REGEX": ".*n'est plus.*support.*"}}],
    [{"TEXT": {"REGEX": ".*version.*précédente.*"}}],
    [{"TEXT": {"REGEX": ".*version.*antérieure.*"}}]
]

# Fonction pour extraire le texte d'un fichier PDF
def extract_text_from_pdf(file_path):
    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text(x_tolerance=3, y_tolerance=3)
                if text:
                    full_text += text + "\n"
                    
            if len(full_text) < 100:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            full_text += " ".join([cell if cell else "" for cell in row]) + "\n"
            return full_text
    except Exception as e:
        print(f"Erreur lors de l'extraction du texte du PDF: {e}")
        return ""

# Fonction pour détecter les phrases obsolètes dans le texte (NLP)
def is_obsolete_phrase(text):
    doc = nlp(text)
    matcher = Matcher(nlp.vocab)
    matcher.add("OBSOLETE", OBSOLESCENCE_PATTERNS, on_match=None)
    matches = matcher(doc)
    return len(matches) > 0

# Fonction pour prétraiter le texte du document
def pretraiter_document(texte):
    texte = re.sub(r'Page \d+ sur \d+', '', texte)  # Supprimer numéros de pages
    texte = re.sub(r'\s+', ' ', texte).strip()  # Supprimer les espaces excessifs
    texte = re.sub(r'(\d{2})/(\d{2})/(\d{4})', r'\3-\2-\1', texte)  # Convertir les formats de dates
    return texte

# Fonction pour envoyer un texte à l'API Hugging Face pour classification
def classify_document_with_huggingface(text):
    headers = {
        "Authorization": f"Bearer {API_TOKEN}"
    }
    payload = {
        "inputs": text
    }
    response = requests.post(API_URL, headers=headers, json=payload)

    # Vérifiez la structure de la réponse
    if response.status_code == 200:
        print("Réponse de Hugging Face : ", response.json())  # Afficher la réponse pour comprendre la structure
        return response.json()  # Renvoie le résultat de la classification
    else:
        return f"Error: {response.status_code}, {response.text}"

# Fonction pour vérifier l'obsolescence d'un document
def check_obsolescence(doc):
    analysis = {
        'age': 0,
        'firmware_obsolete': False,
        'logs_mention_issue': False,
        'rdf_score': 0,
        'nlp_detected_problem': False,
        'nlp_score': 0,
        'classification_score': 0
    }

    # Analyse de l'âge - approche plus granulaire
    if 'last_modified' in doc:
        try:
            last_mod = datetime.strptime(doc['last_modified'], '%Y-%m-%d')
            days_old = (datetime.now() - last_mod).days
            if days_old > 730:  # 2 ans
                analysis['age'] = 2  # Âge critique
            elif days_old > 365:  # 1 an
                analysis['age'] = 1  # Âge d'avertissement
        except ValueError:
            pass

    # Motif regex amélioré pour le firmware
    firmware_pattern = r'firmware\s+([0-9]+\.[0-9]+)|version\s+([0-9]+\.[0-9]+)'
    if 'content' in doc:
        processed_content = pretraiter_document(doc['content'])
        firmware_matches = re.findall(firmware_pattern, processed_content, re.IGNORECASE)
        if firmware_matches:
            for match in firmware_matches:
                version = match[0] if match[0] else match[1]
                major_version = version.split('.')[0]
                if major_version in ['1', '2', '3']:
                    analysis['firmware_obsolete'] = True
                    break

    # Analyse des logs améliorée avec plus de motifs d'erreur
    if 'logs' in doc:
        error_patterns = [
            'reset failed', 'error', 'échec', 'défaillance', 'incompatible',
            'version non supportée', 'échec de mise à jour', 'obsolète',
            'erreur critique', 'non compatible', 'plantage', 'crash',
            'défaut système', 'redémarrage inattendu', 'système instable'
        ]
        for pattern in error_patterns:
            if pattern.lower() in doc['logs'].lower():
                analysis['logs_mention_issue'] = True
                break

    # Analyse NLP améliorée
    if 'content' in doc:
        processed_content = pretraiter_document(doc['content'])
        try:
            classification = classify_document_with_huggingface(processed_content[:512])  # Limite pour éviter le dépassement de tokens
            
            # Vérifier la structure de la réponse et obtenir les résultats
            if classification and 'label' in classification[0]:
                if classification[0]['label'] == 'OBSOLETE':
                    analysis['classification_score'] = int(classification[0]['score'] * 40)
        except Exception as e:
            print(f"Erreur lors de la classification: {e}")
        
        if is_obsolete_phrase(processed_content):
            analysis['nlp_detected_problem'] = True
            doc_tokens = nlp(processed_content)
            matcher = Matcher(nlp.vocab)
            matcher.add("OBSOLETE", OBSOLESCENCE_PATTERNS, on_match=None)
            matches = matcher(doc_tokens)
            analysis['nlp_score'] = min(50, len(matches) * 5)  # Plafonné à 50 points

    # Analyse RDF
    if 'rdf_content' in doc:
        try:
            g = Graph()
            g.parse(data=doc['rdf_content'], format="ttl")
            for s, p, o in g.triples((None, URIRef("http://www.w3.org/2002/07/owl#deprecated"), None)):
                if o.toPython() == True:
                    analysis['rdf_score'] += 40
            for s, p, o in g.triples((None, EX.hasFirmware, None)):
                version_str = str(o.toPython())
                if re.match(r'^[123]\.[0-9]', version_str):
                    analysis['rdf_score'] += 30
            for s, p, o in g.triples((None, EX.lastUpdated, None)):
                try:
                    last_update = datetime.strptime(str(o.toPython()), '%Y-%m-%d')
                    if (datetime.now() - last_update).days > 365:
                        analysis['rdf_score'] += 20
                except ValueError:
                    pass
        except Exception as e:
            print(f"Erreur lors de l'analyse RDF: {e}")

    return analysis

# Fonction pour calculer le score global d'obsolescence
def calculate_score(analysis):
    score = 0
    
    if analysis.get('age') == 2:
        score += 30  # Âge critique
    elif analysis.get('age') == 1:
        score += 15  # Âge d'avertissement
    
    if analysis.get('firmware_obsolete'):
        score += 40
    
    if analysis.get('logs_mention_issue'):
        score += 30
    
    if analysis.get('rdf_score'):
        score += min(90, analysis['rdf_score'])
    
    if analysis.get('nlp_score'):
        score += analysis['nlp_score']
    
    if analysis.get('classification_score'):
        score += analysis['classification_score']
    
    return min(100, score)


# Fonction pour scanner les documents
def scan_documents():
    documents = get_all_documents()
    results = []
    
    for doc in documents:
        analysis = check_obsolescence(doc)
        score = calculate_score(analysis)
        results.append({
            'document_id': doc.get('_id', ''),
            'title': doc.get('title', 'Sans titre'),
            'obsolescence_score': score,
            'analysis': analysis,
            'scan_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return results


# Fonction pour obtenir tous les documents (à implémenter selon votre structure de données)
def get_all_documents():
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['knowledge_base']
        collection = db['documents']
        return list(collection.find())
    except Exception as e:
        print(f"Erreur lors de la récupération des documents: {e}")
        return []


# Fonction principale
def main():
    print("Démarrage de l'analyse d'obsolescence des documents...")
    results = scan_documents()
    
    for result in results:
        print(f"Document: {result['title']}")
        print(f"Score d'obsolescence: {result['obsolescence_score']}%")
        print(f"Analyse: {result['analysis']}")
        print("-----------------------------------")
        
    print(f"Analyse terminée. {len(results)} documents analysés.")


if __name__ == "__main__":
    main()
