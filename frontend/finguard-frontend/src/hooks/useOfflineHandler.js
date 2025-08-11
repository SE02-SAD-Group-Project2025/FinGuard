// Offline handling hook for graceful degradation
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useOfflineHandler = (options = {}) => {
  const {
    enableLocalStorage = true,
    syncOnReconnect = true,
    showNotifications = true
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);
  const [offlineData, setOfflineData] = useState(new Map());
  const { info, warning, error: showError } = useToast();

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showNotifications) {
        info('Connection restored! Syncing data...', 'success');
      }
      
      if (syncOnReconnect) {
        syncPendingActions();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (showNotifications) {
        warning('You are now offline. Changes will be synced when connection is restored.', 'warning', 8000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnReconnect, showNotifications, info, warning]);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage) {
      try {
        const saved = localStorage.getItem('finguard-offline-actions');
        if (saved) {
          setPendingActions(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load offline actions:', error);
      }
    }
  }, [enableLocalStorage]);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    if (enableLocalStorage && pendingActions.length > 0) {
      try {
        localStorage.setItem('finguard-offline-actions', JSON.stringify(pendingActions));
      } catch (error) {
        console.error('Failed to save offline actions:', error);
      }
    } else if (enableLocalStorage && pendingActions.length === 0) {
      localStorage.removeItem('finguard-offline-actions');
    }
  }, [pendingActions, enableLocalStorage]);

  // Queue an action for when online
  const queueAction = useCallback((action) => {
    const actionWithId = {
      ...action,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      retries: 0
    };

    setPendingActions(prev => [...prev, actionWithId]);
    
    if (showNotifications) {
      info(`Action queued for when connection is restored`, 'info', 3000);
    }
    
    return actionWithId.id;
  }, [showNotifications, info]);

  // Execute pending actions when online
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const actionsToProcess = [...pendingActions];
    let successCount = 0;
    let failedActions = [];

    for (const action of actionsToProcess) {
      try {
        // Execute the action
        if (action.execute && typeof action.execute === 'function') {
          await action.execute();
          successCount++;
        } else if (action.endpoint && action.method) {
          // Generic API call
          const response = await fetch(action.endpoint, {
            method: action.method,
            headers: action.headers || { 'Content-Type': 'application/json' },
            body: action.data ? JSON.stringify(action.data) : undefined
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to sync action:`, error);
        
        // Retry logic
        if (action.retries < 3) {
          failedActions.push({
            ...action,
            retries: action.retries + 1
          });
        } else {
          console.error(`Action failed after 3 retries:`, action);
          if (showNotifications) {
            showError(`Failed to sync: ${action.description || 'Unknown action'}`, 5000);
          }
        }
      }
    }

    // Update pending actions
    setPendingActions(failedActions);

    if (successCount > 0 && showNotifications) {
      info(`Successfully synced ${successCount} actions`, 'success', 4000);
    }
  }, [isOnline, pendingActions, showNotifications, info, showError]);

  // Store data offline
  const storeOfflineData = useCallback((key, data) => {
    setOfflineData(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        data,
        timestamp: Date.now(),
        synced: false
      });
      return newMap;
    });

    // Also store in localStorage if enabled
    if (enableLocalStorage) {
      try {
        const existing = JSON.parse(localStorage.getItem('finguard-offline-data') || '{}');
        existing[key] = {
          data,
          timestamp: Date.now(),
          synced: false
        };
        localStorage.setItem('finguard-offline-data', JSON.stringify(existing));
      } catch (error) {
        console.error('Failed to store offline data:', error);
      }
    }
  }, [enableLocalStorage]);

  // Retrieve offline data
  const getOfflineData = useCallback((key) => {
    const memoryData = offlineData.get(key);
    if (memoryData) return memoryData.data;

    // Fallback to localStorage
    if (enableLocalStorage) {
      try {
        const stored = localStorage.getItem('finguard-offline-data');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed[key]?.data;
        }
      } catch (error) {
        console.error('Failed to retrieve offline data:', error);
      }
    }

    return null;
  }, [offlineData, enableLocalStorage]);

  // Clear offline data
  const clearOfflineData = useCallback((key) => {
    setOfflineData(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });

    if (enableLocalStorage) {
      try {
        const stored = localStorage.getItem('finguard-offline-data');
        if (stored) {
          const parsed = JSON.parse(stored);
          delete parsed[key];
          localStorage.setItem('finguard-offline-data', JSON.stringify(parsed));
        }
      } catch (error) {
        console.error('Failed to clear offline data:', error);
      }
    }
  }, [enableLocalStorage]);

  // Wrapper for API calls with offline handling
  const makeOfflineCapableRequest = useCallback(async (requestConfig) => {
    const {
      endpoint,
      method = 'GET',
      data,
      headers,
      description,
      offlineKey,
      fallbackData
    } = requestConfig;

    if (!isOnline) {
      // Handle offline scenario
      if (method === 'GET' && offlineKey) {
        const cached = getOfflineData(offlineKey);
        if (cached) {
          return { data: cached, fromCache: true };
        }
      }

      // For non-GET requests, queue the action
      if (method !== 'GET') {
        const actionId = queueAction({
          endpoint,
          method,
          data,
          headers,
          description: description || `${method} ${endpoint}`
        });
        
        return { 
          queued: true, 
          actionId, 
          data: fallbackData || null 
        };
      }

      // No cached data available
      throw new Error('No internet connection and no cached data available');
    }

    // Online - make the request
    try {
      const response = await fetch(endpoint, {
        method,
        headers: headers || { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Cache successful GET requests
      if (method === 'GET' && offlineKey) {
        storeOfflineData(offlineKey, responseData);
      }

      return { data: responseData, fromCache: false };
    } catch (error) {
      // If request fails and we have cached data, use it
      if (method === 'GET' && offlineKey) {
        const cached = getOfflineData(offlineKey);
        if (cached) {
          if (showNotifications) {
            warning('Using cached data due to network error', 'warning', 4000);
          }
          return { data: cached, fromCache: true };
        }
      }

      throw error;
    }
  }, [isOnline, queueAction, getOfflineData, storeOfflineData, showNotifications, warning]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    if (isOnline) {
      syncPendingActions();
    } else {
      warning('Cannot sync while offline', 'warning');
    }
  }, [isOnline, syncPendingActions, warning]);

  // Get offline status summary
  const getOfflineStatus = useCallback(() => {
    return {
      isOnline,
      pendingActionsCount: pendingActions.length,
      cachedDataCount: offlineData.size,
      lastSyncAttempt: pendingActions.length > 0 ? 
        Math.max(...pendingActions.map(a => new Date(a.timestamp).getTime())) : 
        null
    };
  }, [isOnline, pendingActions, offlineData]);

  return {
    isOnline,
    pendingActionsCount: pendingActions.length,
    queueAction,
    storeOfflineData,
    getOfflineData,
    clearOfflineData,
    makeOfflineCapableRequest,
    triggerSync,
    getOfflineStatus
  };
};

export default useOfflineHandler;