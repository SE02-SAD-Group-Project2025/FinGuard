import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/finguard.jpg';
import profilePic from '../assets/dp.png';
import { jwtDecode } from 'jwt-decode';



const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    if (location.pathname === path) {
      navigate(0);
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const token = localStorage.getItem('finguard-token');
  let username = 'User';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username || 'User';
    } catch (err) {
      console.error('Token decode failed:', err.message);
    }
  }

  return (
    <nav className="bg-white shadow-lg rounded-lg overflow-hidden sticky top-0 z-50" style={{ minHeight: '64px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('/')}> 
            <img src={logo} alt="FinGuard Logo" className="h-14 w-auto rounded-md" />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => handleNavigation('/')} className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">Home</button>
            <button onClick={() => handleNavigation('/budget')} className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">Budget</button>
            <button onClick={() => handleNavigation('/dashboard')} className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">Dashboard</button>
            <button onClick={() => handleNavigation('/profile')} className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">Profile</button>
            <Link to="/logout" className="text-black bg-green-300 hover:bg-green-400 px-4 py-2 rounded-md text-sm font-medium">Logout</Link>
          </div>

          <div className="flex items-center space-x-2">
            <img src={profilePic} alt="User Profile" className="h-10 w-10 rounded-full" />
            <span className="text-black text-sm font-medium">{username}</span>
          </div>

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

        {isOpen && (
          <div className="md:hidden bg-green-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => handleNavigation('/')} className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">Home</button>
              <button onClick={() => handleNavigation('/budget')} className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">Budget</button>
              <button onClick={() => handleNavigation('/dashboard')} className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">Dashboard</button>
              <button onClick={() => handleNavigation('/profile')} className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">Profile</button>
              <Link to="/logout" className="block text-black bg-green-300 hover:bg-green-400 px-3 py-2 rounded-md text-base font-medium">Logout</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
