import React, { useState } from 'react';
import { Sun, Moon, Monitor, Settings, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ size = 'md', showLabel = false, variant = 'button' }) => {
  const { isDarkMode, isSystemPreference, toggleDarkMode, enableSystemPreference, setTheme } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const handleSystemPreference = () => {
    // Call the enableSystemPreference function from theme context
    enableSystemPreference();
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const getCurrentIcon = () => {
    if (isSystemPreference) return Monitor;
    return isDarkMode ? Moon : Sun;
  };

  const getCurrentLabel = () => {
    if (isSystemPreference) return 'System';
    return isDarkMode ? 'Dark' : 'Light';
  };

  // Simple toggle button
  if (variant === 'button') {
    const Icon = getCurrentIcon();
    
    return (
      <button
        onClick={toggleDarkMode}
        className={`${buttonSizes[size]} text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          showLabel ? 'flex items-center space-x-2' : ''
        }`}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <Icon className={sizeClasses[size]} />
        {showLabel && (
          <span className="text-sm font-medium">{getCurrentLabel()} Mode</span>
        )}
      </button>
    );
  }

  // Dropdown with all options
  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`${buttonSizes[size]} flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        >
          {React.createElement(getCurrentIcon(), { className: sizeClasses[size] })}
          {showLabel && (
            <span className="text-sm font-medium">{getCurrentLabel()}</span>
          )}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-2">
              <button
                onClick={() => {
                  setTheme('light');
                  setShowOptions(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Sun className="w-4 h-4 mr-3" />
                  Light Mode
                </div>
                {!isDarkMode && !isSystemPreference && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
              
              <button
                onClick={() => {
                  setTheme('dark');
                  setShowOptions(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Moon className="w-4 h-4 mr-3" />
                  Dark Mode
                </div>
                {isDarkMode && !isSystemPreference && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
              
              <button
                onClick={() => {
                  handleSystemPreference();
                  setShowOptions(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-3" />
                  System Preference
                </div>
                {isSystemPreference && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {showOptions && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          ></div>
        )}
      </div>
    );
  }

  // Toggle switch variant
  if (variant === 'switch') {
    return (
      <div className="flex items-center space-x-3">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getCurrentLabel()} Mode
          </span>
        )}
        
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isDarkMode 
              ? 'bg-blue-600' 
              : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDarkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  // Segmented control variant
  if (variant === 'segmented') {
    return (
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            !isDarkMode && !isSystemPreference
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4 mr-2" />
          Light
        </button>
        
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isDarkMode && !isSystemPreference
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Moon className="w-4 h-4 mr-2" />
          Dark
        </button>
        
        <button
          onClick={handleSystemPreference}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isSystemPreference
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4 mr-2" />
          Auto
        </button>
      </div>
    );
  }

  return null;
};

export default ThemeToggle;