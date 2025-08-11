import React, { createContext, useContext, useState, useEffect } from 'react';
import authStorage from '../utils/authStorage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSystemPreference, setIsSystemPreference] = useState(true);

  // Load theme preference from secure storage and backend
  useEffect(() => {
    const loadUserThemePreference = async () => {
      const token = authStorage.getToken();
      const currentUser = authStorage.getUserIdentifier();
      
      if (token && currentUser) {
        try {
          // Try to load user's theme preference from backend
          const response = await fetch('http://localhost:5000/api/user/preferences', {
            headers: authStorage.getAuthHeaders()
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const preferences = await response.json();
              if (preferences.theme) {
                setIsDarkMode(preferences.theme === 'dark');
                setIsSystemPreference(preferences.useSystemTheme || false);
                // Also save to localStorage for offline access
                localStorage.setItem('finguard-theme', preferences.theme);
                localStorage.setItem('finguard-system-theme', preferences.useSystemTheme ? 'true' : 'false');
                return;
              }
            }
          }
        } catch (error) {
          // Silently handle API error - endpoint may not exist yet or return HTML
          console.log('Backend theme preferences not available, using local storage');
        }
      }
      
      // Fallback to localStorage if backend fails (only for logged in users)
      if (token && currentUser) {
        const userKey = `finguard-theme-${currentUser}`;
        const userSystemKey = `finguard-system-theme-${currentUser}`;
        const savedTheme = localStorage.getItem(userKey);
        const savedSystemPref = localStorage.getItem(userSystemKey);
        
        if (savedTheme) {
          // User has a saved theme preference
          setIsDarkMode(savedTheme === 'dark');
          setIsSystemPreference(savedSystemPref === 'true');
        } else {
          // New user - use system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(systemPrefersDark);
          setIsSystemPreference(true);
          localStorage.setItem(userSystemKey, 'true');
        }
      } else {
        // No user logged in - use system preference without saving
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
        setIsSystemPreference(true);
      }
    };
    
    loadUserThemePreference();
    
    // Listen for login/logout events to reload theme
    const handleUserChange = () => {
      loadUserThemePreference();
    };
    
    window.addEventListener('finguard-login', handleUserChange);
    window.addEventListener('finguard-logout', handleUserChange);
    
    return () => {
      window.removeEventListener('finguard-login', handleUserChange);
      window.removeEventListener('finguard-logout', handleUserChange);
    };
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!isSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (isSystemPreference) {
        setIsDarkMode(e.matches);
        updateDocumentTheme(e.matches);
      }
    };

    mediaQuery.addListener(handleSystemThemeChange);
    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }, [isSystemPreference]);

  // Update document theme
  const updateDocumentTheme = (darkMode) => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
      bodyElement.classList.add('dark');
      bodyElement.style.backgroundColor = '#1f2937'; // gray-800
      bodyElement.style.color = '#f9fafb'; // gray-50
    } else {
      htmlElement.classList.remove('dark');
      bodyElement.classList.remove('dark');
      bodyElement.style.backgroundColor = '#f9fafb'; // gray-50
      bodyElement.style.color = '#111827'; // gray-900
    }
    
    // Force a repaint to ensure styles are applied
    bodyElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  };

  // Apply theme when isDarkMode changes
  useEffect(() => {
    updateDocumentTheme(isDarkMode);
  }, [isDarkMode]);

  // Save theme preference to backend
  const saveThemePreference = async (theme, useSystemTheme = false) => {
    const token = authStorage.getToken();
    const currentUser = authStorage.getUserIdentifier();
    
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/user/preferences', {
          method: 'PUT',
          headers: authStorage.getAuthHeaders(),
          body: JSON.stringify({
            theme,
            useSystemTheme
          })
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            await response.json(); // Consume the response
          }
        }
      } catch (error) {
        // Silently handle API error - endpoint may not exist yet or return HTML
        console.log('Backend theme save failed, using local storage only');
      }
    }
    
    // Always save to localStorage as backup with user-specific keys
    if (currentUser) {
      const userKey = `finguard-theme-${currentUser}`;
      const userSystemKey = `finguard-system-theme-${currentUser}`;
      localStorage.setItem(userKey, theme);
      localStorage.setItem(userSystemKey, useSystemTheme ? 'true' : 'false');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    setIsSystemPreference(false);
    
    // Save preferences to backend and localStorage
    const newTheme = newDarkMode ? 'dark' : 'light';
    saveThemePreference(newTheme, false);
  };

  // Use system preference
  const enableSystemPreference = () => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
    setIsSystemPreference(true);
    
    // Save system preference
    const systemTheme = systemPrefersDark ? 'dark' : 'light';
    saveThemePreference(systemTheme, true);
  };

  // Set specific theme
  const setTheme = (theme) => {
    const darkMode = theme === 'dark';
    setIsDarkMode(darkMode);
    setIsSystemPreference(false);
    
    saveThemePreference(theme, false);
  };

  // Get current theme info
  const getThemeInfo = () => {
    return {
      isDarkMode,
      isSystemPreference,
      currentTheme: isDarkMode ? 'dark' : 'light',
      systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
  };

  // Clear user theme on logout
  const clearUserTheme = () => {
    // Reset to system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
    setIsSystemPreference(true);
  };

  const value = {
    isDarkMode,
    isSystemPreference,
    toggleDarkMode,
    enableSystemPreference,
    setTheme,
    getThemeInfo,
    clearUserTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};