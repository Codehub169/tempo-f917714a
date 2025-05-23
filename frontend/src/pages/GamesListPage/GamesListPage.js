import React, { useState, useEffect } from 'react';
import GameCard from '../../components/GameCard/GameCard';
import { getAllGames } from '../../services/gameService'; 
import './GamesListPage.css';

const GamesListPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [searchTerm, setSearchTerm] = useState(''); // Future: for search functionality
  // const [filteredGames, setFilteredGames] = useState([]); // Future: for search/filter results

  useEffect(() => {
    const fetchAllGames = async () => {
      try {
        setLoading(true);
        const allGames = await getAllGames();
        setGames(allGames);
        // setFilteredGames(allGames); // Future: initialize filtered games
        setError(null);
      } catch (err) {
        console.error("Error fetching all games:", err);
        setError('Failed to connect to the Game Network. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllGames();
  }, []);

  // Future: Handler for search input change
  // const handleSearchChange = (event) => {
  //   setSearchTerm(event.target.value);
  //   const lowercasedFilter = event.target.value.toLowerCase();
  //   const filteredData = games.filter(item => 
  //     item.title.toLowerCase().includes(lowercasedFilter) || 
  //     (item.genre && item.genre.toLowerCase().includes(lowercasedFilter)) // Check if genre exists
  //   );
  //   setFilteredGames(filteredData);
  // };

  // const gamesToDisplay = searchTerm ? filteredGames : games;
  const gamesToDisplay = games; // Using all games for now

  return (
    <div className="games-list-page">
      <header className="games-list-header">
        <h1 className="page-title flicker-text">Cybernetic Game Arsenal</h1>
        <p className="page-subtitle">
          Browse the complete catalog of simulations. New entries synced regularly from the depths of the net.
        </p>
        {/* Future: Search Bar */}
        {/* <div className="search-bar-container"> 
          <input 
            type="text" 
            placeholder="Search by title or genre..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
            className="search-input"
          />
          <span className="search-icon-placeholder"></span> {/* Using a FontAwesome-like placeholder for search icon */}
        {/* </div> */}
      </header>

      {loading && (
        <div className="loading-container">
          <div className="cyber-loader"></div>
          <p className="loading-text">Accessing Game Databanks...</p>
        </div>
      )}
      {error && <p className="error-message full-page-error">{error}</p>}
      
      {!loading && !error && gamesToDisplay.length > 0 && (
        <div className="games-grid-container">
          {gamesToDisplay.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {!loading && !error && gamesToDisplay.length === 0 && (
        <div className="no-games-found">
          <p>{/*searchTerm ? 'No games match your search criteria.' :*/ 'No games found in the current sector. Recalibrating sensors...'}</p>
          <span className="no-games-icon">⚠️</span> {/* Using a warning icon as placeholder */}
        </div>
      )}
    </div>
  );
};

export default GamesListPage;
