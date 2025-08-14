import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/finguard.jpg';

const NavbarHome = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const scrollToFooter = () => {
    const footer = document.getElementById('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

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
          <div className="hidden md:flex items-center space-x-9">
            <Link to="/home" className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            <button onClick={scrollToFooter} className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">About Us</button>
            <button onClick={scrollToFooter} className="text-black hover:bg-green-200 px-3 py-2 rounded-md text-sm font-medium">Contact Us</button>
            <Link to="/logout" className="text-black bg-green-300 hover:bg-green-400 px-4 py-2 rounded-md text-sm font-medium">Login</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-black hover:text-gray-600 focus:outline-none"
              aria-label="Toggle menu"
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
          <div className="md:hidden bg-green-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/home" onClick={() => setIsOpen(false)} className="block text-black hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">Home</Link>
              <button onClick={scrollToFooter} className="block text-black hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">About Us</button>
              <button onClick={scrollToFooter} className="block text-black hover:bg-green-200 px-3 py-2 rounded-md text-base font-medium">Contact Us</button>
              <Link to="/logout" onClick={() => setIsOpen(false)} className="block text-black bg-green-300 hover:bg-green-400 px-3 py-2 rounded-md text-base font-medium">Login</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarHome;
