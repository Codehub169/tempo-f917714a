import sqlite3
import os
import json
import click
from flask import current_app, g

DATABASE_SCHEMA_FILE = "schema.sql"
INITIAL_DATA_FILE = "initial_games.json"

def get_db():
    """Connects to the application's configured database. 
    The connection is unique for each request and will be reused if called again.
    Creates the database file and its instance folder if they don't exist.
    """
    if "db" not in g:
        db_path = current_app.config["DATABASE"]
        # Ensure the instance folder (e.g., backend/instance) exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        g.db = sqlite3.connect(
            db_path,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row # Access columns by name
    return g.db

def close_db(e=None):
    """Closes the database connection if it exists."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the database by executing the schema and loading initial data.
    Reads schema from 'schema.sql' and data from 'initial_games.json'.
    These files are expected to be in the same directory as this script (backend/).
    """
    db = get_db()
    
    # Get path to schema.sql relative to this file (backend/schema.sql)
    schema_path = os.path.join(os.path.dirname(__file__), DATABASE_SCHEMA_FILE)
    if not os.path.exists(schema_path):
        click.echo(f"Error: Database schema file '{DATABASE_SCHEMA_FILE}' not found at {schema_path}. Database not fully initialized.", err=True)
        # Depending on policy, might want to raise an error or exit
    else:
        with open(schema_path, "r") as f:
            db.executescript(f.read())
        click.echo(f"Executed database schema from {DATABASE_SCHEMA_FILE}.")

    # Check if games table is empty before inserting initial data to avoid duplicates on re-init
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(id) FROM games")
    game_count = cursor.fetchone()[0]

    if game_count > 0:
        click.echo(f"Database already contains {game_count} games. Skipping initial data insertion.")
    else:
        # Get path to initial_games.json relative to this file (backend/initial_games.json)
        initial_data_path = os.path.join(os.path.dirname(__file__), INITIAL_DATA_FILE)
        if not os.path.exists(initial_data_path):
            click.echo(f"Warning: Initial data file '{INITIAL_DATA_FILE}' not found at {initial_data_path}. No initial data loaded.")
        else:
            with open(initial_data_path, "r") as f:
                try:
                    games_data = json.load(f)
                except json.JSONDecodeError as e:
                    click.echo(f"Error: Could not parse '{INITIAL_DATA_FILE}': {e}. No initial data loaded.", err=True)
                    return # Stop if JSON is invalid
            
            inserted_count = 0
            for game in games_data:
                try:
                    # Ensure all expected fields from schema are present or handled with defaults
                    cursor.execute(
                        "INSERT INTO games (title, description, genre, release_date, image_url, game_url, developer, rating) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (
                            game.get("title", "N/A"), 
                            game.get("description", ""), 
                            game.get("genre", ""), 
                            game.get("release_date", None),
                            game.get("image_url", None),
                            game.get("game_url", "#"),
                            game.get("developer", ""),
                            game.get("rating", None)
                        )
                    )
                    inserted_count += 1
                except sqlite3.IntegrityError as e:
                    click.echo(f"Warning: Could not insert game '{game.get('title')}'. IntegrityError: {e}", err=True)
                except KeyError as e:
                    click.echo(f"Warning: Missing key {e} for game '{game.get('title')}'. Skipping.", err=True)
            db.commit()
            if inserted_count > 0:
                click.echo(f"Inserted {inserted_count} initial games from {INITIAL_DATA_FILE}.")
            elif os.path.exists(initial_data_path):
                 click.echo(f"No games inserted from {INITIAL_DATA_FILE}. File might be empty or all games caused errors.")

@click.command("init-db")
def init_db_command():
    """Clear existing data (by dropping and recreating tables via schema) and create new tables, then load initial data."""
    try:
        init_db()
        click.echo("Initialized the database.")
    except Exception as e:
        click.echo(f"Failed to initialize database: {e}", err=True)
        import traceback
        click.echo(traceback.format_exc(), err=True)

def init_app(app):
    """Register database functions with the Flask app. This is called by the app factory in app.py."""
    app.teardown_appcontext(close_db) # Close DB connection when app context ends
    app.cli.add_command(init_db_command) # Add 'flask init-db' command

def query_db(query, args=(), one=False):
    """Helper function to query the database."""
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def get_all_games():
    """Retrieves all games from the database."""
    games = query_db("SELECT * FROM games ORDER BY title")
    return [dict(game) for game in games] if games else []

def get_game_by_id(game_id):
    """Retrieves a single game by its ID from the database."""
    game = query_db("SELECT * FROM games WHERE id = ?", (game_id,), one=True)
    return dict(game) if game else None
