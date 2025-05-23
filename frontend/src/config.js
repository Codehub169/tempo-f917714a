// Configuration for the Cyberpunk Arcade Dashboard frontend

/**
 * The base URL for the backend API.
 * Uses a relative path assuming frontend is served from the same origin as the API.
 * This is suitable when Flask serves both the frontend and the API.
 * Can be overridden by REACT_APP_API_BASE_URL environment variable during build.
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

/**
 * Default number of items per page for pagination (if implemented).
 */
export const DEFAULT_ITEMS_PER_PAGE = 12;

/**
 * Site title, can be used in document head or components.
 */
export const SITE_TITLE = 'Cyberpunk Arcade';

/**
 * Path to the default game thumbnail if a specific one is not available.
 * This path is relative to the domain root, served by Flask.
 * Assumes the image is in `frontend/public/assets/images/`.
 */
export const DEFAULT_GAME_THUMBNAIL = '/assets/images/game_thumb_default.png';

// Add other global configurations here as needed
// For example, feature flags, UI settings, etc.
