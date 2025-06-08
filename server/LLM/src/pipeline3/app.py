from flask import Flask
from flask_cors import CORS
from chat_api import chat_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register blueprints
app.register_blueprint(chat_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 