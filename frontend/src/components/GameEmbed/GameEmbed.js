import React, { useState, useEffect, useRef } from 'react';
import './GameEmbed.css';

/**
 * GameEmbed component displays an iframe for the selected game.
 *
 * @param {{ game: Object }} props - The props object.
 * @param {Object} props.game - The game object containing details like game_url and title.
 * @returns {JSX.Element | null} The rendered GameEmbed component or null if no game is provided.
 */
const GameEmbed = ({ game }) => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Reset loading state when game changes
    setIsLoading(true);
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoading(false);
      };
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [game]); // Re-run effect if game prop changes

  if (!game || !game.game_url) {
    return (
      <div className="game-embed-container game-embed-error">
        <p className="game-embed-error-message">Game data is unavailable. Please select another game.</p>
      </div>
    );
  }

  const { game_url, title } = game;

  return (
    <div className="game-embed-wrapper">
      {isLoading && (
        <div className="game-embed-loader-container">
          <div className="game-embed-loader">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
          <p className="loader-text">Initializing Game Matrix: {title}...</p>
        </div>
      )}
      <div className={`game-embed-container ${isLoading ? 'loading' : 'loaded'}`}>
        <iframe
          ref={iframeRef}
          src={game_url} // URLs like '/games/sample_game_1/index.html'
          title={title || 'Embedded Game'}
          className="game-iframe"
          frameBorder="0"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-pointer-lock" // Security: restrict iframe capabilities
        >
          Your browser does not support iframes.
        </iframe>
      </div>
    </div>
  );
};

export default GameEmbed;
