# app.py
from flask import Flask
from flask_cors import CORS
from routes import api

app = Flask(__name__)
# Habilitar CORS para todas las rutas o solo para el blueprint /api
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(api)

if __name__ == '__main__':
    app.run(debug=True)
