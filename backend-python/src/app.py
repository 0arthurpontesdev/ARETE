import logging
from flask import Flask, jsonify
from flask_cors import CORS
from src.config import Config
from src.routes.copilot_routes import copilot_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend and other origins
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register Blueprints
    app.register_blueprint(copilot_bp, url_prefix="/api/copilot")

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "service": "ARETÉ Meeting AI Copilot Service",
            "version": "1.0.0",
            "endpoints": [
                "/api/copilot/health",
                "/api/copilot/summary",
                "/api/copilot/minutes",
                "/api/copilot/action-items",
                "/api/copilot/ask"
            ]
        }), 200

    return app

app = create_app()

if __name__ == "__main__":
    logger.info(f"Starting ARETÉ AI Copilot Service on {Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
