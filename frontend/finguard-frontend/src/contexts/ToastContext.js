import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const { isDarkMode } = useTheme();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000, actions = null) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
      actions,
      timestamp: new Date()
    };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, duration = 5000, actions = null) => {
    return addToast(message, 'success', duration, actions);
  }, [addToast]);

  const error = useCallback((message, duration = 8000, actions = null) => {
    return addToast(message, 'error', duration, actions);
  }, [addToast]);

  const warning = useCallback((message, duration = 6000, actions = null) => {
    return addToast(message, 'warning', duration, actions);
  }, [addToast]);

  const info = useCallback((message, duration = 5000, actions = null) => {
    return addToast(message, 'info', duration, actions);
  }, [addToast]);

  const loading = useCallback((message, duration = 0) => {
    return addToast(message, 'loading', duration);
  }, [addToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'loading':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getToastStyles = (type) => {
    const baseStyles = `transform transition-all duration-300 ease-in-out ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-lg shadow-lg p-4 mb-3`;

    switch (type) {
      case 'success':
        return `${baseStyles} border-l-4 border-l-green-500`;
      case 'error':
        return `${baseStyles} border-l-4 border-l-red-500`;
      case 'warning':
        return `${baseStyles} border-l-4 border-l-yellow-500`;
      case 'loading':
        return `${baseStyles} border-l-4 border-l-blue-500`;
      default:
        return `${baseStyles} border-l-4 border-l-blue-500`;
    }
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getToastIcon(toast.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {toast.message}
              </p>
              
              {toast.actions && (
                <div className="mt-3 flex space-x-2">
                  {toast.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        if (action.closeOnClick !== false) {
                          removeToast(toast.id);
                        }
                      }}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className={`ml-2 flex-shrink-0 ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              } transition-colors`}
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    loading
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export default ToastProvider;