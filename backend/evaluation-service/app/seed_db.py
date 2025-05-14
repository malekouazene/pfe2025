

from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['evaluation_db']
collection = db['documents']

document = {
    "title": "Procédure Huawei X150",
    "last_modified": "2021-04-01",
    "content": "Procédure de réinitialisation du firmware 2.1 : utilisez la commande reset. Pour les versions supérieures, consultez la documentation.",
    "logs": "Erreur récurrente : reset failed on firmware 3.0. Solution trouvée : utiliser --force."
}

result = collection.insert_one(document)
print(f"Document inséré avec _id : {result.inserted_id}")
