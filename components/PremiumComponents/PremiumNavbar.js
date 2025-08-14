import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/finguard.jpg';
import profilePic from '../../assets/dp.png';


const PremiumNavbar = () => {
   const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-lg rounded-lg overflow-hidden sticky top-0 z-50" style={{ minHeight: '64px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <img src={logo} alt="FinGuard Logo" className="h-14 w-auto rounded-md" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link to="/aiBudget" className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">
              Budget
            </Link>
            <Link to="/premiumDashboard" className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </Link>
            {/* <Link to="/profile" className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">
              Profile
            </Link> */}
            <Link to="/logout" className="text-black bg-green-300 hover:bg-green-400 px-4 py-2 rounded-md text-sm font-medium">
              Logout
            </Link>
          </div>

          {/* Profile Picture and Username */}
          <div className="flex items-center space-x-2">
            <img src={profilePic} alt="User Profile" className="h-10 w-10 rounded-full" />
            <span className="text-black text-sm font-medium">User</span>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-black hover:text-gray-600 focus:outline-none">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              <Link to="/home" className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">
                Home
              </Link>
              <Link to="/budget" className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">
                Budget
              </Link>
              <Link to="/reports" className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">
                Reports
              </Link>
              <Link to="/profile" className="text-black block hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">
                Profile
              </Link>
              <Link to="/logout" className="text-black block bg-green-300 hover:bg-green-400 px-3 py-2 rounded-md text-base font-medium">
                Logout
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default PremiumNavbar
