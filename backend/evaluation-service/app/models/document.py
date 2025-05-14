

from app.extensions import mongo  

def get_all_documents():
    return list(mongo.db.documents.find())


