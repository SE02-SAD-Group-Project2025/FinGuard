import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  Settings,
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Users,
  DollarSign,
  Target,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw
} from 'lucide-react';
import smartNotificationService from '../services/smartNotificationService';
import { useTheme } from '../contexts/ThemeContext';

const SmartNotificationPanel = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [filter, setFilter] = useState('all'); // all, unread, important
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadSettings();
      
      // Set up event listeners
      smartNotificationService.on('notification-added', handleNotificationUpdate);
      smartNotificationService.on('notification-updated', handleNotificationUpdate);
      smartNotificationService.on('notifications-cleared', loadNotifications);
    }

    return () => {
      smartNotificationService.off('notification-added', handleNotificationUpdate);
      smartNotificationService.off('notification-updated', handleNotificationUpdate);
      smartNotificationService.off('notifications-cleared', loadNotifications);
    };
  }, [isOpen, filter]);

  const loadNotifications = () => {
    setLoading(true);
    
    try {
      const allNotifications = smartNotificationService.getNotifications(50);
      const filteredNotifications = filterNotifications(allNotifications);
      const notificationStats = smartNotificationService.getNotificationStats();
      
      setNotifications(filteredNotifications);
      setStats(notificationStats);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const currentSettings = smartNotificationService.notificationSettings;
    setSettings(currentSettings);
  };

  const handleNotificationUpdate = () => {
    loadNotifications();
  };

  const filterNotifications = (allNotifications) => {
    switch (filter) {
      case 'unread':
        return allNotifications.filter(n => !n.read);
      case 'important':
        return allNotifications.filter(n => ['critical', 'high', 'celebration'].includes(n.priority));
      default:
        return allNotifications;
    }
  };

  const handleMarkAsRead = (notificationId) => {
    smartNotificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    smartNotificationService.markAllAsRead();
  };

  const handleDismiss = (notificationId) => {
    smartNotificationService.dismissNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      smartNotificationService.clearAllNotifications();
    }
  };

  const handleSettingsUpdate = (newSettings) => {
    smartNotificationService.saveNotificationSettings(newSettings);
    setSettings({ ...settings, ...newSettings });
  };

  const handleTestNotification = (type) => {
    smartNotificationService.testNotification(type);
  };

  const getNotificationIcon = (notification) => {
    const iconMap = {
      BUDGET_WARNING: AlertTriangle,
      BUDGET_EXCEEDED: AlertTriangle,
      GOAL_ACHIEVED: Trophy,
      GOAL_MILESTONE: Target,
      BILL_DUE: DollarSign,
      SAVINGS_STREAK: TrendingUp,
      FAMILY_UPDATE: Users,
      ACHIEVEMENT_UNLOCK: Trophy,
      ANOMALY_DETECTED: Eye,
      WEEKLY_SUMMARY: Calendar,
      MONTHLY_REPORT: Calendar
    };

    const IconComponent = iconMap[notification.type] || Bell;
    return <IconComponent className="w-4 h-4" style={{ color: notification.config.color }} />;
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now - notificationTime) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50" 
      onClick={() => {
        try {
          onClose();
        } catch (error) {
          console.error('Error closing notification panel:', error);
        }
      }}
    >
      <div 
        className={`w-full max-w-md h-full overflow-hidden flex flex-col shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`border-b p-4 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BellRing className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Smart Notifications</h2>
            </div>
            <button
              onClick={() => {
                try {
                  onClose();
                } catch (error) {
                  console.error('Error closing notification panel:', error);
                }
              }}
              className={`${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              } transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className={`flex items-center justify-between text-sm mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span>{stats.total} total</span>
            <span className={`font-medium ${stats.unread > 0 ? 'text-blue-600' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
              {stats.unread} unread
            </span>
          </div>

          {/* Filter Tabs */}
          <div className={`flex space-x-1 p-1 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            {[
              { id: 'all', label: 'All', count: stats.total },
              { id: 'unread', label: 'Unread', count: stats.unread },
              { id: 'important', label: 'Important' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                  filter === tab.id
                    ? (isDarkMode ? 'bg-gray-800 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                    : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                {tab.label} {tab.count !== undefined && `(${tab.count})`}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className={`flex items-center px-3 py-1 text-xs rounded-full transition-colors ${
                    isDarkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center px-3 py-1 text-xs rounded-full transition-colors ${
                  isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </button>
            </div>
            
            <button
              onClick={loadNotifications}
              className={`${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`border-b p-4 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-sm font-medium mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Notification Settings</h3>
            <div className="space-y-3">
              {[
                { key: 'budgetAlerts', label: 'Budget Alerts' },
                { key: 'goalCelebrations', label: 'Goal Celebrations' },
                { key: 'billReminders', label: 'Bill Reminders' },
                { key: 'weeklyDigest', label: 'Weekly Digest' },
                { key: 'anomalyDetection', label: 'Anomaly Detection' },
                { key: 'familyUpdates', label: 'Family Updates' }
              ].map(setting => (
                <label key={setting.key} className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{setting.label}</span>
                  <input
                    type="checkbox"
                    checked={settings[setting.key] || false}
                    onChange={(e) => handleSettingsUpdate({ [setting.key]: e.target.checked })}
                    className="rounded"
                  />
                </label>
              ))}
            </div>
            
            {/* Test Notifications */}
            <div className={`mt-4 pt-3 border-t ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <p className={`text-xs mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Test Notifications:</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTestNotification('GOAL_ACHIEVED')}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                >
                  Goal
                </button>
                <button
                  onClick={() => handleTestNotification('BUDGET_WARNING')}
                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded"
                >
                  Budget
                </button>
                <button
                  onClick={() => handleTestNotification('BILL_DUE')}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                >
                  Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className="flex-1">
                      <div className={`h-4 rounded w-3/4 mb-2 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-3 rounded w-1/2 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className={`w-16 h-16 mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <h3 className={`text-lg font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </h3>
              <p className={`${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {filter === 'unread' 
                  ? 'You have no unread notifications'
                  : 'Notifications will appear here when you have updates'
                }
              </p>
            </div>
          ) : (
            <div className={`divide-y ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-100'
            }`}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${
                    !notification.read ? (isDarkMode ? 'bg-blue-900 border-l-4 border-blue-400' : 'bg-blue-50 border-l-4 border-blue-500') : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                          }`}>
                            {notification.title}
                          </h4>
                          <span className={`text-xs ml-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {getRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Priority Badge */}
                        {['critical', 'high', 'celebration'].includes(notification.priority) && (
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              notification.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {notification.priority === 'celebration' ? '🎉' : '⚡'} 
                              {notification.priority}
                            </span>
                          </div>
                        )}
                        
                        {/* Actions */}
                        {notification.actions && (
                          <div className="flex space-x-2 mt-3">
                            {notification.actions.slice(0, 2).map((action, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  smartNotificationService.handleNotificationAction(notification.id, action.action);
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Notification Actions */}
                    <div className="flex items-center space-x-2 ml-3">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="bg-white border-t border-gray-200 p-4">
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNotificationPanel;