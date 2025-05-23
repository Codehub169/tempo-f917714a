import os
from flask import Flask, jsonify, make_response
from flask_cors import CORS
from backend import database # Assuming database.py is in the same 'backend' package

def create_app(test_config=None):
    """Create and configure an instance of the Flask application."""
    # __name__ will be 'backend.app' if run via FLASK_APP=backend.app from project root
    # or 'app' if gunicorn chdir to backend and runs app:app
    # instance_relative_config=True means instance_path is relative to the app's root path
    # If __name__ is 'app' (e.g. via gunicorn --chdir backend), app.root_path is 'backend/', instance_path is 'backend/instance/'
    app = Flask(__name__, instance_relative_config=True)
    
    # --- Configuration ---
    # Default configuration
    app.config.from_mapping(
        SECRET_KEY="dev", # Replace with a random value for production
        # DATABASE will be in 'backend/instance/games.db'
        DATABASE=os.path.join(app.instance_path, "games.db"),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        # from 'backend/instance/config.py'
        app.config.from_pyfile("config.py", silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists (database.py also does this, but good practice here too)
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass # Already exists or race condition, database.py will handle actual creation if needed

    # --- Initialize Extensions ---
    # Enable CORS for all domains on all routes under /api/
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database module
    database.init_app(app)

    # --- Blueprints and Routes ---
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Health check endpoint."""
        return jsonify({"status": "healthy", "message": "Backend is running"})

    @app.route("/api/games", methods=["GET"])
    def get_games():
        """API endpoint to retrieve a list of all games."""
        try:
            games_list = database.get_all_games()
            return jsonify(games_list)
        except Exception as e:
            app.logger.error(f"Error fetching games: {e}")
            return make_response(jsonify({"error": "Failed to retrieve games", "details": str(e)}), 500)

    @app.route("/api/games/<int:game_id>", methods=["GET"])
    def get_game(game_id):
        """API endpoint to retrieve details for a specific game by its ID."""
        try:
            game = database.get_game_by_id(game_id)
            if game is None:
                return make_response(jsonify({"error": "Game not found"}), 404)
            return jsonify(game)
        except Exception as e:
            app.logger.error(f"Error fetching game ID {game_id}: {e}")
            return make_response(jsonify({"error": "Failed to retrieve game details", "details": str(e)}), 500)

    # --- Error Handlers ---
    @app.errorhandler(404)
    def not_found_error(error):
        return make_response(jsonify({"error": "Not Found", "message": str(error)}), 404)

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Server Error: {error}")
        return make_response(jsonify({"error": "Internal Server Error", "message": str(error)}), 500)

    return app

# This allows 'flask run' (if FLASK_APP=backend.app from root) 
# or gunicorn to find the app (gunicorn app:app --chdir backend)
app = create_app()

if __name__ == "__main__":
    # For local development run (python backend/app.py)
    # Note: 'flask run' or gunicorn is preferred for development/production
    # When run directly, __name__ is '__main__', so instance_path might be different
    # For consistency, use `flask run` or gunicorn via startup.sh
    # This direct run will use an instance folder relative to backend/app.py's location
    local_app = create_app() # Create a specific instance for direct run
    local_app.run(host="0.0.0.0", port=5000, debug=True)
