import React from 'react';
import { Link } from 'react-router-dom';
import './GameCard.css';

/**
 * GameCard component displays a single game's information in a card format.
 * It links to the individual game page.
 *
 * @param {{ game: Object }} props - The props object.
 * @param {Object} props.game - The game object containing details like id, title, thumbnail_url, genre.
 * @returns {JSX.Element} The rendered GameCard component.
 */
const GameCard = ({ game }) => {
  if (!game) {
    return null; // Or a placeholder/loading state
  }

  const { id, title, thumbnail_url, genre } = game;
  const defaultThumbnail = '/assets/images/game_thumb_default.png';

  return (
    <Link to={`/games/${id}`} className="game-card-link">
      <div className="game-card">
        <div className="game-card-image-container">
          <img 
            src={thumbnail_url || defaultThumbnail} 
            alt={`${title} thumbnail`} 
            className="game-card-thumbnail" 
            onError={(e) => { e.target.onerror = null; e.target.src=defaultThumbnail; }} // Fallback if thumbnail_url fails
          />
          <div className="game-card-overlay">
            <span className="game-card-play-icon">▶</span>
          </div>
        </div>
        <div className="game-card-content">
          <h3 className="game-card-title">{title}</h3>
          <p className="game-card-genre">{genre || 'N/A'}</p>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
