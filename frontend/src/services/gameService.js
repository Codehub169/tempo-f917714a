import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create an Axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches all games from the backend API.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of game objects.
 * @throws {Error} If the API request fails.
 */
export const getAllGames = async () => {
  try {
    const response = await apiClient.get('/games');
    return response.data;
  } catch (error) {
    console.error('Error fetching all games:', error.response || error.message);
    throw error; // Re-throw to be handled by the calling component
  }
};

/**
 * Fetches a single game by its ID from the backend API.
 * @param {string|number} gameId - The ID of the game to fetch.
 * @returns {Promise<Object>} A promise that resolves to the game object.
 * @throws {Error} If the API request fails or the game is not found.
 */
export const getGameById = async (gameId) => {
  try {
    const response = await apiClient.get(`/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching game with ID ${gameId}:`, error.response || error.message);
    // If the error is a 404, the backend might send a specific message
    if (error.response && error.response.status === 404) {
        throw new Error(error.response.data.error || `Game with ID ${gameId} not found.`);
    }
    throw error; // Re-throw for other errors
  }
};

// Potential future service functions:
// export const searchGames = async (searchTerm) => { ... };
// export const getGamesByGenre = async (genre) => { ... };
