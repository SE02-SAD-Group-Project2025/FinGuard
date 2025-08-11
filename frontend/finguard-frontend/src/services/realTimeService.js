// Real-time Service for Family Budget Tracking
class RealTimeService {
  constructor() {
    this.eventListeners = new Map();
    this.familyBudgetLimits = new Map();
    this.currentSpending = new Map();
    this.notificationQueue = [];
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    if (this.isInitialized) return;
    
    // Load family budget data
    await this.loadFamilyBudgetData();
    
    // Set up periodic checks
    this.setupPeriodicChecks();
    
    // Listen for transaction events
    this.setupTransactionListener();
    
    this.isInitialized = true;
    console.log('Real-time family tracking initialized');
  }

  // Load current family budget data
  async loadFamilyBudgetData() {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      // Get family financial summary
      const response = await fetch('http://localhost:5000/api/family/financial-summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update family member budget limits
        data.members?.forEach(member => {
          this.familyBudgetLimits.set(member.userId, {
            monthlyBudget: member.monthlyBudget,
            currentSpent: member.monthlyExpenses,
            name: member.username,
            role: member.role
          });
        });

        // Emit initial budget status
        this.emit('budget-data-loaded', {
          members: data.members,
          summary: data.summary
        });
      }
    } catch (error) {
      console.error('Error loading family budget data:', error);
    }
  }

  // Set up periodic budget checks
  setupPeriodicChecks() {
    // Store interval IDs for cleanup
    this.intervals = this.intervals || [];
    
    // Clear any existing intervals
    this.clearPeriodicChecks();

    // Check budget status every 30 seconds
    this.intervals.push(setInterval(() => {
      this.checkBudgetAlerts();
    }, 30000));

    // Refresh family data every 5 minutes
    this.intervals.push(setInterval(() => {
      this.loadFamilyBudgetData();
    }, 300000));
  }

  // Clear all periodic checks
  clearPeriodicChecks() {
    if (this.intervals) {
      this.intervals.forEach(intervalId => clearInterval(intervalId));
      this.intervals = [];
    }
  }

  // Cleanup method for proper shutdown
  destroy() {
    this.clearPeriodicChecks();
    this.eventListeners.clear();
    this.notificationQueue = [];
    this.isInitialized = false;
  }

  // Listen for transaction events
  setupTransactionListener() {
    // Listen for transaction added events
    window.addEventListener('transaction-added', () => {
      setTimeout(() => {
        this.loadFamilyBudgetData();
        this.checkBudgetAlerts();
      }, 1000);
    });

    // Listen for custom family transaction events
    window.addEventListener('family-expense-added', (event) => {
      this.handleFamilyExpenseAdded(event.detail);
    });
  }

  // Handle family expense added
  handleFamilyExpenseAdded(expenseData) {
    const { userId, amount, category, memberName } = expenseData;
    
    // Update current spending
    const currentData = this.familyBudgetLimits.get(userId);
    if (currentData) {
      currentData.currentSpent += amount;
      this.familyBudgetLimits.set(userId, currentData);
    }

    // Check for immediate budget warnings
    this.checkMemberBudgetStatus(userId, amount, category, memberName);

    // Emit real-time update
    this.emit('family-expense-update', {
      userId,
      amount,
      category,
      memberName,
      newTotal: currentData?.currentSpent || 0,
      budgetLimit: currentData?.monthlyBudget || 0
    });
  }

  // Check budget alerts for all family members
  checkBudgetAlerts() {
    this.familyBudgetLimits.forEach((data, userId) => {
      this.checkMemberBudgetStatus(userId, 0, '', data.name, true);
    });
  }

  // Check individual member budget status
  checkMemberBudgetStatus(userId, newAmount = 0, category = '', memberName = '', isPeriodicCheck = false) {
    const budgetData = this.familyBudgetLimits.get(userId);
    if (!budgetData) return;

    const { monthlyBudget, currentSpent, name, role } = budgetData;
    const projectedSpent = currentSpent + newAmount;
    const usagePercentage = (projectedSpent / monthlyBudget) * 100;

    let alertType = null;
    let message = '';

    if (usagePercentage >= 100) {
      alertType = 'budget-exceeded';
      message = `${memberName || name} has exceeded their monthly budget of Rs.${monthlyBudget.toLocaleString()}`;
    } else if (usagePercentage >= 90) {
      alertType = 'budget-warning-90';
      message = `${memberName || name} has used 90% of their monthly budget (Rs.${projectedSpent.toLocaleString()} / Rs.${monthlyBudget.toLocaleString()})`;
    } else if (usagePercentage >= 75) {
      alertType = 'budget-warning-75';
      message = `${memberName || name} has used 75% of their monthly budget`;
    }

    if (alertType && !isPeriodicCheck) {
      // Show immediate notification for new expenses
      this.showBudgetNotification({
        type: alertType,
        message,
        userId,
        memberName: memberName || name,
        category,
        amount: newAmount,
        usagePercentage,
        currentSpent: projectedSpent,
        budgetLimit: monthlyBudget
      });
    }

    // Emit budget status update
    this.emit('budget-status-update', {
      userId,
      memberName: memberName || name,
      role,
      usagePercentage,
      currentSpent: projectedSpent,
      budgetLimit: monthlyBudget,
      alertType,
      isOverBudget: usagePercentage >= 100
    });
  }

  // Show budget notification
  showBudgetNotification(alert) {
    // Add to notification queue
    this.notificationQueue.push({
      ...alert,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });

    // Show visual notification
    this.displayNotification(alert);

    // Emit notification event
    this.emit('budget-alert', alert);
  }

  // Display visual notification
  displayNotification(alert) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 max-w-sm bg-white border-l-4 rounded-lg shadow-lg z-50 p-4 ${
      alert.type === 'budget-exceeded' ? 'border-red-500' : 'border-yellow-500'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full flex items-center justify-center ${
            alert.type === 'budget-exceeded' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
          }">
            ${alert.type === 'budget-exceeded' ? '⚠️' : '💰'}
          </div>
        </div>
        <div class="ml-3 flex-1">
          <h4 class="text-sm font-medium text-gray-900 mb-1">
            ${alert.type === 'budget-exceeded' ? 'Budget Exceeded!' : 'Budget Warning'}
          </h4>
          <p class="text-sm text-gray-700">${alert.message}</p>
          <div class="mt-2">
            <div class="bg-gray-200 rounded-full h-2">
              <div class="h-2 rounded-full ${
                alert.usagePercentage >= 100 ? 'bg-red-500' : 
                alert.usagePercentage >= 90 ? 'bg-yellow-500' : 'bg-green-500'
              }" style="width: ${Math.min(alert.usagePercentage, 100)}%"></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Rs.${alert.currentSpent.toLocaleString()} / Rs.${alert.budgetLimit.toLocaleString()} (${Math.round(alert.usagePercentage)}%)
            </p>
          </div>
        </div>
        <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 8000);
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

  // Get current family budget status
  getFamilyBudgetStatus() {
    const status = [];
    this.familyBudgetLimits.forEach((data, userId) => {
      const usagePercentage = (data.currentSpent / data.monthlyBudget) * 100;
      status.push({
        userId,
        memberName: data.name,
        role: data.role,
        monthlyBudget: data.monthlyBudget,
        currentSpent: data.currentSpent,
        remainingBudget: Math.max(0, data.monthlyBudget - data.currentSpent),
        usagePercentage,
        isOverBudget: usagePercentage >= 100
      });
    });
    return status;
  }

  // Get recent notifications
  getRecentNotifications(limit = 10) {
    return this.notificationQueue
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Clear notifications
  clearNotifications() {
    this.notificationQueue = [];
  }

  // Simulate family expense (for testing)
  simulateFamilyExpense(userId, amount, category, memberName) {
    this.handleFamilyExpenseAdded({
      userId,
      amount,
      category,
      memberName
    });
  }
}

// Create and export singleton instance
const realTimeService = new RealTimeService();
export default realTimeService;