import realTimeService from './realTimeService';

// Smart Notifications Service for FinGuard
class SmartNotificationService {
  constructor() {
    this.notifications = [];
    this.isInitialized = false;
    this.eventListeners = new Map();
    this.notificationSettings = this.loadNotificationSettings();
    this.lastNotificationCheck = new Date();
    
    // Notification types and their priorities
    this.notificationTypes = {
      BUDGET_WARNING: { priority: 'high', icon: '⚠️', color: '#f59e0b' },
      BUDGET_EXCEEDED: { priority: 'critical', icon: '🚨', color: '#ef4444' },
      GOAL_ACHIEVED: { priority: 'celebration', icon: '🎉', color: '#10b981' },
      GOAL_MILESTONE: { priority: 'medium', icon: '🎯', color: '#3b82f6' },
      BILL_DUE: { priority: 'high', icon: '💸', color: '#f59e0b' },
      SAVINGS_STREAK: { priority: 'positive', icon: '💰', color: '#10b981' },
      SPENDING_PATTERN: { priority: 'info', icon: '📊', color: '#8b5cf6' },
      FAMILY_UPDATE: { priority: 'medium', icon: '👨‍👩‍👧‍👦', color: '#06b6d4' },
      ACHIEVEMENT_UNLOCK: { priority: 'celebration', icon: '🏆', color: '#eab308' },
      ANOMALY_DETECTED: { priority: 'medium', icon: '🔍', color: '#f97316' },
      WEEKLY_SUMMARY: { priority: 'low', icon: '📈', color: '#64748b' },
      MONTHLY_REPORT: { priority: 'medium', icon: '📋', color: '#6366f1' }
    };
  }

  // Initialize the notification service
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔔 Initializing Smart Notification Service...');
    
    // Request notification permissions
    await this.requestPermissions();
    
    // Load user's notification history
    await this.loadNotificationHistory();
    
    // Set up periodic checks
    this.setupPeriodicChecks();
    
    // Listen for various app events
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('✅ Smart Notification Service initialized successfully');
    
    // Show welcome notification
    this.scheduleNotification({
      type: 'WEEKLY_SUMMARY',
      title: '🔔 Smart Notifications Active',
      message: 'You\'ll now receive intelligent alerts about your finances!',
      priority: 'info',
      showImmediately: true
    });
  }

  // Request notification permissions
  async requestPermissions() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log(`Notification permission: ${permission}`);
      }
    }
  }

  // Load notification settings from localStorage
  loadNotificationSettings() {
    try {
      const stored = localStorage.getItem('finguard-notification-settings');
      return stored ? JSON.parse(stored) : {
        budgetAlerts: true,
        goalCelebrations: true,
        billReminders: true,
        weeklyDigest: true,
        anomalyDetection: true,
        familyUpdates: true,
        achievementNotifications: true,
        quietHours: { enabled: true, start: '22:00', end: '07:00' }
      };
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return {};
    }
  }

  // Save notification settings
  saveNotificationSettings(settings) {
    try {
      this.notificationSettings = { ...this.notificationSettings, ...settings };
      localStorage.setItem('finguard-notification-settings', JSON.stringify(this.notificationSettings));
      console.log('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Load notification history
  async loadNotificationHistory() {
    try {
      const stored = localStorage.getItem('finguard-notification-history');
      this.notifications = stored ? JSON.parse(stored) : [];
      
      // Clean up old notifications (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      this.notifications = this.notifications.filter(
        notification => new Date(notification.timestamp) > thirtyDaysAgo
      );
      
      this.saveNotificationHistory();
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
  }

  // Save notification history
  saveNotificationHistory() {
    try {
      localStorage.setItem('finguard-notification-history', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }

  // Set up periodic checks for various financial events
  setupPeriodicChecks() {
    // Store interval IDs for cleanup
    this.intervals = this.intervals || [];
    
    // Clear any existing intervals
    this.clearPeriodicChecks();

    // Check every 5 minutes for budget alerts
    this.intervals.push(setInterval(() => {
      realTimeService.checkBudgetAlerts();
    }, 5 * 60 * 1000));

    // Check for bill due dates every hour
    this.intervals.push(setInterval(() => {
      this.checkBillDueDates();
    }, 60 * 60 * 1000));

    // Check for goal achievements every 30 minutes
    this.intervals.push(setInterval(() => {
      this.checkGoalAchievements();
    }, 30 * 60 * 1000));

    // Generate weekly summary on Sundays
    this.intervals.push(setInterval(() => {
      this.checkWeeklySummary();
    }, 24 * 60 * 60 * 1000));
    
    // Check for spending anomalies every 2 hours
    this.intervals.push(setInterval(() => {
      this.checkSpendingAnomalies();
    }, 2 * 60 * 60 * 1000));
  }

  // Clear all periodic checks
  clearPeriodicChecks() {
    if (this.intervals) {
      this.intervals.forEach(intervalId => clearInterval(intervalId));
      this.intervals = [];
    }
  }

  // Remove all event listeners
  removeAllListeners() {
    this.eventListeners.clear();
  }

  // Cleanup method for proper shutdown
  destroy() {
    this.clearPeriodicChecks();
    this.clearAllNotifications();
    this.removeAllListeners();
  }

  // Set up event listeners for app events
  setupEventListeners() {
    // Listen for transaction events
    window.addEventListener('transaction-added', (event) => {
      this.handleTransactionAdded(event.detail);
    });

    // Listen for goal progress updates
    window.addEventListener('goal-progress-updated', (event) => {
      this.handleGoalProgressUpdate(event.detail);
    });

    // Listen for family events
    window.addEventListener('family-member-added', (event) => {
      this.handleFamilyMemberAdded(event.detail);
    });

    // Listen for budget updates
    window.addEventListener('budget-updated', (event) => {
      this.handleBudgetUpdated(event.detail);
    });

    // Listen for achievement unlocks
    window.addEventListener('achievement-unlocked', (event) => {
      this.handleAchievementUnlocked(event.detail);
    });
  }

  // Handle transaction added
  handleTransactionAdded(transactionData) {
    const { amount, category, type, userId } = transactionData;
    
    // Check if this triggers any immediate notifications
    if (type === 'expense') {
      this.checkCategoryBudgetWarning(category, amount, userId);
      this.checkDailySpendingLimit(amount, userId);
    }
    
    // Check for spending patterns
    setTimeout(() => {
      this.analyzeSpendingPattern(transactionData);
    }, 1000);
  }

  // Check for budget warnings when category spending approaches limits
  async checkCategoryBudgetWarning(category, amount, userId) {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Fetch real budget data from API
      const response = await fetch(`http://localhost:5000/api/budgets/summary?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return;

      const budgetData = await response.json();
      const categoryBudget = budgetData.find(item => item.category === category);
      
      if (!categoryBudget) return;

      const currentSpent = categoryBudget.spent || 0;
      const budgetLimit = categoryBudget.budget_limit || 0;
      const newTotal = currentSpent + amount;
      const utilizationPercentage = (newTotal / budgetLimit) * 100;

      if (utilizationPercentage >= 100) {
        this.scheduleNotification({
          type: 'BUDGET_EXCEEDED',
          title: '🚨 Budget Exceeded!',
          message: `You've exceeded your ${category} budget by Rs.${(newTotal - budgetLimit).toLocaleString()}`,
          priority: 'critical',
          category: category,
          actionable: true,
          actions: [
            { label: 'Review Spending', action: 'open-category-details' },
            { label: 'Adjust Budget', action: 'edit-budget' }
          ]
        });
      } else if (utilizationPercentage >= 90) {
        this.scheduleNotification({
          type: 'BUDGET_WARNING',
          title: '⚠️ Budget Warning',
          message: `You've used ${Math.round(utilizationPercentage)}% of your ${category} budget`,
          priority: 'high',
          category: category
        });
      } else if (utilizationPercentage >= 75) {
        this.scheduleNotification({
          type: 'BUDGET_WARNING',
          title: '💰 Budget Update',
          message: `${Math.round(utilizationPercentage)}% of ${category} budget used`,
          priority: 'medium',
          category: category
        });
      }
    } catch (error) {
      console.error('Error checking budget warnings:', error);
    }
  }

  // Check for goal achievements
  async checkGoalAchievements() {
    if (!this.notificationSettings.goalCelebrations) return;

    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/goals/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const goals = response.ok ? await response.json() : [];
      
      goals.forEach(goal => {
        if (goal.justCompleted) {
          this.scheduleNotification({
            type: 'GOAL_ACHIEVED',
            title: '🎉 Goal Achieved!',
            message: `Congratulations! You've completed your ${goal.name} goal!`,
            priority: 'celebration',
            goalId: goal.id,
            celebratory: true,
            actions: [
              { label: 'Set New Goal', action: 'create-goal' },
              { label: 'Share Achievement', action: 'share-goal' }
            ]
          });
        } else if (goal.milestoneHit && (goal.milestoneHit % 25 === 0)) {
          this.scheduleNotification({
            type: 'GOAL_MILESTONE',
            title: '🎯 Milestone Reached!',
            message: `You're ${goal.progress}% of the way to your ${goal.name} goal!`,
            priority: 'medium',
            goalId: goal.id
          });
        }
      });
    } catch (error) {
      console.error('Error checking goal achievements:', error);
    }
  }

  // Check for bill due dates
  async checkBillDueDates() {
    if (!this.notificationSettings.billReminders) return;

    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/bills/upcoming', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const bills = response.ok ? await response.json() : [];
      const today = new Date();
      
      bills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue === 3) {
          this.scheduleNotification({
            type: 'BILL_DUE',
            title: '💸 Bill Reminder',
            message: `${bill.name} (Rs.${bill.amount.toLocaleString()}) is due in 3 days`,
            priority: 'high',
            billId: bill.id,
            actions: [
              { label: 'Pay Now', action: 'pay-bill' },
              { label: 'Set Reminder', action: 'snooze-reminder' }
            ]
          });
        } else if (daysUntilDue === 1) {
          this.scheduleNotification({
            type: 'BILL_DUE',
            title: '🚨 Bill Due Tomorrow!',
            message: `Don't forget: ${bill.name} (Rs.${bill.amount.toLocaleString()}) is due tomorrow`,
            priority: 'critical',
            billId: bill.id,
            actions: [
              { label: 'Pay Now', action: 'pay-bill' }
            ]
          });
        }
      });
    } catch (error) {
      console.error('Error checking bill due dates:', error);
    }
  }

  // Check for spending anomalies
  async checkSpendingAnomalies() {
    if (!this.notificationSettings.anomalyDetection) return;

    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/anomalies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return;

      const anomalies = await response.json();

      anomalies.forEach(anomaly => {
        this.scheduleNotification({
          type: 'ANOMALY_DETECTED',
          title: '🔍 Unusual Spending Detected',
          message: anomaly.description,
          priority: 'medium',
          anomaly: anomaly,
          actions: [
            { label: 'Review Transaction', action: 'review-transaction' },
            { label: 'Mark as Normal', action: 'dismiss-anomaly' }
          ]
        });
      });
    } catch (error) {
      console.error('Error checking spending anomalies:', error);
    }
  }

  // Generate weekly summary
  async checkWeeklySummary() {
    const today = new Date();
    if (today.getDay() === 0 && this.notificationSettings.weeklyDigest) { // Sunday
      
      try {
        const token = localStorage.getItem('finguard-token');
        if (!token) return;

        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Get real weekly summary data
        const summaryResponse = await fetch(`http://localhost:5000/api/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const budgetResponse = await fetch(`http://localhost:5000/api/budgets/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (summaryResponse.ok && budgetResponse.ok) {
          const summaryData = await summaryResponse.json();
          const budgetData = await budgetResponse.json();

          const totalSpent = summaryData.expenses || 0;
          const totalBudget = budgetData.reduce((sum, item) => sum + (item.budget_limit || 0), 0);
          const savedVsBudget = Math.max(totalBudget - totalSpent, 0);
          
          // Find top spending category
          const topCategory = budgetData.reduce((top, current) => 
            (current.spent > (top.spent || 0)) ? current : top, 
            { category: 'General', spent: 0 }
          ).category;

          this.scheduleNotification({
            type: 'WEEKLY_SUMMARY',
            title: '📈 Your Week in Finance',
            message: `Spent Rs.${totalSpent.toLocaleString()}, ${savedVsBudget > 0 ? `saved Rs.${savedVsBudget.toLocaleString()} vs budget` : 'exceeded budget'}`,
            priority: 'low',
            data: {
              totalSpent,
              savedVsBudget,
              topCategory,
              budgetPerformance: savedVsBudget > 0 ? 'good' : 'over'
            },
            actions: [
              { label: 'View Full Report', action: 'open-weekly-report' }
            ]
          });
        }
      } catch (error) {
        console.error('Error generating weekly summary:', error);
      }
    }
  }

  // Handle family member added
  handleFamilyMemberAdded(memberData) {
    if (!this.notificationSettings.familyUpdates) return;

    this.scheduleNotification({
      type: 'FAMILY_UPDATE',
      title: '👨‍👩‍👧‍👦 Family Member Added',
      message: `${memberData.name} joined your family budget group!`,
      priority: 'medium',
      celebratory: true
    });
  }

  // Handle achievement unlocked
  handleAchievementUnlocked(achievementData) {
    if (!this.notificationSettings.achievementNotifications) return;

    this.scheduleNotification({
      type: 'ACHIEVEMENT_UNLOCK',
      title: '🏆 Achievement Unlocked!',
      message: `You earned "${achievementData.name}" - ${achievementData.description}`,
      priority: 'celebration',
      celebratory: true,
      achievement: achievementData
    });
  }

  // Schedule a notification
  scheduleNotification(notificationData) {
    const notification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
      ...notificationData,
      config: this.notificationTypes[notificationData.type] || this.notificationTypes.WEEKLY_SUMMARY
    };

    // Check quiet hours
    if (this.isQuietHours() && !notification.priority === 'critical') {
      notification.scheduledFor = this.getNextActiveTime();
    }

    this.notifications.unshift(notification);
    this.saveNotificationHistory();

    // Show immediately if requested or critical
    if (notification.showImmediately || notification.priority === 'critical') {
      this.displayNotification(notification);
    }

    // Emit event for UI updates
    this.emit('notification-added', notification);
    
    // Show browser notification if enabled
    this.showBrowserNotification(notification);

    return notification;
  }

  // Check if it's quiet hours
  isQuietHours() {
    if (!this.notificationSettings.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const start = this.parseTime(this.notificationSettings.quietHours.start);
    const end = this.parseTime(this.notificationSettings.quietHours.end);

    if (start > end) { // Overnight quiet hours
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  // Parse time string to number
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  // Get next active time after quiet hours
  getNextActiveTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = this.notificationSettings.quietHours.end.split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow.toISOString();
  }

  // Display notification in UI
  displayNotification(notification) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `fixed top-4 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 transform transition-all duration-300 translate-x-full`;
    notificationElement.setAttribute('data-notification-id', notification.id);
    
    notificationElement.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg" style="background-color: ${notification.config.color}20">
            ${notification.config.icon}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 mb-1">
            ${notification.title}
          </h4>
          <p class="text-sm text-gray-700">${notification.message}</p>
          ${notification.actions ? `
            <div class="mt-3 flex space-x-2">
              ${notification.actions.map(action => `
                <button class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors" 
                        onclick="window.notificationService?.handleNotificationAction('${notification.id}', '${action.action}')">
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <button class="ml-2 text-gray-400 hover:text-gray-600" 
                onclick="window.notificationService?.dismissNotificationElement(this)">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notificationElement);

    // Animate in
    setTimeout(() => {
      notificationElement.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove based on priority
    const autoRemoveTime = notification.priority === 'critical' ? 10000 : 
                          notification.celebratory ? 8000 : 5000;
    
    setTimeout(() => {
      if (notificationElement.parentElement) {
        notificationElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notificationElement.parentElement) {
            notificationElement.parentElement.removeChild(notificationElement);
          }
        }, 300);
      }
    }, autoRemoveTime);
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type,
        requireInteraction: notification.priority === 'critical'
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        if (notification.actions?.[0]) {
          this.handleNotificationAction(notification.id, notification.actions[0].action);
        }
      };
    }
  }

  // Handle notification actions
  handleNotificationAction(notificationId, action) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    console.log(`Handling notification action: ${action} for notification ${notificationId}`);

    switch (action) {
      case 'open-category-details':
        // Would navigate to category details
        window.dispatchEvent(new CustomEvent('navigate-to-category', { 
          detail: { category: notification.category } 
        }));
        break;
      case 'edit-budget':
        // Would open budget editing interface
        window.dispatchEvent(new CustomEvent('open-budget-editor', { 
          detail: { category: notification.category } 
        }));
        break;
      case 'pay-bill':
        // Would open bill payment interface
        window.dispatchEvent(new CustomEvent('open-bill-payment', { 
          detail: { billId: notification.billId } 
        }));
        break;
      case 'create-goal':
        // Would open goal creation interface
        window.dispatchEvent(new CustomEvent('open-goal-creator'));
        break;
      default:
        console.log(`Unhandled notification action: ${action}`);
    }

    // Mark notification as read
    notification.read = true;
    this.saveNotificationHistory();
    this.emit('notification-updated', notification);
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

  // Get notifications for UI
  getNotifications(limit = 50, unreadOnly = false) {
    let filtered = this.notifications.filter(n => !n.dismissed);
    
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    
    return filtered.slice(0, limit);
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotificationHistory();
      this.emit('notification-updated', notification);
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotificationHistory();
    this.emit('notifications-updated');
  }

  // Dismiss notification
  dismissNotification(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      this.saveNotificationHistory();
      this.emit('notification-dismissed', notification);
    }
  }

  // Safely dismiss notification element
  dismissNotificationElement(buttonElement) {
    // First try to find notification by data attribute (most reliable)
    let notificationElement = buttonElement.closest('[data-notification-id]');
    
    if (!notificationElement) {
      // Fallback: traverse up the DOM tree to find notification container
      notificationElement = buttonElement;
      let levels = 0;
      while (notificationElement && levels < 5) {
        if (notificationElement.classList && notificationElement.classList.contains('fixed') && 
            notificationElement.classList.contains('top-4') && 
            notificationElement.classList.contains('right-4')) {
          break;
        }
        notificationElement = notificationElement.parentElement;
        levels++;
      }
    }
    
    if (notificationElement && notificationElement.hasAttribute('data-notification-id')) {
      // Animate out and remove
      notificationElement.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notificationElement && notificationElement.parentElement) {
          notificationElement.parentElement.removeChild(notificationElement);
        }
      }, 300);
    } else {
      console.error('Could not find notification element to dismiss');
    }
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = [];
    this.saveNotificationHistory();
    this.emit('notifications-cleared');
  }

  // Get notification statistics
  getNotificationStats() {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read && !n.dismissed).length;
    const byType = {};
    
    this.notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total,
      unread,
      read: total - unread,
      byType,
      lastNotification: this.notifications[0]?.timestamp || null
    };
  }

  // Test notification (for development)
  testNotification(type = 'GOAL_ACHIEVED') {
    const testNotifications = {
      GOAL_ACHIEVED: {
        title: '🎉 Test Achievement!',
        message: 'This is a test celebration notification',
        celebratory: true
      },
      BUDGET_WARNING: {
        title: '⚠️ Test Budget Warning',
        message: 'This is a test budget warning notification'
      },
      BILL_DUE: {
        title: '💸 Test Bill Reminder',
        message: 'This is a test bill due notification'
      }
    };

    this.scheduleNotification({
      type,
      ...testNotifications[type],
      showImmediately: true
    });
  }
}

// Create and export singleton instance
const smartNotificationService = new SmartNotificationService();

// Make it globally accessible for notification actions
window.notificationService = smartNotificationService;

export default smartNotificationService;