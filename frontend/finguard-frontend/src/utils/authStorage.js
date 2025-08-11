// Secure authentication token storage utility
// This module provides a secure way to handle authentication tokens

const AUTH_CONFIG = {
  // Cookie names
  COOKIE_NAMES: {
    TOKEN: 'finguard_auth_token',
    REFRESH: 'finguard_refresh_token',
    USER_ID: 'finguard_user_id'
  },
  
  // Cookie settings
  COOKIE_OPTIONS: {
    // Secure cookies in production, allow non-secure in development
    secure: process.env.NODE_ENV === 'production',
    // HttpOnly prevents JavaScript access (more secure)
    httpOnly: false, // Must be false for frontend access
    // SameSite prevents CSRF attacks
    sameSite: 'strict',
    // Expire in 24 hours
    maxAge: 24 * 60 * 60 * 1000,
    // Cookie path
    path: '/'
  },
  
  // Fallback to localStorage in development or if cookies fail
  USE_FALLBACK: process.env.NODE_ENV === 'development'
};

// Helper function to set a cookie
const setCookie = (name, value, options = {}) => {
  try {
    const cookieOptions = { ...AUTH_CONFIG.COOKIE_OPTIONS, ...options };
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (cookieOptions.maxAge) {
      const expires = new Date(Date.now() + cookieOptions.maxAge);
      cookieString += `; expires=${expires.toUTCString()}`;
    }
    
    if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
    if (cookieOptions.secure) cookieString += `; secure`;
    if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;
    
    document.cookie = cookieString;
    return true;
  } catch (error) {
    console.error('Failed to set cookie:', error);
    return false;
  }
};

// Helper function to get a cookie
const getCookie = (name) => {
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const targetCookie = cookies.find(cookie => cookie.startsWith(`${name}=`));
    
    if (targetCookie) {
      return decodeURIComponent(targetCookie.split('=')[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get cookie:', error);
    return null;
  }
};

// Helper function to delete a cookie
const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    return true;
  } catch (error) {
    console.error('Failed to delete cookie:', error);
    return false;
  }
};

// Authentication storage class
class AuthStorage {
  constructor() {
    this.preferCookies = !AUTH_CONFIG.USE_FALLBACK;
  }

  // Set authentication token
  setToken(token, refreshToken = null) {
    let success = false;
    
    if (this.preferCookies) {
      // Try to set secure cookies first
      success = setCookie(AUTH_CONFIG.COOKIE_NAMES.TOKEN, token);
      
      if (refreshToken) {
        setCookie(AUTH_CONFIG.COOKIE_NAMES.REFRESH, refreshToken, {
          // Refresh token should have longer expiry
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
    }
    
    // Fallback to localStorage if cookies fail or in development
    if (!success || AUTH_CONFIG.USE_FALLBACK) {
      try {
        localStorage.setItem('finguard-token', token);
        if (refreshToken) {
          localStorage.setItem('finguard-refresh-token', refreshToken);
        }
        success = true;
      } catch (error) {
        console.error('Failed to store token in localStorage:', error);
      }
    }
    
    if (success) {
      console.log('🔐 Authentication token stored securely');
    }
    
    return success;
  }

  // Get authentication token
  getToken() {
    let token = null;
    
    if (this.preferCookies) {
      token = getCookie(AUTH_CONFIG.COOKIE_NAMES.TOKEN);
    }
    
    // Fallback to localStorage
    if (!token) {
      try {
        token = localStorage.getItem('finguard-token');
      } catch (error) {
        console.error('Failed to get token from localStorage:', error);
      }
    }
    
    return token;
  }

  // Get refresh token
  getRefreshToken() {
    let refreshToken = null;
    
    if (this.preferCookies) {
      refreshToken = getCookie(AUTH_CONFIG.COOKIE_NAMES.REFRESH);
    }
    
    // Fallback to localStorage
    if (!refreshToken) {
      try {
        refreshToken = localStorage.getItem('finguard-refresh-token');
      } catch (error) {
        console.error('Failed to get refresh token from localStorage:', error);
      }
    }
    
    return refreshToken;
  }

  // Set user identifier for theme persistence
  setUserIdentifier(userId) {
    let success = false;
    
    if (this.preferCookies) {
      success = setCookie(AUTH_CONFIG.COOKIE_NAMES.USER_ID, userId);
    }
    
    if (!success || AUTH_CONFIG.USE_FALLBACK) {
      try {
        localStorage.setItem('finguard-user', userId);
        success = true;
      } catch (error) {
        console.error('Failed to store user identifier:', error);
      }
    }
    
    return success;
  }

  // Get user identifier
  getUserIdentifier() {
    let userId = null;
    
    if (this.preferCookies) {
      userId = getCookie(AUTH_CONFIG.COOKIE_NAMES.USER_ID);
    }
    
    // Fallback to localStorage
    if (!userId) {
      try {
        userId = localStorage.getItem('finguard-user');
      } catch (error) {
        console.error('Failed to get user identifier:', error);
      }
    }
    
    return userId;
  }

  // Clear all authentication data
  clearAuth() {
    let success = true;
    
    // Clear cookies
    if (this.preferCookies) {
      success &= deleteCookie(AUTH_CONFIG.COOKIE_NAMES.TOKEN);
      success &= deleteCookie(AUTH_CONFIG.COOKIE_NAMES.REFRESH);
      success &= deleteCookie(AUTH_CONFIG.COOKIE_NAMES.USER_ID);
    }
    
    // Clear localStorage (both as fallback and for migration)
    try {
      localStorage.removeItem('finguard-token');
      localStorage.removeItem('finguard-refresh-token');
      localStorage.removeItem('finguard-user');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      success = false;
    }
    
    if (success) {
      console.log('🔓 Authentication data cleared');
    }
    
    return success;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Get authentication headers for API requests
  getAuthHeaders(additionalHeaders = {}) {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...additionalHeaders
    };
  }

  // Get authentication headers with automatic token refresh
  async getValidAuthHeaders(additionalHeaders = {}) {
    try {
      // Import dynamically to avoid circular dependencies
      const tokenRefreshService = (await import('../services/tokenRefreshService')).default;
      const validToken = await tokenRefreshService.getValidToken();
      
      return {
        'Content-Type': 'application/json',
        ...(validToken && { 'Authorization': `Bearer ${validToken}` }),
        ...additionalHeaders
      };
    } catch (error) {
      console.error('Failed to get valid auth headers:', error);
      // Fallback to current token without refresh
      return this.getAuthHeaders(additionalHeaders);
    }
  }

  // Migrate from localStorage to secure cookies (if needed)
  migrateToSecureStorage() {
    if (this.preferCookies) {
      try {
        const token = localStorage.getItem('finguard-token');
        const refreshToken = localStorage.getItem('finguard-refresh-token');
        const userId = localStorage.getItem('finguard-user');
        
        if (token) {
          this.setToken(token, refreshToken);
          this.setUserIdentifier(userId);
          
          // Clear old localStorage entries after successful migration
          localStorage.removeItem('finguard-token');
          localStorage.removeItem('finguard-refresh-token');
          localStorage.removeItem('finguard-user');
          
          console.log('🔄 Successfully migrated to secure storage');
        }
      } catch (error) {
        console.error('Migration to secure storage failed:', error);
      }
    }
  }
}

// Create singleton instance
const authStorage = new AuthStorage();

// Auto-migrate on first load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      authStorage.migrateToSecureStorage();
    });
  } else {
    authStorage.migrateToSecureStorage();
  }
}

export default authStorage;