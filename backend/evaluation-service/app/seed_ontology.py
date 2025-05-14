from pymongo import MongoClient

# Connexion à la base
client = MongoClient('mongodb://localhost:27017/')
db = client['evaluation_db']
collection = db['documents']

# Chargement du contenu du fichier .ttl
with open('ontology_example.ttl', 'r', encoding='utf-8') as f:
    rdf_data = f.read()

# Création du document MongoDB
document = {
    "title": "Procédure formalisée en OWL",
    "rdf_content": rdf_data
}

# Insertion
result = collection.insert_one(document)
print(f"Document RDF inséré avec _id : {result.inserted_id}")
