import os
from flask import Flask, jsonify, make_response, send_from_directory, request
from flask_cors import CORS
from backend import database # Assuming database.py is in the same 'backend' package

def create_app(test_config=None):
    """Create and configure an instance of the Flask application."""
    
    # Define the path to the frontend build directory
    # Relative to this file (backend/app.py), it's ../frontend/build
    frontend_build_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'))

    app = Flask(__name__, 
                instance_relative_config=True,
                static_folder=frontend_build_path,
                static_url_path='/') # Serve static files from the root URL
    
    # --- Configuration ---
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev"), # Use env var for secret key in prod
        DATABASE=os.path.join(app.instance_path, "games.db"),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        # e.g., backend/instance/config.py for production secret key
        app.config.from_pyfile("config.py", silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        # Directory already exists or race condition
        pass

    # --- Initialize Extensions ---
    # CORS for API routes. Frontend is same-origin now, but this is good for API flexibility.
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    database.init_app(app)

    # --- API Blueprints and Routes ---
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "healthy", "message": "Backend is running"})

    @app.route("/api/games", methods=["GET"])
    def get_games():
        try:
            games_list = database.get_all_games()
            return jsonify(games_list)
        except Exception as e:
            app.logger.error(f"Error fetching games: {e}")
            # For production, consider more generic error messages to the client
            return make_response(jsonify({"error": "Failed to retrieve games", "details": str(e)}), 500)

    @app.route("/api/games/<int:game_id>", methods=["GET"])
    def get_game(game_id):
        try:
            game = database.get_game_by_id(game_id)
            if game is None:
                return make_response(jsonify({"error": "Game not found"}), 404)
            return jsonify(game)
        except Exception as e:
            app.logger.error(f"Error fetching game ID {game_id}: {e}")
            return make_response(jsonify({"error": "Failed to retrieve game details", "details": str(e)}), 500)

    # --- Error Handlers and SPA Catch-all ---
    # Custom 404 handler to serve React app for client-side routes
    @app.errorhandler(404)
    def handle_404(e):
        # If the path starts with /api, it's a genuine API 404
        if request.path.startswith('/api/'):
            return make_response(jsonify({"error": "Not Found", "message": "The requested API endpoint does not exist."}), 404)
        
        # Otherwise, assume it's a frontend route and serve index.html
        # app.static_folder is already set to the frontend build directory
        index_html_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_html_path):
            # Return 200 for SPA routes handled by client-side routing
            return send_from_directory(app.static_folder, 'index.html'), 200 
        else:
            app.logger.error(f"Frontend index.html not found at {index_html_path}. Ensure frontend is built.")
            # This case is critical, means frontend build is missing where expected
            return make_response(jsonify({"error": "Frontend entry point not found. Build missing?"}), 500)

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Server Error: {error}")
        # Ensure the error response is JSON and avoid leaking too many details in prod
        # The current str(error) might be okay for this project's scope
        return make_response(jsonify({"error": "Internal Server Error", "message": str(error)}), 500)

    return app

# Create app instance for Gunicorn or 'flask run'
app = create_app()

if __name__ == "__main__":
    # For local development run (python backend/app.py)
    # This setup will also serve the frontend if it's built at ../frontend/build
    # Note: 'flask run' or gunicorn (via startup.sh) is preferred.
    print("Running in local development mode via __main__...")
    # Use a distinct app instance for this specific run if needed, or just use the global 'app'
    # create_app() is called above, so 'app' is already configured.
    app.run(host="0.0.0.0", port=5000, debug=True)
