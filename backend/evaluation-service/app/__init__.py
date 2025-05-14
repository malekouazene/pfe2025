
### backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
from app.routes.evaluation import evaluation_bp
from app.config import Config
from app.extensions import mongo

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    mongo.init_app(app)

    app.register_blueprint(evaluation_bp, url_prefix='/')

    return app