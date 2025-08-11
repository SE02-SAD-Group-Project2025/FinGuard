import React, { useState } from "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Common button classes for footer links
  const footerButtonClass = "hover:text-green-400 transition-colors duration-300 text-left focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-green-800 rounded px-1";

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer id="footer" className="bg-green-800 text-white pt-10 pb-4 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Newsletter signup section - NEW FEATURE */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-4">Stay Updated with FinGuard</h3>
          <p className="text-green-200 mb-6">
            Get the latest financial tips and exclusive features delivered to your inbox.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" aria-label="Newsletter signup">
            <label htmlFor="newsletter-email" className="sr-only">Email address for newsletter</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-300"
              required
              aria-describedby="newsletter-description"
            />
            <p id="newsletter-description" className="sr-only">Enter your email to receive financial tips and updates</p>
            <button
              type="submit"
              className="bg-white text-green-800 font-bold px-6 py-3 rounded-lg hover:bg-green-100 transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label={isSubscribed ? 'Successfully subscribed to newsletter' : 'Subscribe to newsletter'}
            >
              {isSubscribed ? '✅ Subscribed!' : 'Subscribe'}
            </button>
          </form>
        </div>

        {/* Original Description */}
        <p className="text-center text-sm md:text-base mb-6">
          Your smart financial companion that simplifies budgeting, tracks expenses,
          and helps you make data-driven financial decisions with localized insights
          for Sri Lanka.
        </p>

        {/* Enhanced Social Media Icons - keeping original styling but adding hover animations */}
        <div className="flex justify-center gap-6 mb-10 text-2xl" role="list" aria-label="Follow us on social media">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Follow FinGuard on Facebook">
            <FaFacebook className="text-white hover:text-green-400 cursor-pointer transform hover:scale-125 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-green-800 rounded" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Follow FinGuard on Twitter">
            <FaTwitter className="text-white hover:text-green-400 cursor-pointer transform hover:scale-125 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-green-800 rounded" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Follow FinGuard on LinkedIn">
            <FaLinkedin className="text-white hover:text-green-400 cursor-pointer transform hover:scale-125 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-green-800 rounded" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Follow FinGuard on Instagram">
            <FaInstagram className="text-white hover:text-green-400 cursor-pointer transform hover:scale-125 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-green-800 rounded" />
          </a>
        </div>

        {/* Original Footer Links - keeping exact same styling */}
        <nav className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-center md:text-left" role="navigation" aria-label="Footer navigation">
          {/* Features */}
          <div>
            <h3 className="font-bold mb-2" id="features-heading">Features</h3>
            <ul className="space-y-1" aria-labelledby="features-heading">
              <li><button className={footerButtonClass} aria-label="Learn more about AI-Powered Budgeting">AI-Powered Budgeting</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Smart Expense Tracking">Smart Expense Tracking</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Debt Management Tools">Debt Management Tools</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Savings Goals">Savings Goals</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Bill Reminders">Bill Reminders</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Financial Analytics">Financial Analytics</button></li>
            </ul>
          </div>

          {/* Premium AI */}
          <div>
            <h3 className="font-bold mb-2" id="premium-ai-heading">Premium AI</h3>
            <ul className="space-y-1" aria-labelledby="premium-ai-heading">
              <li><button className={footerButtonClass} aria-label="Learn more about Deep User Profiling">Deep User Profiling</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Priority Recommendations">Priority Recommendations</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Advanced Analytics">Advanced Analytics</button></li>
              <li><button className={footerButtonClass} aria-label="Learn more about Personal AI Coach">Personal AI Coach</button></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-2" id="company-heading">Company</h3>
            <ul className="space-y-1" aria-labelledby="company-heading">
              <li><button className={footerButtonClass} aria-label="Learn more about us">About Us</button></li>
              <li><button className={footerButtonClass} aria-label="Learn about our mission">Our Mission</button></li>
              <li><button className={footerButtonClass} aria-label="View career opportunities">Careers</button></li>
              <li><button className={footerButtonClass} aria-label="Contact us">Contact</button></li>
              <li><button className={footerButtonClass} aria-label="Read our blog">Blog</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-2" id="support-heading">Support</h3>
            <ul className="space-y-1" aria-labelledby="support-heading">
              <li><button className={footerButtonClass} aria-label="Get help and support">Help Center</button></li>
              <li><button className={footerButtonClass} aria-label="Read our privacy policy">Privacy Policy</button></li>
              <li><button className={footerButtonClass} aria-label="View terms of service">Terms of Service</button></li>
              <li><button className={footerButtonClass} aria-label="Learn about data protection">Data Protection</button></li>
              <li><button className={footerButtonClass} aria-label="View cookie policy">Cookie Policy</button></li>
            </ul>
          </div>
        </nav>

        {/* Trust badges - NEW FEATURE but with original colors */}
        <div className="border-t border-green-600 pt-6 mt-8 mb-6">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-green-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🇱🇰</span>
              <span>Made in Sri Lanka</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span>4.9/5 User Rating</span>
            </div>
          </div>
        </div>

        {/* Original Bottom Line - keeping exact same styling */}
        <p className="text-xs text-center mt-10 border-t border-green-600 pt-4">
          © 2025 FinGuard. All rights reserved. | Empowering financial intelligence with AI.
        </p>
      </div>

      {/* Floating scroll-to-top button - NEW FEATURE */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center z-50"
        title="Back to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

export default Footer;