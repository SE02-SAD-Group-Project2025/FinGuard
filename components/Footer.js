
import React from "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-green-800 text-white pt-10 pb-4 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Description */}
        <p className="text-center text-sm md:text-base mb-6">
          Your smart financial companion that simplifies budgeting, tracks expenses,
          and helps you make data-driven financial decisions with localized insights
          for Sri Lanka.
        </p>

        {/* Social Media Icons */}
        <div className="flex justify-center gap-6 mb-10 text-2xl">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <FaFacebook className="text-white hover:text-green-400 cursor-pointer" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaTwitter className="text-white hover:text-green-400 cursor-pointer" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="text-white hover:text-green-400 cursor-pointer" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="text-white hover:text-green-400 cursor-pointer" />
          </a>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-center md:text-left">
          {/* Features */}
          <div>
            <h3 className="font-bold mb-2">Features</h3>
            <ul className="space-y-1">
              <li>AI-Powered Budgeting</li>
              <li>Smart Expense Tracking</li>
              <li>Debt Management Tools</li>
              <li>Savings Goals</li>
              <li>Bill Reminders</li>
              <li>Financial Analytics</li>
            </ul>
          </div>

          {/* Premium AI */}
          <div>
            <h3 className="font-bold mb-2">Premium AI</h3>
            <ul className="space-y-1">
              
              <li>Deep User Profiling</li>
              <li>Priority Recommendations</li>
              <li>Advance Analytics</li>
              <li>Personal AI Coach</li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-2">Company</h3>
            <ul className="space-y-1">
              <li>About Us</li>
              <li>Our Mission</li>
              <li>Careers</li>
              <li>Contact</li>
              <li>Blog</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-2">Support</h3>
            <ul className="space-y-1">
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Data Protection</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <p className="text-xs text-center mt-10 border-t border-green-600 pt-4">
          © 2025 FinGuard. All rights reserved. | Empowering financial intelligence with AI.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
