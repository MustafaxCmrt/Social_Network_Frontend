/**
 * Application Configuration
 */

// The backend API URL. 
// Uses the VITE_API_URL environment variable if available, otherwise defaults to localhost:3000.
// You can change this in the .env file.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
