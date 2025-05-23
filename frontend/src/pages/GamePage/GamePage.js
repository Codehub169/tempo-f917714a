import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGameById } from '../../services/gameService';
import GameEmbed from '../../components/GameEmbed/GameEmbed';
import './GamePage.css';

// Icon for back button (using a simple arrow character for now)
const BackIcon = () => <span className="back-icon">&lt;</span>; 

const GamePage = () => {
  // Get gameId from URL parameters
  const { gameId } = useParams();
  
  // State for game data, loading status, and errors
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to fetch game data when component mounts or gameId changes
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getGameById(gameId);
        setGame(data);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError(err.response?.data?.error || 'Failed to load game details. The cyber-void seems to have claimed this transmission.');
      }
      setLoading(false);
    };

    fetchGameData();
  }, [gameId]);

  // Display loading state
  if (loading) {
    return (
      <div className="game-page-loading">
        <div className="cyber-loader-gpage"></div>
        <p className="loading-text-gpage flicker-text">Accessing Game Matrix...</p>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="game-page-error">
        <h2 className="error-title flicker-text">SYSTEM ERROR</h2>
        <p>{error}</p>
        <Link to="/games" className="game-page-back-link error-back-link">
          <BackIcon /> Return to Safe Zone (Games List)
        </Link>
      </div>
    );
  }

  // Display message if game data is not found
  if (!game) {
    return (
      <div className="game-page-error">
        <h2 className="error-title flicker-text">TRANSMISSION LOST</h2>
        <p>Game data not found. It might have been purged from the archives.</p>
        <Link to="/games" className="game-page-back-link error-back-link">
          <BackIcon /> Return to Archives (Games List)
        </Link>
      </div>
    );
  }

  // Main game page content
  return (
    <div className="game-page">
      <div className="game-page-header">
        <Link to="/games" className="game-page-back-link">
          <BackIcon /> Back to Games
        </Link>
        <h1 className="game-page-title flicker-text">{game.title}</h1>
        {game.details_image_url && (
          <div 
            className="game-banner-image"
            style={{ backgroundImage: `url(${game.details_image_url})` }}
            role="img"
            aria-label={`${game.title} promotional image`}
          >
            <div className="game-banner-overlay"></div>
          </div>
        )}
      </div>

      <div className="game-content-wrapper">
        <div className="game-embed-section">
          <GameEmbed game={game} />
        </div>

        <div className="game-details-section">
          <h2 className="section-subtitle">Game Intel:</h2>
          <p className="game-description">{game.description}</p>
          <div className="game-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Genre:</span>
              <span className="meta-value">{game.genre}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Developer:</span>
              <span className="meta-value">{game.developer}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Release Date:</span>
              <span className="meta-value">{game.release_date}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GamePage;
