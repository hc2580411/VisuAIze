/**
 * Centralized configuration for frontend API access.
 * Uses Vite environment variables with sensible defaults for development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
