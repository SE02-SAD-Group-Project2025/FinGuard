import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/finguard.jpg';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    if (location.pathname === path) {
      navigate(0); // reload current page
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('finguard-token');
    navigate('/');
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

  // Get user data from token
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

  const profilePic = generateProfilePicture(username);
  const initials = getUserInitials(username, email);

  // Get role indicator
  const getRoleIndicator = (userRole) => {
    switch (userRole) {
      case 'Admin': return '👑';
      case 'Premium User': return '⭐';
      default: return '';
    }
  };

  return (
    <nav className="bg-white shadow-lg rounded-lg overflow-hidden sticky top-0 z-50" style={{ minHeight: '64px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Click = Go to dashboard */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
            <img src={logo} alt="FinGuard Logo" className="h-14 w-auto rounded-md" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => handleNavigation('/dashboard')} 
              className={`text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/dashboard' ? 'bg-green-200' : ''
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavigation('/budget')} 
              className={`text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/budget' ? 'bg-green-200' : ''
              }`}
            >
              Budget
            </button>
            <button 
              onClick={() => handleNavigation('/profile')} 
              className={`text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/profile' ? 'bg-green-200' : ''
              }`}
            >
              Profile
            </button>
            <button 
              onClick={handleLogout} 
              className="text-black bg-green-300 hover:bg-green-400 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>

          {/* User Display with Dynamic Profile Picture */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {/* Dynamic Profile Picture */}
              <div className={`h-10 w-10 ${profilePic.bgColor} rounded-full flex items-center justify-center text-white font-bold text-sm relative`}>
                {initials}
                {/* Role indicator */}
                {getRoleIndicator(role) && (
                  <span className="absolute -top-1 -right-1 text-xs">
                    {getRoleIndicator(role)}
                  </span>
                )}
              </div>
              
              {/* Username and Role */}
              <div className="flex flex-col">
                <span className="text-black text-sm font-medium">{username}</span>
                {role !== 'User' && (
                  <span className="text-xs text-gray-500">{role}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-black hover:text-gray-600 focus:outline-none">
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
          <div className="md:hidden bg-green-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button 
                onClick={() => handleNavigation('/dashboard')} 
                className={`text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  location.pathname === '/dashboard' ? 'bg-green-200' : ''
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigation('/budget')} 
                className={`text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  location.pathname === '/budget' ? 'bg-green-200' : ''
                }`}
              >
                Budget
              </button>
              <button 
                onClick={() => handleNavigation('/profile')} 
                className={`text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  location.pathname === '/profile' ? 'bg-green-200' : ''
                }`}
              >
                Profile
              </button>
              <button 
                onClick={handleLogout} 
                className="block text-black bg-green-300 hover:bg-green-400 px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;