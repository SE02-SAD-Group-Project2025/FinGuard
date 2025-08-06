import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavbarHome from './NavbarHome';
import Footer from './Footer';
import SLflag from '../assets/srilanka (1).png';
import Proactive from '../assets/notification.png';
import AIpowered from '../assets/robot.png';

const Home = () => {
  const [isVisible, setIsVisible] = useState({});
  const [typedText, setTypedText] = useState('');
  const fullText = 'FinGuard – Your Smarter Financial Future, Powered By AI';

  // Typing animation effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setTypedText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToWhyFinGuard = () => {
    const whyFinGuardSection = document.getElementById('why-finguard');
    if (whyFinGuardSection) {
      whyFinGuardSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToComparison = () => {
    const comparisonSection = document.getElementById('comparison-table');
    if (comparisonSection) {
      comparisonSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stats = [
    { number: '10,000+', label: 'Happy Users' },
    { number: 'LKR 50M+', label: 'Money Saved' },
    { number: '95%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'AI Support' }
  ];

  const testimonials = [
    {
      name: "Ahinsa Udani",
      role: "Software Engineer",
      text: "FinGuard helped me save LKR 200,000 in just 6 months! The AI recommendations are spot-on.",
      rating: 5
    },
    {
      name: "Ashan Fernando", 
      role: "Business Owner",
      text: "Finally, a budgeting app that understands the Sri Lankan market. Love the local insights!",
      rating: 5
    },
    {
      name: "Anitha Perera",
      role: "Teacher",
      text: "The proactive alerts saved me from overspending multiple times. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-green-50">
      <NavbarHome />

      {/* Hero Section with enhanced styling */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6">
              🚀 New: AI-Powered Financial Assistant
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              FinGuard – Your <br />
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Smarter Financial Future,
              </span> <br />
              <span className="text-emerald-700 text-3xl lg:text-4xl">Powered By AI</span>
            </h1>
            
            <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-2xl">
              Take control of your money with FinGuard—the AI-driven financial assistant that
              doesn't just track your spending, but actively helps you save, budget, and grow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/register"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Get Started for Free →
              </Link>
              <button
                onClick={scrollToWhyFinGuard}
                className="bg-white text-emerald-700 font-semibold px-8 py-4 rounded-xl border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Learn More
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>🔒 Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>📱 Works on all devices</span>
              </div>
            </div>
          </div>

          {/* Hero illustration placeholder */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">💰</span>
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-2">Smart Dashboard</h3>
                  <p className="text-emerald-600">AI-powered insights at your fingertips</p>
                </div>
              </div>
              
              {/* Floating cards animation */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Budget on track!</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-xs text-gray-600">Saved this month</p>
                    <p className="font-bold text-emerald-600">LKR15,420</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why FinGuard Section with enhanced cards */}
      <div 
        id="why-finguard" 
        className="bg-white py-20 px-6"
        data-animate
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              ✨ What makes us special
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Why FinGuard?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-16">
            FinGuard goes beyond basic budgeting with AI that thinks ahead and adapts to your lifestyle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Enhanced Cards */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-blue-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <img src={AIpowered} alt="AI" className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">🧠</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">AI Powered</h3>
              <p className="text-gray-600 leading-relaxed">
                Learns your spending habits to adjust budgets in real-time and provide personalized recommendations that actually work.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-purple-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <img src={Proactive} alt="proactive" className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">⚡</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Proactive</h3>
              <p className="text-gray-600 leading-relaxed">
                Alerts you before you overspend with smart notifications and corrective action suggestions to keep you on track.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-green-100">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <img src={SLflag} alt="localized" className="w-12 h-12 rounded-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">🌍</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Localized</h3>
              <p className="text-gray-600 leading-relaxed">
                Sri Lanka-focused tools: LKR tracking, inflation forecasts, and cost-of-living templates designed for locals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FinGuard vs. Generic Budgeting Apps Section - REVERTED to clean simple design */}
      <div id="comparison-table" className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-700 text-center mb-8">
            FinGuard vs. Generic Budgeting Apps
          </h2>
          <p className="text-center text-gray-600 mb-8">
            See why thousands choose FinGuard over traditional budgeting apps
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-4">Feature</th>
                  <th className="border border-gray-300 p-4">FinGuard</th>
                  <th className="border border-gray-300 p-4">Other Apps</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-4">AI Coaching</td>
                  <td className="border border-gray-300 p-4 text-green-600">
                    <span className="mr-2">✔</span> Dynamic, behavior-based tips
                  </td>
                  <td className="border border-gray-300 p-4 text-red-600">
                    <span className="mr-2">✘</span> Static reports
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-4">Debt Tools</td>
                  <td className="border border-gray-300 p-4 text-green-600">
                    <span className="mr-2">✔</span> Snowball/Avalanche strategies
                  </td>
                  <td className="border border-gray-300 p-4 text-red-600">
                    <span className="mr-2">✘</span> Basic tracking
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-4">Local Data</td>
                  <td className="border border-gray-300 p-4 text-green-600">
                    <span className="mr-2">✔</span> LKR inflation forecasts
                  </td>
                  <td className="border border-gray-300 p-4 text-red-600">
                    <span className="mr-2">✘</span> Region-agnostic
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-4">Proactive Alerts</td>
                  <td className="border border-gray-300 p-4 text-green-600">
                    <span className="mr-2">✔</span> Predictive spending warnings
                  </td>
                  <td className="border border-gray-300 p-4 text-red-600">
                    <span className="mr-2">✘</span> Post-spending analysis
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who've transformed their financial future
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Pricing Section */}
      <div id="pricing-section" className="bg-gradient-to-br from-emerald-50 to-green-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              Simple Plans, Big Results
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your financial goals
            </p>
          </div>
          
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Free Plan */}
            <div className="w-full max-w-sm p-8 border-2 border-gray-200 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 relative">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-2">LKR 0</div>
                <p className="text-gray-600">Perfect to get started</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="mr-3 text-emerald-500">✅</span> 
                  <span className="text-gray-700">Basic budgeting</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-emerald-500">✅</span> 
                  <span className="text-gray-700">Expense tracking</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-emerald-500">✅</span> 
                  <span className="text-gray-700">Standard alerts</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-emerald-500">✅</span> 
                  <span className="text-gray-700">Basic debt tracking</span>
                </li>
              </ul>
               
              <Link
                to="/register"
                className="w-full inline-block bg-emerald-500 text-white font-semibold px-6 py-4 rounded-xl hover:bg-emerald-600 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="w-full max-w-sm p-8 border-2 border-blue-300 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-300 relative transform scale-105">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🔥 Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6 pt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">LKR 299<span className="text-lg text-gray-600">/month</span></div>
                <p className="text-gray-600">AI-powered financial growth</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="mr-3 text-blue-500">✅</span> 
                  <span className="text-gray-700 font-medium">Everything in Free</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-500">✅</span> 
                  <span className="text-gray-700">AI recommendations</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-500">✅</span> 
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-500">✅</span> 
                  <span className="text-gray-700">Hyper-local insights</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-500">✅</span> 
                  <span className="text-gray-700">Debt optimization tools</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-500">✅</span> 
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
              </ul>
              
              <button
                onClick={() => alert('Premium trial will be available soon! Sign up for free to get notified.')}
                className="w-full inline-block bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold px-6 py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Free Trial
              </button>
              
              <p className="text-center text-xs text-gray-600 mt-3">
                14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Sri Lankans who are already building a smarter financial future with FinGuard's AI-powered insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="bg-white text-emerald-600 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Your Free Journey →
            </Link>
            <button
              onClick={scrollToComparison}
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white hover:text-emerald-600 transition-all duration-300"
            >
              See Feature Comparison
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-emerald-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-200 rounded-full"></span>
              <span>🛡️ Bank-grade security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-200 rounded-full"></span>
              <span>🆓 Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-200 rounded-full"></span>
              <span>⚡ Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remove the Footer component import since we want only one footer */}
    </div>
  );
};

export default Home;