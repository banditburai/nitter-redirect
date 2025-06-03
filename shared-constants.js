"use strict";

/**
 * Shared constants and utilities for Nitter Redirect extension
 * This module provides consistent validation and configuration across all extension components
 */

/**
 * Default Nitter instance URL
 * @type {string}
 */
const NITTER_DEFAULT = "https://xcancel.com";

/**
 * Strict validation pattern for Nitter instances
 * Ensures HTTPS URLs with valid domain format
 * @type {RegExp}
 */
const VALID_NITTER_PATTERN = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Verified working Nitter instances from official sources
 * These domains are validated for security and functionality
 * Updated: 2025 - Based on official Nitter wiki and community reports
 * @type {string[]}
 */
const KNOWN_NITTER_DOMAINS = [
  "xcancel.com",
  "nitter.poast.org", 
  "nitter.privacyredirect.com",
  "lightbrd.com",
  "nitter.space",
  "nitter.tiekoetter.com"
];

/**
 * Cross-browser compatibility wrapper
 * @type {object}
 */
const browser = (typeof chrome !== 'undefined') ? chrome : window.browser;

/**
 * Validates if a URL is a valid and trusted Nitter instance
 * Performs comprehensive security validation including:
 * - HTTPS protocol enforcement
 * - Domain pattern validation
 * - Trusted domain whitelist verification
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is a valid Nitter instance
 */
function isValidNitterInstance(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Enforce HTTPS for security
    if (urlObj.protocol !== "https:") {
      return false;
    }
    
    // Validate URL format
    if (!VALID_NITTER_PATTERN.test(url)) {
      return false;
    }
    
    // Verify against trusted domain whitelist for security
    const hostname = urlObj.hostname;
    return KNOWN_NITTER_DOMAINS.includes(hostname);
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * Prevents XSS and other injection attacks
 * 
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input.replace(/[<>'"&]/g, '');
}

/**
 * Creates a debounced function that delays execution until after wait milliseconds
 * have elapsed since the last time it was invoked
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @param {boolean} immediate - Whether to execute immediately on first call
 * @returns {Function} The debounced function
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Logs messages with consistent formatting for debugging
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - The message to log
 * @param {...any} args - Additional arguments to log
 */
function log(level, message, ...args) {
  const prefix = "[Nitter Redirect]";
  const logMethod = console[level] || console.log;
  logMethod(`${prefix} ${message}`, ...args);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NITTER_DEFAULT,
    VALID_NITTER_PATTERN,
    KNOWN_NITTER_DOMAINS,
    browser,
    isValidNitterInstance,
    sanitizeInput,
    debounce,
    log
  };
} else {
  // For browser environment
  window.NitterShared = {
    NITTER_DEFAULT,
    VALID_NITTER_PATTERN,
    KNOWN_NITTER_DOMAINS,
    browser,
    isValidNitterInstance,
    sanitizeInput,
    debounce,
    log
  };
}