import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.environ.get("COPILOT_PORT", 5001))
    HOST = os.environ.get("COPILOT_HOST", "0.0.0.0")
    DEBUG = os.environ.get("FLASK_ENV") == "development"
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    CORS_ORIGINS = [
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:4000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4000",
        "*"
    ]
