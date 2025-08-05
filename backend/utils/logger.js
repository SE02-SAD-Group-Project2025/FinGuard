// utils/logger.js
const db = require('../db');

// Enhanced logging function with details
const logActivity = async (userId, activity, details = null, req = null) => {
  try {
    // Extract additional context from request if available
    const logDetails = {
      ...details,
      ip: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    await db.query(
      'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
      [userId, activity, JSON.stringify(logDetails)]
    );
    
    console.log(`📝 Log created: ${activity} for user ${userId}`);
  } catch (err) {
    console.error('❌ Failed to create log:', err);
    // Don't throw error to avoid breaking main functionality
  }
};

// Specific logging functions for different activities
const authLogger = {
  login: (userId, req) => logActivity(userId, 'User logged in', {
    loginMethod: 'email',
    success: true
  }, req),
  
  logout: (userId, req) => logActivity(userId, 'User logged out', {
    logoutType: 'manual'
  }, req),
  
  register: (userId, userData, req) => logActivity(userId, 'User registered', {
    username: userData.username,
    email: userData.email,
    registrationMethod: 'enhanced'
  }, req),
  
  failedLogin: (email, req) => logActivity(null, 'Failed login attempt', {
    email: email,
    reason: 'invalid_credentials'
  }, req),
  
  passwordReset: (userId, req) => logActivity(userId, 'Password reset requested', {
    method: 'email'
  }, req),
  
  passwordChanged: (userId, req) => logActivity(userId, 'Password changed', {
    method: 'user_initiated'
  }, req)
};

const profileLogger = {
  update: (userId, changes, req) => logActivity(userId, 'Profile updated', {
    fields_changed: Object.keys(changes),
    previous_values: changes
  }, req),
  
  emailChange: (userId, oldEmail, newEmail, req) => logActivity(userId, 'Email address changed', {
    old_email: oldEmail,
    new_email: newEmail
  }, req),
  
  usernameChange: (userId, oldUsername, newUsername, req) => logActivity(userId, 'Username changed', {
    old_username: oldUsername,
    new_username: newUsername
  }, req)
};

const transactionLogger = {
  add: (userId, transaction, req) => logActivity(userId, `${transaction.type === 'income' ? 'Income' : 'Expense'} added`, {
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description
  }, req),
  
  update: (userId, transactionId, changes, req) => logActivity(userId, 'Transaction updated', {
    transaction_id: transactionId,
    changes: changes
  }, req),
  
  delete: (userId, transaction, req) => logActivity(userId, 'Transaction deleted', {
    transaction_id: transaction.id,
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount
  }, req)
};

const budgetLogger = {
  create: (userId, budget, req) => logActivity(userId, 'Budget created', {
    category: budget.category,
    limit_amount: budget.limit_amount,
    month: budget.month,
    year: budget.year
  }, req),
  
  update: (userId, budgetId, changes, req) => logActivity(userId, 'Budget updated', {
    budget_id: budgetId,
    changes: changes
  }, req),
  
  delete: (userId, budget, req) => logActivity(userId, 'Budget deleted', {
    budget_id: budget.id,
    category: budget.category,
    limit_amount: budget.limit_amount
  }, req),
  
  alertTriggered: (userId, budget, totalSpent, req) => logActivity(userId, 'Budget alert triggered', {
    category: budget.category,
    limit: budget.limit_amount,
    spent: totalSpent,
    over_budget_by: totalSpent - budget.limit_amount
  }, req)
};

const adminLogger = {
  userBanned: (adminId, targetUserId, targetUsername, req) => logActivity(adminId, 'User banned by admin', {
    target_user_id: targetUserId,
    target_username: targetUsername,
    admin_action: true
  }, req),
  
  userUnbanned: (adminId, targetUserId, targetUsername, req) => logActivity(adminId, 'User unbanned by admin', {
    target_user_id: targetUserId,
    target_username: targetUsername,
    admin_action: true
  }, req),
  
  roleChanged: (adminId, targetUserId, targetUsername, oldRole, newRole, req) => logActivity(adminId, 'User role changed by admin', {
    target_user_id: targetUserId,
    target_username: targetUsername,
    old_role: oldRole,
    new_role: newRole,
    admin_action: true
  }, req),
  
  adminLogin: (adminId, req) => logActivity(adminId, 'Admin logged in', {
    admin_access: true,
    login_method: 'credentials'
  }, req)
};

const securityLogger = {
  blockedAccess: (userId, reason, req) => logActivity(userId, 'Access blocked', {
    reason: reason,
    security_event: true
  }, req),
  
  suspiciousActivity: (userId, activity, req) => logActivity(userId, 'Suspicious activity detected', {
    suspicious_activity: activity,
    security_event: true
  }, req),
  
  tokenExpired: (userId, req) => logActivity(userId, 'Token expired', {
    security_event: true
  }, req)
};

module.exports = {
  logActivity,
  authLogger,
  profileLogger,
  transactionLogger,
  budgetLogger,
  adminLogger,
  securityLogger
};