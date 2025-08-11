// Session Management Service for Auto-logout and Security
class SessionManagementService {
  constructor() {
    this.isInitialized = false;
    this.sessionTimeoutId = null;
    this.warningTimeoutId = null;
    this.activityListeners = [];
    this.eventListeners = new Map();
    
    // Configuration (in milliseconds)
    this.config = {
      // Auto-logout after 30 minutes of inactivity
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      
      // Show warning 5 minutes before logout
      warningTime: 5 * 60 * 1000, // 5 minutes
      
      // Activities that reset the timer
      activityEvents: [
        'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
      ],
      
      // Check if token is close to expiry (5 minutes buffer)
      tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes
      
      // Heartbeat interval to check session validity
      heartbeatInterval: 5 * 60 * 1000, // 5 minutes
    };

    this.sessionData = {
      startTime: null,
      lastActivity: null,
      isActive: false,
      warningShown: false,
      heartbeatInterval: null
    };

    // Load settings from localStorage
    this.loadSessionSettings();
  }

  // Load session settings
  loadSessionSettings() {
    try {
      const saved = localStorage.getItem('finguard-session-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.config = { ...this.config, ...settings };
      }
    } catch (error) {
      console.error('Error loading session settings:', error);
    }
  }

  // Save session settings
  saveSessionSettings(settings) {
    try {
      this.config = { ...this.config, ...settings };
      localStorage.setItem('finguard-session-settings', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving session settings:', error);
    }
  }

  // Initialize session management
  initialize() {
    if (this.isInitialized) return;

    console.log('🔒 Initializing Session Management Service...');

    // Check if user is already logged in
    const token = localStorage.getItem('finguard-token');
    if (token) {
      this.startSession();
    }

    // Listen for login/logout events
    this.setupAuthListeners();

    // Set up heartbeat to validate session
    this.startHeartbeat();

    this.isInitialized = true;
    console.log('✅ Session Management Service initialized');
  }

  // Start user session
  startSession() {
    console.log('🟢 Starting user session...');
    
    this.sessionData = {
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      warningShown: false
    };

    // Set up activity listeners
    this.setupActivityListeners();

    // Start session timeout
    this.resetSessionTimeout();

    // Emit session started event
    this.emit('session-started', this.sessionData);

    // Save session info
    this.saveSessionInfo();
  }

  // End user session
  endSession(reason = 'logout') {
    console.log(`🔴 Ending session: ${reason}`);
    
    // Clear timeouts
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
    
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }

    // Remove activity listeners
    this.removeActivityListeners();

    // Update session data
    this.sessionData.isActive = false;
    this.sessionData.endTime = new Date();
    this.sessionData.endReason = reason;

    // Emit session ended event
    this.emit('session-ended', { reason, ...this.sessionData });

    // Clear session info
    this.clearSessionInfo();

    // If auto-logout, redirect to login
    if (reason === 'timeout' || reason === 'token-expired') {
      this.performLogout(reason);
    }
  }

  // Set up activity listeners
  setupActivityListeners() {
    this.config.activityEvents.forEach(event => {
      const listener = this.handleUserActivity.bind(this);
      document.addEventListener(event, listener, true);
      this.activityListeners.push({ event, listener });
    });
  }

  // Remove activity listeners
  removeActivityListeners() {
    this.activityListeners.forEach(({ event, listener }) => {
      document.removeEventListener(event, listener, true);
    });
    this.activityListeners = [];
  }

  // Handle user activity
  handleUserActivity() {
    if (!this.sessionData.isActive) return;

    const now = new Date();
    this.sessionData.lastActivity = now;

    // Reset session timeout
    this.resetSessionTimeout();

    // Hide warning if shown
    if (this.sessionData.warningShown) {
      this.hideSessionWarning();
      this.sessionData.warningShown = false;
    }

    // Save activity
    this.saveSessionInfo();

    // Emit activity event
    this.emit('user-activity', { timestamp: now });
  }

  // Reset session timeout
  resetSessionTimeout() {
    // Clear existing timeouts
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    // Set warning timeout (show warning before auto-logout)
    this.warningTimeoutId = setTimeout(() => {
      this.showSessionWarning();
    }, this.config.sessionTimeout - this.config.warningTime);

    // Set session timeout
    this.sessionTimeoutId = setTimeout(() => {
      this.endSession('timeout');
    }, this.config.sessionTimeout);
  }

  // Show session warning
  showSessionWarning() {
    if (this.sessionData.warningShown) return;

    this.sessionData.warningShown = true;
    const timeLeft = Math.ceil(this.config.warningTime / 1000 / 60); // minutes

    // Create warning modal
    const warningModal = document.createElement('div');
    warningModal.id = 'session-warning-modal';
    warningModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    warningModal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
        <div class="text-center">
          <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Session Expiring Soon</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Your session will expire in <span id="countdown-timer" class="font-bold text-yellow-600">${timeLeft}</span> minutes due to inactivity.
          </p>
          <div class="flex space-x-3">
            <button id="extend-session-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Stay Logged In
            </button>
            <button id="logout-now-btn" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
              Logout Now
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(warningModal);

    // Set up button handlers
    document.getElementById('extend-session-btn').onclick = () => {
      this.extendSession();
      this.hideSessionWarning();
    };

    document.getElementById('logout-now-btn').onclick = () => {
      this.endSession('manual-logout');
    };

    // Start countdown timer
    this.startCountdown(timeLeft);

    // Emit warning event
    this.emit('session-warning', { timeLeft });
  }

  // Start countdown timer in warning modal
  startCountdown(minutes) {
    const countdownElement = document.getElementById('countdown-timer');
    if (!countdownElement) return;

    let timeLeft = minutes * 60; // convert to seconds

    const updateCountdown = () => {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      countdownElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      
      timeLeft--;
      
      if (timeLeft < 0) {
        clearInterval(countdownInterval);
      }
    };

    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Update immediately

    // Store interval ID for cleanup
    this.countdownInterval = countdownInterval;
  }

  // Hide session warning
  hideSessionWarning() {
    const warningModal = document.getElementById('session-warning-modal');
    if (warningModal) {
      warningModal.remove();
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.sessionData.warningShown = false;
  }

  // Extend session
  extendSession() {
    console.log('⏰ Session extended by user');
    this.handleUserActivity();
    this.emit('session-extended', { timestamp: new Date() });
  }

  // Perform logout
  performLogout(reason) {
    console.log(`🚪 Performing logout: ${reason}`);
    
    // Clear token
    localStorage.removeItem('finguard-token');
    
    // Clear other session data
    localStorage.removeItem('finguard-session-info');
    
    // Show logout notification
    this.showLogoutNotification(reason);
    
    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  // Show logout notification
  showLogoutNotification(reason) {
    const messages = {
      'timeout': 'You have been logged out due to inactivity.',
      'token-expired': 'Your session has expired. Please log in again.',
      'manual-logout': 'You have been logged out successfully.',
      'security': 'You have been logged out for security reasons.'
    };

    const message = messages[reason] || 'You have been logged out.';

    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <div>
          <p class="font-medium">Session Ended</p>
          <p class="text-sm opacity-90">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove notification
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 5000);
  }

  // Set up authentication listeners
  setupAuthListeners() {
    // Listen for login events
    window.addEventListener('finguard-login', () => {
      this.startSession();
    });

    // Listen for logout events
    window.addEventListener('finguard-logout', () => {
      this.endSession('manual-logout');
    });

    // Listen for token refresh events
    window.addEventListener('finguard-token-refreshed', () => {
      // Reset session timeout on token refresh
      if (this.sessionData.isActive) {
        this.resetSessionTimeout();
      }
    });
  }

  // Start heartbeat to validate session
  startHeartbeat() {
    // Clear existing heartbeat
    this.stopHeartbeat();
    
    this.sessionData.heartbeatInterval = setInterval(() => {
      this.validateSession();
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.sessionData.heartbeatInterval) {
      clearInterval(this.sessionData.heartbeatInterval);
      this.sessionData.heartbeatInterval = null;
    }
  }

  // Validate current session
  async validateSession() {
    if (!this.sessionData.isActive) return;

    const token = localStorage.getItem('finguard-token');
    if (!token) {
      this.endSession('token-missing');
      return;
    }

    try {
      // Check token expiry
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const timeToExpiry = (tokenData.exp - now) * 1000;

      if (timeToExpiry <= 0) {
        this.endSession('token-expired');
        return;
      }

      // Show warning if token expires soon
      if (timeToExpiry <= this.config.tokenExpiryBuffer) {
        this.showTokenExpiryWarning(Math.ceil(timeToExpiry / 1000 / 60));
      }

      // Optional: Validate with server
      // await this.validateTokenWithServer(token);

      console.log(`💓 Session heartbeat: ${Math.ceil(timeToExpiry / 1000 / 60)} minutes until token expiry`);
    } catch (error) {
      console.error('Session validation error:', error);
      this.endSession('validation-error');
    }
  }

  // Show token expiry warning
  showTokenExpiryWarning(minutesLeft) {
    // Only show once per session
    if (this.tokenWarningShown) return;
    this.tokenWarningShown = true;

    console.warn(`⚠️ Token expires in ${minutesLeft} minutes`);
    
    // Could trigger token refresh here
    this.emit('token-expiring', { minutesLeft });
  }

  // Save session info to localStorage
  saveSessionInfo() {
    try {
      const sessionInfo = {
        startTime: this.sessionData.startTime,
        lastActivity: this.sessionData.lastActivity,
        isActive: this.sessionData.isActive
      };
      localStorage.setItem('finguard-session-info', JSON.stringify(sessionInfo));
    } catch (error) {
      console.error('Error saving session info:', error);
    }
  }

  // Clear session info
  clearSessionInfo() {
    localStorage.removeItem('finguard-session-info');
  }

  // Get session statistics
  getSessionStats() {
    if (!this.sessionData.isActive) {
      return { isActive: false };
    }

    const now = new Date();
    const sessionDuration = now - this.sessionData.startTime;
    const timeSinceActivity = now - this.sessionData.lastActivity;
    const timeUntilWarning = Math.max(0, this.config.sessionTimeout - this.config.warningTime - timeSinceActivity);
    const timeUntilLogout = Math.max(0, this.config.sessionTimeout - timeSinceActivity);

    return {
      isActive: true,
      startTime: this.sessionData.startTime,
      lastActivity: this.sessionData.lastActivity,
      sessionDuration: Math.floor(sessionDuration / 1000 / 60), // minutes
      timeSinceActivity: Math.floor(timeSinceActivity / 1000 / 60), // minutes
      timeUntilWarning: Math.floor(timeUntilWarning / 1000 / 60), // minutes
      timeUntilLogout: Math.floor(timeUntilLogout / 1000 / 60) // minutes
    };
  }

  // Update session settings
  updateSettings(newSettings) {
    const oldConfig = { ...this.config };
    this.saveSessionSettings(newSettings);
    
    // If timeout changed and session is active, reset timer
    if (this.sessionData.isActive && oldConfig.sessionTimeout !== this.config.sessionTimeout) {
      this.resetSessionTimeout();
    }

    this.emit('settings-updated', { oldConfig, newConfig: this.config });
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Cleanup method for proper shutdown
  destroy() {
    // Clear all timeouts
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
    
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Remove activity listeners
    this.activityListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler, { passive: true });
    });
    this.activityListeners = [];

    // Clear event listeners
    this.eventListeners.clear();

    // Clear session info
    this.clearSessionInfo();

    // Mark as inactive
    this.sessionData.isActive = false;
    this.isInitialized = false;
  }

  // Cleanup on app unload
  cleanup() {
    if (this.sessionTimeoutId) clearTimeout(this.sessionTimeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
    if (this.sessionData.heartbeatInterval) clearInterval(this.sessionData.heartbeatInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    
    this.removeActivityListeners();
    this.hideSessionWarning();
  }
}

// Create and export singleton instance
const sessionManagementService = new SessionManagementService();

// Initialize on page load
if (typeof window !== 'undefined') {
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    sessionManagementService.cleanup();
  });
}

export default sessionManagementService;