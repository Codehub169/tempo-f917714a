import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css'; // Main application styles, global font imports

// Layout Components
import Header from './components/Header/Header';

// Page Components (Lazy Loaded)
const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const GamesListPage = lazy(() => import('./pages/GamesListPage/GamesListPage'));
const GamePage = lazy(() => import('./pages/GamePage/GamePage'));

// Fallback loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 80px)', // Adjust based on header height
    color: 'var(--primary-accent, #00FFFF)',
    fontSize: '2rem',
    fontFamily: 'Orbitron, sans-serif'
  }}>
    Initializing Cyber-Interface...
  </div>
);

function App() {
  return (
    <div className="App">
      <Header />
      <main className="app-content">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GamesListPage />} />
            <Route path="/games/:gameId" element={<GamePage />} />
            {/* Redirect any unknown paths to home or a 404 component */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {/* Footer could go here if needed */}
    </div>
  );
}

export default App;
