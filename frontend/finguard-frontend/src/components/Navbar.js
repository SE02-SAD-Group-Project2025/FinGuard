import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/finguard.jpg';
import { jwtDecode } from 'jwt-decode';
import { useSubscription } from '../hooks/useSubscription';
import { Bell, BellRing } from 'lucide-react';
import SmartNotificationPanel from './SmartNotificationPanel';
import smartNotificationService from '../services/smartNotificationService';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl, getApiConfig } from '../config/api';
import authStorage from '../utils/authStorage';

const Navbar = () => {
  const { isDarkMode, clearUserTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notificationStats, setNotificationStats] = useState({ unread: 0, total: 0 });
  const toggleMenu = () => setIsOpen(!isOpen);

  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, isPremium, isFamily, canAccessFeature, user, hasFamilyAccess, resetSubscriptionState } = useSubscription();

  const handleNavigation = (path) => {
    if (location.pathname === path) {
      navigate(0); // reload current page
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    authStorage.clearAuth(); // Clear all authentication data securely
    resetSubscriptionState(); // Reset subscription state on logout
    clearUserTheme(); // Reset theme to system preference
    
    // Trigger session end
    window.dispatchEvent(new Event('finguard-logout'));
    
    navigate('/');
  };

  // Handle premium feature navigation
  const handlePremiumNavigation = (path, requiredFeature = null) => {
    if (!isPremium()) {
      // Show upgrade prompt for non-premium users
      if (window.confirm('This is a premium feature. Would you like to upgrade your plan to access it?')) {
        navigate('/subscription/plans');
      }
      return;
    }
    handleNavigation(path);
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    const token = authStorage.getToken();
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl(getApiConfig().ENDPOINTS.USER.PROFILE), {
        headers: authStorage.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Initialize notification service and fetch profile data
  useEffect(() => {
    fetchUserProfile();
    initializeNotifications();
  }, [location.pathname]);

  // Initialize smart notifications
  const initializeNotifications = async () => {
    await smartNotificationService.initialize();
    updateNotificationStats();
    
    // Set up event listeners for notification updates
    smartNotificationService.on('notification-added', updateNotificationStats);
    smartNotificationService.on('notification-updated', updateNotificationStats);
    smartNotificationService.on('notifications-cleared', updateNotificationStats);
  };

  // Update notification statistics
  const updateNotificationStats = () => {
    const stats = smartNotificationService.getNotificationStats();
    setNotificationStats(stats);
  };

  // Generate dynamic profile picture
  const generateProfilePicture = (username) => {
    if (!username) return { letter: 'U', bgColor: 'bg-gray-500' };
    
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
    ];
    
    // Use username length and first character to pick a consistent color
    const colorIndex = (username.length + username.charCodeAt(0)) % colors.length;
    const bgColor = colors[colorIndex];
    
    return { letter: firstLetter, bgColor };
  };

  // Get user initials for profile picture
  const getUserInitials = (username, email) => {
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    } else if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Get user data from token (fallback) and profile API
  const token = localStorage.getItem('finguard-token');
  let username = 'User';
  let email = '';
  let role = 'User';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username || 'User';
      email = decoded.email || '';
      role = decoded.role || 'User';
    } catch (err) {
      console.error('Token decode failed:', err.message);
    }
  }

  // Use profile data if available, otherwise fall back to token data
  const displayUsername = userProfile?.username || username;
  const displayEmail = userProfile?.email || email;
  const displayRole = userProfile?.role || role;
  const profilePhoto = userProfile?.profile_photo;

  const profilePic = generateProfilePicture(displayUsername);
  const initials = getUserInitials(displayUsername, displayEmail);

  // Get role indicator
  const getRoleIndicator = (userRole) => {
    switch (userRole) {
      case 'Admin': return '👑';
      case 'Premium User': return '⭐';
      default: return '';
    }
  };

  return (
    <nav className={`shadow-lg rounded-lg overflow-hidden sticky top-0 z-50 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`} style={{ minHeight: '64px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Click = Go to dashboard */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
            <img src={logo} alt="FinGuard Logo" className="h-14 w-auto rounded-md" />
          </div>

          {/* Desktop Menu - Core Financial Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => handleNavigation('/dashboard')} 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-white hover:bg-gray-700' + (location.pathname === '/dashboard' ? ' bg-gray-700' : '') 
                  : 'text-black hover:bg-green-200' + (location.pathname === '/dashboard' ? ' bg-green-200' : '')
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavigation('/expense')} 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-white hover:bg-gray-700' + (location.pathname === '/expense' ? ' bg-gray-700' : '') 
                  : 'text-black hover:bg-green-200' + (location.pathname === '/expense' ? ' bg-green-200' : '')
              }`}
            >
              Expenses
            </button>
            <button 
              onClick={() => handleNavigation('/income')} 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-white hover:bg-gray-700' + (location.pathname === '/income' ? ' bg-gray-700' : '') 
                  : 'text-black hover:bg-green-200' + (location.pathname === '/income' ? ' bg-green-200' : '')
              }`}
            >
              Income
            </button>
            <button 
              onClick={() => handleNavigation('/budget')} 
              className={`px-3 py-2 rounded-md text-sm font-medium relative transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-white hover:bg-gray-700' + (location.pathname === '/budget' ? ' bg-gray-700' : '') 
                  : 'text-black hover:bg-green-200' + (location.pathname === '/budget' ? ' bg-green-200' : '')
              }`}
            >
              Budget
              {!isPremium() && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </button>
            <button 
              onClick={() => handleNavigation('/liabilities')} 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-white hover:bg-gray-700' + (location.pathname === '/liabilities' ? ' bg-gray-700' : '') 
                  : 'text-black hover:bg-green-200' + (location.pathname === '/liabilities' ? ' bg-green-200' : '')
              }`}
            >
              Liabilities
            </button>
          </div>

          {/* Notification Bell */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setNotificationPanelOpen(true)}
              className={`relative p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-blue-400 hover:bg-blue-900/30' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Notifications"
            >
              {notificationStats.unread > 0 ? (
                <BellRing className="w-6 h-6" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
              {notificationStats.unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {notificationStats.unread > 9 ? '9+' : notificationStats.unread}
                </span>
              )}
            </button>
            
            {/* Theme Toggle */}
            <ThemeToggle size="md" />
            
            {/* Admin Dashboard Button - Only visible to Admin users */}
            {displayRole === 'Admin' && (
              <button
                onClick={() => handleNavigation('/admin/AdminDashboard')}
                className={`relative p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-900/30' 
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
                title="Admin Dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 text-xs">👑</span>
              </button>
            )}
          </div>

          {/* User Display with Dynamic Profile Picture - Clickable */}
          <div className="flex items-center space-x-3">
            <div 
              className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-colors duration-200 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`} 
              onClick={() => setProfileSidebarOpen(!profileSidebarOpen)}
            >
              {/* Dynamic Profile Picture */}
              {profilePhoto ? (
                <div className="h-10 w-10 rounded-full relative">
                  <img 
                    src={`${getApiConfig().BASE_URL}${profilePhoto}`} 
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {/* Role indicator */}
                  {getRoleIndicator(displayRole) && (
                    <span className="absolute -top-1 -right-1 text-xs">
                      {getRoleIndicator(displayRole)}
                    </span>
                  )}
                </div>
              ) : (
                <div className={`h-10 w-10 ${profilePic.bgColor} rounded-full flex items-center justify-center text-white font-bold text-sm relative`}>
                  {initials}
                  {/* Role indicator */}
                  {getRoleIndicator(displayRole) && (
                    <span className="absolute -top-1 -right-1 text-xs">
                      {getRoleIndicator(displayRole)}
                    </span>
                  )}
                </div>
              )}
              
              {/* Username and Role */}
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{displayUsername}</span>
                {displayRole !== 'User' && (
                  <span className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{displayRole}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Profile button for mobile */}
            <div 
              className={`flex items-center space-x-2 cursor-pointer px-2 py-1 rounded-lg transition-colors duration-200 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`} 
              onClick={() => setProfileSidebarOpen(!profileSidebarOpen)}
            >
              {profilePhoto ? (
                <img 
                  src={`${getApiConfig().BASE_URL}${profilePhoto}`} 
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className={`h-8 w-8 ${profilePic.bgColor} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                  {initials}
                </div>
              )}
            </div>
            
            <button onClick={toggleMenu} className={`focus:outline-none transition-colors duration-200 ${
              isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'
            }`}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Updated with Liabilities and Reports */}
        {isOpen && (
          <div className={`md:hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-green-100'
          }`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button 
                onClick={() => handleNavigation('/dashboard')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/dashboard' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/dashboard' ? ' bg-green-200' : '')
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigation('/expense')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/expense' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/expense' ? ' bg-green-200' : '')
                }`}
              >
                Expenses
              </button>
              <button 
                onClick={() => handleNavigation('/income')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/income' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/income' ? ' bg-green-200' : '')
                }`}
              >
                Income
              </button>
              <button 
                onClick={() => handleNavigation('/liabilities')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/liabilities' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/liabilities' ? ' bg-green-200' : '')
                }`}
              >
                Liabilities
              </button>
              <button 
                onClick={() => handleNavigation('/budget')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/budget' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/budget' ? ' bg-green-200' : '')
                }`}
              >
                Budget
              </button>
              <button 
                onClick={() => handleNavigation('/reports')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/reports' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/reports' ? ' bg-green-200' : '')
                }`}
              >
                Reports
              </button>
              <button 
                onClick={() => handleNavigation('/profile')} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white hover:bg-gray-600' + (location.pathname === '/profile' ? ' bg-gray-600' : '') 
                    : 'text-black hover:bg-green-200' + (location.pathname === '/profile' ? ' bg-green-200' : '')
                }`}
              >
                Profile
              </button>
              <button 
                onClick={handleLogout} 
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-white bg-red-600 hover:bg-red-700' 
                    : 'text-black bg-green-300 hover:bg-green-400'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Sidebar */}
      {profileSidebarOpen && (
        <>
          {/* Backdrop to close sidebar when clicking outside */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40" 
            onClick={() => setProfileSidebarOpen(false)}
          ></div>
          
          {/* Sidebar */}
          <div className={`fixed right-0 top-0 h-full w-80 shadow-2xl z-50 transform transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              {/* Profile Header */}
              <div className={`flex items-center space-x-3 mb-6 pb-4 border-b transition-colors duration-300 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                {profilePhoto ? (
                  <img 
                    src={`${getApiConfig().BASE_URL}${profilePhoto}`} 
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className={`h-16 w-16 ${profilePic.bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {initials}
                  </div>
                )}
                <div>
                  <h3 className={`font-semibold text-lg ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{displayUsername}</h3>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{displayEmail}</p>
                  {displayRole !== 'User' && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {displayRole}
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                {/* Profile */}
                <button
                  onClick={() => {
                    handleNavigation('/profile');
                    setProfileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? (location.pathname === '/profile' 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                      : (location.pathname === '/profile' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>

                {/* 2FA Setup */}
                <button
                  onClick={() => {
                    handleNavigation('/2fa-setup');
                    setProfileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? (location.pathname === '/2fa-setup' 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                      : (location.pathname === '/2fa-setup' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security & 2FA
                </button>

                {/* Bug Reports & Support - Available to ALL users */}
                <button
                  onClick={() => {
                    handleNavigation('/reports');
                    setProfileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? (location.pathname === '/reports' 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                      : (location.pathname === '/reports' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 14c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Bug Reports & Support
                </button>

                {/* Upgrade Prompt for Regular Users */}
                {!isPremium() && (
                  <div className={`border-t my-4 transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className={`text-center p-3 rounded-lg mx-2 mt-4 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-gray-700' 
                        : 'bg-gradient-to-r from-blue-50 to-purple-50'
                    }`}>
                      <svg className="w-8 h-8 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <h4 className={`font-semibold text-sm mb-1 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Unlock Premium Features</h4>
                      <p className={`text-xs mb-3 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>Get AI insights, advanced analytics, and more!</p>
                      <button
                        onClick={() => {
                          handleNavigation('/subscription/plans');
                          setProfileSidebarOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                )}

                {/* Advanced Analytics - Only for Premium/Family Users */}
                {isPremium() && (
                  <button
                    onClick={() => {
                      handleNavigation('/advanced-reports');
                      setProfileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? (location.pathname === '/advanced-reports' 
                            ? 'bg-gray-700 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                        : (location.pathname === '/advanced-reports' 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Advanced Analytics
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Premium</span>
                  </button>
                )}

                {/* Premium Dashboard - Only for Premium/Family Users */}
                {isPremium() && (
                  <button
                    onClick={() => {
                      handleNavigation('/premium-dashboard');
                      setProfileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? (location.pathname === '/premium-dashboard' 
                            ? 'bg-gray-700 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                        : (location.pathname === '/premium-dashboard' 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Premium Dashboard
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Premium</span>
                  </button>
                )}

                {/* AI Budget - Only for Premium/Family Users */}
                {isPremium() && (
                  <button
                    onClick={() => {
                      handleNavigation('/ai-budget');
                      setProfileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? (location.pathname === '/ai-budget' 
                            ? 'bg-gray-700 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                        : (location.pathname === '/ai-budget' 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Budget Assistant
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">AI</span>
                  </button>
                )}

                {/* Family Management - For Premium Users or Family Members */}
                {hasFamilyAccess() && (
                  <button
                    onClick={() => {
                      handleNavigation('/family-dashboard');
                      setProfileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? (location.pathname === '/family-dashboard' 
                            ? 'bg-gray-700 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                        : (location.pathname === '/family-dashboard' 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Family Management
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Family</span>
                  </button>
                )}

                <div className={`border-t my-4 transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}></div>

                {/* Subscription */}
                <button
                  onClick={() => {
                    handleNavigation('/subscription/plans');
                    setProfileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? (location.pathname.includes('/subscription') 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                      : (location.pathname.includes('/subscription') 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  {displayRole === 'User' ? 'Upgrade Plan' : 'Subscription'}
                </button>

                <div className={`border-t my-4 transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}></div>

                {/* Logout */}
                <button
                  onClick={() => {
                    handleLogout();
                    setProfileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-red-400 hover:bg-red-900/30' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </nav>

              {/* Close Button */}
              <button
                onClick={() => setProfileSidebarOpen(false)}
                className={`absolute top-4 right-4 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Smart Notification Panel */}
      <SmartNotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;