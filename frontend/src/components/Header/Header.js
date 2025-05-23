import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

// You can replace this with an actual SVG logo or an <img> tag if you have a graphical logo
const Logo = () => (
  <Link to="/" className="header-logo flicker-text">
    CYBERPUNK ARCADE
  </Link>
);

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <Logo />
        <nav className="header-nav">
          <ul>
            <li>
              <NavLink 
                to="/"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/games"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Games
              </NavLink>
            </li>
            {/* Add more navigation links here if needed */}
            {/* Example: 
            <li>
              <NavLink 
                to="/leaderboards"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Leaderboards
              </NavLink>
            </li> 
            */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
