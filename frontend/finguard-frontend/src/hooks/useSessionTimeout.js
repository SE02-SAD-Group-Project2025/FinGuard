import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import authStorage from '../utils/authStorage';

// Session timeout configuration (in milliseconds)
const SESSION_CONFIG = {
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes before expiry
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  EXTEND_SESSION_TIME: 15 * 60 * 1000 // Extend session by 15 minutes
};

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { warning, success } = useToast();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const activityTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // Reset session timers
  const resetSessionTimers = () => {
    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);
    setTimeLeft(0);

    // Only set timers if user is logged in
    const token = authStorage.getToken();
    if (!token) return;

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(SESSION_CONFIG.WARNING_TIME);
      
      warning('Your session will expire soon. Click to extend your session.', 'warning', 0, [
        { 
          label: 'Extend Session', 
          onClick: extendSession 
        }
      ]);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            handleSessionExpired();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

    }, SESSION_CONFIG.IDLE_TIMEOUT - SESSION_CONFIG.WARNING_TIME);

    // Set automatic logout timer
    logoutTimerRef.current = setTimeout(() => {
      handleSessionExpired();
    }, SESSION_CONFIG.IDLE_TIMEOUT);
  };

  // Handle session expiry
  const handleSessionExpired = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);
    setTimeLeft(0);
    
    // Clear user session
    authStorage.clearAuth();
    
    // Trigger logout event
    window.dispatchEvent(new Event('finguard-session-expired'));
    
    warning('Your session has expired due to inactivity. Please log in again.', 'warning', 5000);
    navigate('/login');
  };

  // Extend session
  const extendSession = () => {
    success('Session extended successfully!');
    resetSessionTimers();
  };

  // Handle user activity
  const handleUserActivity = () => {
    // Only reset if user is logged in
    const token = authStorage.getToken();
    if (token && !showWarning) {
      resetSessionTimers();
    }
  };

  // Initialize session management
  useEffect(() => {
    resetSessionTimers();

    // Activity events to monitor
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add activity listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Listen for login/logout events
    const handleLogin = () => {
      resetSessionTimers();
    };

    const handleLogout = () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setShowWarning(false);
    };

    window.addEventListener('finguard-login', handleLogin);
    window.addEventListener('finguard-logout', handleLogout);
    window.addEventListener('finguard-session-expired', handleLogout);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      window.removeEventListener('finguard-login', handleLogin);
      window.removeEventListener('finguard-logout', handleLogout);
      window.removeEventListener('finguard-session-expired', handleLogout);
      
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [navigate, warning, success]);

  // Format time left for display
  const formatTimeLeft = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeLeft: formatTimeLeft(timeLeft),
    extendSession,
    resetSessionTimers
  };
};

export default useSessionTimeout;