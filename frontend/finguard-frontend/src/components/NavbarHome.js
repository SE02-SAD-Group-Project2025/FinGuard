import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/finguard.jpg';

const NavbarHome = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFooter = () => {
    const footer = document.getElementById('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const scrollToComparison = () => {
    const comparisonSection = document.getElementById('comparison-table');
    if (comparisonSection) {
      comparisonSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav 
      className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-xl bg-white/98' : 'shadow-lg'
      }`} 
      style={{ minHeight: '64px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo with hover effect */}
          <div className="flex items-center">
            <Link to="/" className="group">
              <img 
                src={logo} 
                alt="FinGuard Logo" 
                className="h-14 w-auto rounded-md transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>
          </div>

          {/* Desktop Menu with improved styling */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            
            <button 
              onClick={scrollToComparison} 
              className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group"
            >
              About Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            
            <button 
              onClick={scrollToFooter} 
              className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group"
            >
              Contact Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            
            <Link 
              to="/login" 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button with improved animation */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-emerald-600 focus:outline-none p-2 rounded-lg hover:bg-emerald-50 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu with improved styling */}
        {isOpen && (
          <div className="md:hidden bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg mt-2 mb-4 border border-emerald-100 shadow-lg">
            <div className="px-4 pt-4 pb-4 space-y-2">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)} 
                className="block text-gray-700 hover:text-emerald-600 hover:bg-white px-4 py-3 rounded-lg text-base font-medium transition-all duration-300"
              >
                🏠 Home
              </Link>
              <button 
                onClick={scrollToComparison} 
                className="block w-full text-left text-gray-700 hover:text-emerald-600 hover:bg-white px-4 py-3 rounded-lg text-base font-medium transition-all duration-300"
              >
                ℹ️ About Us
              </button>
              <button 
                onClick={scrollToFooter} 
                className="block w-full text-left text-gray-700 hover:text-emerald-600 hover:bg-white px-4 py-3 rounded-lg text-base font-medium transition-all duration-300"
              >
                📞 Contact Us
              </button>
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)} 
                className="block bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg text-base font-semibold text-center shadow-lg transform transition-all duration-300 hover:shadow-xl"
              >
                🔑 Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarHome;