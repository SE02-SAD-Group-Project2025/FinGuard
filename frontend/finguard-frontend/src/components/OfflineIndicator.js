// Offline indicator component to show connection status and pending actions
import React, { useState } from 'react';
import { WifiOff, Wifi, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useOfflineHandler } from '../hooks/useOfflineHandler';
import { useTheme } from '../contexts/ThemeContext';

const OfflineIndicator = () => {
  const { isDarkMode } = useTheme();
  const { isOnline, pendingActionsCount, triggerSync, getOfflineStatus } = useOfflineHandler({
    showNotifications: false // We'll handle notifications in the indicator
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show indicator when online and no pending actions
  if (isOnline && pendingActionsCount === 0) {
    return null;
  }

  const status = getOfflineStatus();

  return (
    <div className={`fixed top-16 right-4 z-50 transition-all duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-lg shadow-lg max-w-sm`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        } rounded-t-lg`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {pendingActionsCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {pendingActionsCount} pending
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {pendingActionsCount > 0 && isOnline && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerSync();
              }}
              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              title="Sync now"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={`border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
        } p-3 rounded-b-lg`}>
          <div className="space-y-2 text-sm">
            {!isOnline && (
              <div className="flex items-center space-x-2 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span>No internet connection</span>
              </div>
            )}

            {pendingActionsCount > 0 && (
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock className="h-4 w-4" />
                <span>{pendingActionsCount} actions queued for sync</span>
              </div>
            )}

            {status.cachedDataCount > 0 && (
              <div className={`flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                <span>{status.cachedDataCount} items cached offline</span>
              </div>
            )}

            {status.lastSyncAttempt && (
              <div className={`flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  Last activity: {new Date(status.lastSyncAttempt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            {isOnline && pendingActionsCount > 0 && (
              <button
                onClick={triggerSync}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Sync Now</span>
              </button>
            )}

            {!isOnline && (
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              } text-center`}>
                Actions will sync automatically when connection is restored
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;