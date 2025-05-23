import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../../components/GameCard/GameCard';
import { getAllGames } from '../../services/gameService'; 
import './HomePage.css';

const HomePage = () => {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const games = await getAllGames();
        // Select first 4 games as featured, or fewer if not enough games
        setFeaturedGames(games.slice(0, 4)); 
        setError(null);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError('Failed to load featured games. The Grid is unstable.');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title flicker-text">ENTER THE NEON ARCADE</h1>
          <p className="hero-subtitle">
            Dive into a curated collection of unique browser games, wrapped in a high-voltage cyberpunk aesthetic. Your next digital obsession awaits.
          </p>
          <Link to="/games" className="hero-cta-button">
            Explore All Games <span className="hero-cta-icon">▶</span>
          </Link>
        </div>
        <div className="hero-bg-overlay"></div>
      </section>

      <section className="featured-games-section">
        <h2 className="section-title">Featured Transmissions</h2>
        {loading && (
          <div className="loading-message">
            <p>Initializing game streams...</p>
            <div className="pulsing-loader"></div>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && featuredGames.length > 0 && (
          <div className="games-grid">
            {featuredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
        {!loading && !error && featuredGames.length === 0 && (
          <p className="info-message">No featured games available at the moment. Check back soon!</p>
        )}
      </section>

      <section className="home-about-section">
        <h2 className="section-title">Beyond the Code</h2>
        <p>
          Cyberpunk Arcade is your portal to a myriad of digital dimensions. We've handpicked experiences that are not just games, but echoes from alternate realities. Quick to load, instantly playable – no installations, just pure, unadulterated gameplay.
        </p>
        <p>
          Powered by bleeding-edge (simulated) cybernetics and a passion for the unique. 
        </p>
      </section>
    </div>
  );
};

export default HomePage;
