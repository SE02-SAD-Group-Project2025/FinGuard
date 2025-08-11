// API Configuration
// This file centralizes all API endpoints and configurations

const API_CONFIG = {
  // Base URL for the API - can be overridden by environment variables
  BASE_URL: process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      COMPLETE_2FA_LOGIN: '/api/auth/complete-2fa-login',
      SETUP_2FA: '/api/auth/setup-2fa',
      VERIFY_2FA: '/api/auth/verify-2fa',
      DISABLE_2FA: '/api/auth/disable-2fa',
      REFRESH_TOKEN: '/api/auth/refresh-token',
      LOGOUT: '/api/auth/logout'
    },
    USER: {
      PROFILE: '/api/user/profile',
      PREFERENCES: '/api/user/preferences',
      UPDATE_PROFILE: '/api/user/update-profile',
      UPLOAD_PHOTO: '/api/user/upload-photo'
    },
    TRANSACTIONS: {
      BASE: '/api/transactions',
      EXPENSES: '/api/transactions/expenses',
      INCOMES: '/api/transactions/incomes'
    },
    BUDGET: {
      BASE: '/api/budgets',
      APPLY_AI_RECOMMENDATIONS: '/api/budgets/apply-ai-recommendations'
    },
    FAMILY: {
      BASE: '/api/family',
      ACCEPT_INVITATION: '/api/family/accept-invitation',
      DECLINE_INVITATION: '/api/family/decline-invitation',
      FINANCIAL_SUMMARY: '/api/family/financial-summary',
      CATEGORIES: '/api/family/categories',
      SAVINGS_GOALS: '/api/family/savings-goals',
      ALLOWANCES: '/api/family/allowances'
    },
    LIABILITIES: {
      BASE: '/api/liabilities',
      SUMMARY: '/api/liabilities/summary'
    },
    GOALS: {
      BASE: '/api/goals',
      ACHIEVEMENTS: '/api/goals/achievements'
    },
    BILLS: {
      BASE: '/api/bills',
      UPCOMING: '/api/bills/upcoming'
    },
    SUMMARY: '/api/summary',
    SUBSCRIPTION: '/api/subscription'
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json'
  }
};

// Helper function to build complete URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get API configuration
export const getApiConfig = () => API_CONFIG;

// Helper function to get authorization headers
export const getAuthHeaders = (additionalHeaders = {}) => {
  // Import authStorage dynamically to avoid circular dependencies
  const authStorage = require('../utils/authStorage').default;
  const token = authStorage.getToken();
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...additionalHeaders
  };
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Start with 1 second
  backoffMultiplier: 2 // Exponential backoff
};

// Helper function to wait/delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error is retryable
const isRetryableError = (error) => {
  // Network errors, timeouts, and 5xx server errors are retryable
  return !navigator.onLine || 
         error.name === 'TypeError' || 
         error.name === 'NetworkError' ||
         (error.status >= 500 && error.status < 600) ||
         error.status === 408 || // Request timeout
         error.status === 429;   // Too many requests
};

// Enhanced API request function with retry logic and offline handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  // Use token refresh for authenticated requests
  let headers;
  if (options.useTokenRefresh !== false) {
    try {
      const authStorage = require('../utils/authStorage').default;
      headers = await authStorage.getValidAuthHeaders(options.headers);
    } catch (error) {
      console.warn('Token refresh failed, using current token:', error);
      headers = getAuthHeaders(options.headers);
    }
  } else {
    headers = getAuthHeaders(options.headers);
  }
  
  const config = {
    timeout: API_CONFIG.TIMEOUT,
    headers,
    ...options
  };

  let lastError;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      return response;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error or if we've exhausted retries
      if (!isRetryableError(error) || attempt === RETRY_CONFIG.maxRetries) {
        console.error(`API request failed for ${endpoint} after ${attempt + 1} attempts:`, error);
        
        // Add offline-specific handling
        if (!navigator.onLine) {
          error.isOffline = true;
          error.userMessage = 'You appear to be offline. Please check your internet connection and try again.';
        } else if (error.status === 401) {
          error.userMessage = 'Your session has expired. Please log in again.';
          // Trigger logout
          window.dispatchEvent(new Event('finguard-session-expired'));
        } else if (error.status >= 500) {
          error.userMessage = 'Server error. Please try again in a few moments.';
        } else {
          error.userMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
        
        throw error;
      }
      
      // Calculate delay for next attempt (exponential backoff)
      const delayMs = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
      console.warn(`API request failed for ${endpoint} (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}). Retrying in ${delayMs}ms...`);
      
      await delay(delayMs);
    }
  }
  
  throw lastError;
};

// Helper function for GET requests with caching
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest(endpoint, { method: 'GET', ...options });
};

// Helper function for POST requests
export const apiPost = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
};

// Helper function for PUT requests
export const apiPut = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });
};

// Helper function for DELETE requests
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest(endpoint, { method: 'DELETE', ...options });
};

export default API_CONFIG;