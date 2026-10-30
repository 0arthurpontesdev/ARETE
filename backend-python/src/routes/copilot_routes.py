import logging
from flask import Blueprint, jsonify, request
from src.services.ai_copilot_service import MeetingAICopilotService

logger = logging.getLogger(__name__)

copilot_bp = Blueprint("copilot", __name__)
copilot_service = MeetingAICopilotService()

@copilot_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Meeting AI Copilot",
        "gemini_active": copilot_service.is_gemini_available()
    }), 200

@copilot_bp.route("/summary", methods=["POST"])
def get_summary():
    try:
        data = request.get_json(silent=True) or {}
        summary = copilot_service.generate_summary(data)
        return jsonify(summary), 200
    except Exception as e:
        logger.exception("Error generating summary")
        return jsonify({"error": str(e)}), 500

@copilot_bp.route("/minutes", methods=["POST"])
def get_minutes():
    try:
        data = request.get_json(silent=True) or {}
        minutes = copilot_service.generate_minutes(data)
        return jsonify(minutes), 200
    except Exception as e:
        logger.exception("Error generating minutes")
        return jsonify({"error": str(e)}), 500

@copilot_bp.route("/action-items", methods=["POST"])
def get_action_items():
    try:
        data = request.get_json(silent=True) or {}
        items = copilot_service.generate_action_items(data)
        return jsonify(items), 200
    except Exception as e:
        logger.exception("Error extracting action items")
        return jsonify({"error": str(e)}), 500

@copilot_bp.route("/ask", methods=["POST"])
def ask_question():
    try:
        payload = request.get_json(silent=True) or {}
        meeting_data = payload.get("meeting_data", payload)
        question = payload.get("question", "")
        answer = copilot_service.answer_question(meeting_data, question)
        return jsonify(answer), 200
    except Exception as e:
        logger.exception("Error processing question")
        return jsonify({"error": str(e)}), 500
