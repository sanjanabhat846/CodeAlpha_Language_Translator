"""
Flask REST API Application Factory & Route Definitions.
Provides RESTful translation endpoints.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

from backend.config import config_by_name
from backend.services.translation_service import TranslationService
from backend.utils import extract_translation_payload

# Initialize service instance
translation_service = TranslationService()


def create_app(config_name="dev"):
    """
    Flask Application Factory.
    Initializes Flask application configuration,
    CORS, routes, and error handlers.
    """

    app = Flask(__name__)
    app.config.from_object(
        config_by_name.get(config_name, config_by_name["dev"])
    )

    # Enable CORS
    CORS(app)

    # ==========================================================
    # HOME ROUTE
    # ==========================================================

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "message": "Welcome to CodeAlpha Language Translator API",
            "status": "running",
            "available_endpoints": {
                "Health Check": "/health",
                "Translate": "/translate",
                "Translate (API)": "/api/translate",
                "Languages": "/languages",
                "Languages (API)": "/api/languages"
            }
        }), 200

    # ==========================================================
    # HEALTH CHECK
    # ==========================================================

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Language Translator API"
        }), 200

    # ==========================================================
    # TRANSLATE
    # ==========================================================

    @app.route("/translate", methods=["POST"])
    @app.route("/api/translate", methods=["POST"])
    def translate():

        if not request.is_json:
            return jsonify({
                "error": "Content-Type must be application/json."
            }), 400

        data = request.get_json(silent=True)

        if data is None:
            return jsonify({
                "error": "Invalid JSON body."
            }), 400

        text, source, target = extract_translation_payload(data)

        response_data, status_code = (
            translation_service.process_translation(
                text=text,
                source=source,
                target=target
            )
        )

        return jsonify(response_data), status_code

    # ==========================================================
    # SUPPORTED LANGUAGES
    # ==========================================================

    @app.route("/languages", methods=["GET"])
    @app.route("/api/languages", methods=["GET"])
    def get_supported_languages():

        response_data, status_code = (
            translation_service.get_supported_languages()
        )

        return jsonify(response_data), status_code

    # ==========================================================
    # ERROR HANDLERS
    # ==========================================================

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "error": "Bad Request"
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Resource not found"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed"
        }), 405

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "error": "Internal Server Error"
        }), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )