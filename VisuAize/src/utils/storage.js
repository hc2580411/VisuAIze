/**
 * Local storage utility for persisting user preferences.
 * Provides type-safe access to localStorage with fallback handling.
 */

const STORAGE_PREFIX = 'visuaize_';

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
    THEME: 'theme',
    MODE: 'mode',
    BACKGROUND: 'background',
    ANIMATIONS_ENABLED: 'animationsEnabled',
    TOUR_COMPLETED: 'tourCompleted',
};

/**
 * Safely get a value from localStorage
 * @param {string} key - Storage key (without prefix)
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Stored value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
    try {
        const fullKey = `${STORAGE_PREFIX}${key}`;
        const item = localStorage.getItem(fullKey);

        if (item === null) {
            return defaultValue;
        }

        // Try to parse as JSON, fallback to raw string
        try {
            return JSON.parse(item);
        } catch {
            return item;
        }
    } catch (error) {
        // localStorage might be unavailable (private browsing, etc.)
        console.warn(`Failed to read from localStorage: ${key}`, error);
        return defaultValue;
    }
};

/**
 * Safely set a value in localStorage
 * @param {string} key - Storage key (without prefix)
 * @param {any} value - Value to store
 * @returns {boolean} True if successful
 */
export const setStorageItem = (key, value) => {
    try {
        const fullKey = `${STORAGE_PREFIX}${key}`;
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(fullKey, serialized);
        return true;
    } catch (error) {
        console.warn(`Failed to write to localStorage: ${key}`, error);
        return false;
    }
};


