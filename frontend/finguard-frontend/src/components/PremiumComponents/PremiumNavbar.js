import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useSubscription } from '../../hooks/useSubscription';
import {
  Crown,
  BarChart3,
  Brain,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Star,
  TrendingUp,
  PieChart,
  Zap,
  Shield
} from 'lucide-react';
import logo from '../../assets/finguard.jpg';

const PremiumNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, isPremium, user } = useSubscription();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigation = (path) => {
    if (location.pathname === path) {
      navigate(0); // reload current page
    } else {
      navigate(path);
    }
    setIsOpen(false);
    setProfileSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('finguard-token');
    navigate('/');
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [location.pathname]);

  // Generate dynamic profile picture
  const generateProfilePicture = (username) => {
    if (!username) return { letter: 'U', bgColor: 'bg-purple-500' };
    
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];
    
    const colorIndex = (username.length + username.charCodeAt(0)) % colors.length;
    const bgColor = colors[colorIndex];
    
    return { letter: firstLetter, bgColor };
  };

  // Get user data from token
  const token = localStorage.getItem('finguard-token');
  let username = 'Premium User';
  let email = '';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = userProfile?.username || decoded.username || 'Premium User';
      email = userProfile?.email || decoded.email || '';
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  const profileInfo = generateProfilePicture(username);

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Premium Badge */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="FinGuard Logo" className="h-10 w-auto rounded-lg shadow-md" />
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-lg">FinGuard</span>
                  <div className="flex items-center bg-yellow-400 text-purple-900 px-2 py-1 rounded-full text-xs font-bold">
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Premium Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNavigation('/premium-dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/premium-dashboard'
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/ai-budget')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/ai-budget'
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium">AI Budget</span>
            </button>

            <button
              onClick={() => handleNavigation('/advanced-reports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/advanced-reports'
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span className="font-medium">Analytics</span>
            </button>

            <button
              onClick={() => handleNavigation('/family')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/family'
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Family</span>
            </button>
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            {/* Subscription Status */}
            <div className="hidden lg:flex items-center space-x-2 bg-white bg-opacity-10 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">
                {subscription?.display_name || 'Premium'}
              </span>
            </div>

            {/* Profile Button */}
            <div className="relative">
              <button
                onClick={() => setProfileSidebarOpen(!profileSidebarOpen)}
                className="flex items-center space-x-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg px-3 py-2 transition-all duration-200"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${profileInfo.bgColor} shadow-lg`}>
                  {userProfile?.profile_photo ? (
                    <img 
                      src={`http://localhost:5000${userProfile.profile_photo}`}
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    profileInfo.letter
                  )}
                </div>
                <span className="hidden sm:block text-white font-medium">{username}</span>
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${profileSidebarOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileSidebarOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${profileInfo.bgColor} shadow-lg`}>
                        {userProfile?.profile_photo ? (
                          <img 
                            src={`http://localhost:5000${userProfile.profile_photo}`}
                            alt="Profile" 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          profileInfo.letter
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{username}</p>
                        <p className="text-sm text-gray-600">{email}</p>
                        <div className="flex items-center mt-1">
                          <Crown className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-xs font-medium text-purple-600">Premium Member</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="py-2">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      Profile Settings
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/subscription/manage')}
                      className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                    >
                      <Shield className="w-4 h-4 mr-3 text-gray-500" />
                      Manage Subscription
                    </button>

                    <button
                      onClick={() => handleNavigation('/home')}
                      className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 mr-3 text-gray-500" />
                      Regular Dashboard
                    </button>

                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-white hover:text-gray-200 focus:outline-none"
            >
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

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white bg-opacity-10 backdrop-blur-sm rounded-lg m-2 mt-0">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => handleNavigation('/premium-dashboard')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Premium Dashboard</span>
              </button>
              
              <button
                onClick={() => handleNavigation('/ai-budget')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>AI Budget</span>
              </button>

              <button
                onClick={() => handleNavigation('/advanced-reports')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <PieChart className="w-4 h-4" />
                <span>Advanced Analytics</span>
              </button>

              <button
                onClick={() => handleNavigation('/family')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Family Management</span>
              </button>

              <div className="border-t border-white border-opacity-20 mt-3 pt-3">
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-red-300 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Features Indicator Bar */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-6 text-xs text-black font-medium">
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Advanced Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>Premium Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PremiumNavbar;
