// Token refresh service for maintaining authentication sessions
import authStorage from '../utils/authStorage';
import { buildApiUrl, getApiConfig } from '../config/api';

class TokenRefreshService {
  constructor() {
    this.refreshPromise = null;
    this.refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry
    this.maxRetries = 3;
    this.isRefreshing = false;
  }

  // Initialize the service
  initialize() {
    this.scheduleNextRefresh();
    
    // Listen for window focus to check token status
    window.addEventListener('focus', () => {
      this.checkTokenStatus();
    });
    
    // Listen for storage events (token changes in other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'finguard_auth_token' || e.key === 'finguard-token') {
        this.scheduleNextRefresh();
      }
    });
  }

  // Decode JWT token to get expiration
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  // Check if token needs refresh
  shouldRefreshToken() {
    const token = authStorage.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    const currentTime = Date.now();
    const expirationTime = decoded.exp * 1000;
    const timeUntilExpiry = expirationTime - currentTime;

    return timeUntilExpiry <= this.refreshThreshold && timeUntilExpiry > 0;
  }

  // Check if token is expired
  isTokenExpired() {
    const token = authStorage.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now();
    const expirationTime = decoded.exp * 1000;

    return currentTime >= expirationTime;
  }

  // Get time until token expires
  getTimeUntilExpiry() {
    const token = authStorage.getToken();
    if (!token) return 0;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    const currentTime = Date.now();
    const expirationTime = decoded.exp * 1000;

    return Math.max(0, expirationTime - currentTime);
  }

  // Refresh the authentication token
  async refreshToken() {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      console.log('No refresh token available');
      this.handleRefreshFailure();
      return null;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  // Perform the actual token refresh
  async performRefresh(refreshToken) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting token refresh (attempt ${attempt}/${this.maxRetries})`);

        const response = await fetch(buildApiUrl('/api/auth/refresh-token'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.token) {
          throw new Error('No token received in refresh response');
        }

        // Store new tokens
        authStorage.setToken(data.token, data.refreshToken);
        
        console.log('✅ Token refreshed successfully');
        
        // Schedule next refresh
        this.scheduleNextRefresh();
        
        // Notify other parts of the app
        window.dispatchEvent(new CustomEvent('finguard-token-refreshed', {
          detail: { token: data.token }
        }));
        
        return data.token;

      } catch (error) {
        console.warn(`Token refresh attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          console.error('All token refresh attempts failed');
          this.handleRefreshFailure();
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  // Handle refresh failure
  handleRefreshFailure() {
    console.log('🔓 Token refresh failed, logging out user');
    
    // Clear authentication data
    authStorage.clearAuth();
    
    // Notify app of session expiry
    window.dispatchEvent(new Event('finguard-session-expired'));
    
    // Clear any scheduled refresh
    this.clearRefreshTimeout();
  }

  // Schedule the next token refresh
  scheduleNextRefresh() {
    this.clearRefreshTimeout();

    const token = authStorage.getToken();
    if (!token) return;

    const timeUntilRefresh = this.getTimeUntilExpiry() - this.refreshThreshold;
    
    if (timeUntilRefresh <= 0) {
      // Token needs immediate refresh
      if (this.shouldRefreshToken()) {
        this.refreshToken().catch(() => {
          // Error already handled in refreshToken
        });
      }
      return;
    }

    // Schedule refresh
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken().catch(() => {
        // Error already handled in refreshToken
      });
    }, timeUntilRefresh);

    const refreshDate = new Date(Date.now() + timeUntilRefresh);
    console.log(`⏰ Next token refresh scheduled for: ${refreshDate.toLocaleString()}`);
  }

  // Clear refresh timeout
  clearRefreshTimeout() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  // Check token status and refresh if needed
  async checkTokenStatus() {
    if (this.isTokenExpired()) {
      this.handleRefreshFailure();
      return false;
    }

    if (this.shouldRefreshToken()) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  // Get token with automatic refresh
  async getValidToken() {
    if (this.isTokenExpired()) {
      throw new Error('Token is expired and cannot be refreshed');
    }

    if (this.shouldRefreshToken()) {
      await this.refreshToken();
    }

    return authStorage.getToken();
  }

  // Helper method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup method
  destroy() {
    this.clearRefreshTimeout();
    window.removeEventListener('focus', this.checkTokenStatus);
  }
}

// Create singleton instance
const tokenRefreshService = new TokenRefreshService();

export default tokenRefreshService;