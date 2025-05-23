// Configuration for the Cyberpunk Arcade Dashboard frontend

/**
 * The base URL for the backend API.
 * Ensure this matches the port your Flask backend is running on.
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

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
 */
export const DEFAULT_GAME_THUMBNAIL = '/assets/images/game_thumb_default.png';

// Add other global configurations here as needed
// For example, feature flags, UI settings, etc.
