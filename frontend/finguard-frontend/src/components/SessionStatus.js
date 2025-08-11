import React, { useState, useEffect } from 'react';
import { Shield, Clock, Activity, Settings, RefreshCw } from 'lucide-react';
import sessionManagementService from '../services/sessionManagementService';

const SessionStatus = ({ compact = false }) => {
  const [sessionStats, setSessionStats] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    updateStats();
    loadSettings();

    // Set up event listeners
    sessionManagementService.on('session-started', updateStats);
    sessionManagementService.on('session-ended', updateStats);
    sessionManagementService.on('user-activity', updateStats);
    sessionManagementService.on('session-extended', updateStats);

    // Update stats every minute
    const interval = setInterval(updateStats, 60000);

    return () => {
      clearInterval(interval);
      sessionManagementService.off('session-started', updateStats);
      sessionManagementService.off('session-ended', updateStats);
      sessionManagementService.off('user-activity', updateStats);
      sessionManagementService.off('session-extended', updateStats);
    };
  }, []);

  const updateStats = () => {
    const stats = sessionManagementService.getSessionStats();
    setSessionStats(stats);
  };

  const loadSettings = () => {
    const currentSettings = sessionManagementService.config;
    setSettings({
      sessionTimeout: currentSettings.sessionTimeout / 1000 / 60, // convert to minutes
      warningTime: currentSettings.warningTime / 1000 / 60
    });
  };

  const handleSettingsUpdate = (newSettings) => {
    const updatedConfig = {
      sessionTimeout: newSettings.sessionTimeout * 60 * 1000, // convert to ms
      warningTime: newSettings.warningTime * 60 * 1000
    };
    
    sessionManagementService.updateSettings(updatedConfig);
    setSettings(newSettings);
    setShowSettings(false);
  };

  const getStatusColor = () => {
    if (!sessionStats.isActive) return 'text-gray-500';
    if (sessionStats.timeUntilLogout <= 5) return 'text-red-500';
    if (sessionStats.timeUntilLogout <= 10) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!sessionStats.isActive) return 'Not logged in';
    if (sessionStats.timeUntilLogout <= 0) return 'Session expired';
    return 'Active session';
  };

  // Compact view for navbar or small spaces
  if (compact) {
    if (!sessionStats.isActive) return null;

    return (
      <div className="flex items-center space-x-2 text-sm">
        <Shield className={`w-4 h-4 ${getStatusColor()}`} />
        <span className="text-gray-600 dark:text-gray-300">
          {sessionStats.timeUntilLogout}m
        </span>
      </div>
    );
  }

  // Full session status panel
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Shield className={`w-5 h-5 mr-2 ${getStatusColor()}`} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Status</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {sessionStats.isActive ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</p>
                  <p className={`font-semibold ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                </div>
                <Activity className={`w-6 h-6 ${getStatusColor()}`} />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Session Duration</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {sessionStats.sessionDuration} minutes
                  </p>
                </div>
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Activity</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {sessionStats.timeSinceActivity} minutes ago
                  </p>
                </div>
                <RefreshCw className="w-6 h-6 text-green-500" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Auto-logout In</p>
                  <p className={`font-semibold ${getStatusColor()}`}>
                    {sessionStats.timeUntilLogout} minutes
                  </p>
                </div>
                <Clock className={`w-6 h-6 ${getStatusColor()}`} />
              </div>
            </div>
          </div>

          {/* Session Timeline */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Session Timeline
              </span>
              <span className="text-xs text-gray-500">
                Auto-logout in {sessionStats.timeUntilLogout}m
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  sessionStats.timeUntilLogout <= 5 ? 'bg-red-500' :
                  sessionStats.timeUntilLogout <= 10 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.max(5, (sessionStats.timeUntilLogout / (settings.sessionTimeout || 30)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => sessionManagementService.extendSession()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Extend Session
            </button>
            <button
              onClick={() => sessionManagementService.endSession('manual-logout')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Logout Now
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No active session</p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Session Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auto-logout after (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={settings.sessionTimeout || 30}
                onChange={(e) => setSettings({
                  ...settings, 
                  sessionTimeout: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Show warning (minutes before logout)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.warningTime || 5}
                onChange={(e) => setSettings({
                  ...settings, 
                  warningTime: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettingsUpdate(settings)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionStatus;