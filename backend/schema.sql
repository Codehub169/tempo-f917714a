DROP TABLE IF EXISTS games;

CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    genre TEXT NOT NULL,
    release_date TEXT, -- Can be a year or a full date string
    developer TEXT,
    game_url TEXT NOT NULL UNIQUE, -- Path to the game's index.html
    thumbnail_url TEXT, -- Path to the game's thumbnail image
    details_image_url TEXT, -- Path or URL to a larger image for the game page
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
