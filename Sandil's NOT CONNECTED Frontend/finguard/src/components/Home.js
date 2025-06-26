import React from 'react';
import { Link } from 'react-router-dom';
import NavbarHome from './NavbarHome';
import SLflag from '../assets/srilanka (1).png';
import Proactive from '../assets/notification.png';
import AIpowered from '../assets/robot.png';

const Home = () => {
  const scrollToWhyFinGuard = () => {
    const whyFinGuardSection = document.getElementById('why-finguard');
    if (whyFinGuardSection) {
      whyFinGuardSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarHome />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-semibold text-gray-900 text-left leading-tight">
          FinGuard – Your <br className="hidden md:inline" />
          Smarter Financial <br className="hidden md:inline" />
          Future, Powered By AI
        </h1>
        <p className="mt-6 text-lg text-gray-700 text-left">
          Take control of your money with FinGuard—the AI-driven financial assistant that
          doesn’t just track your spending, but actively helps you save, budget, and grow.
        </p>
        <div className="mt-8 flex justify-start gap-4 flex-wrap">
          <Link
            to="/signup"
            className="bg-green-200 text-green-800 font-medium px-6 py-3 rounded-md border border-green-400 hover:bg-green-300 transition"
          >
            Get Started for free
          </Link>
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              scrollToWhyFinGuard();
            }}
            className="bg-green-50 text-green-800 font-medium px-6 py-3 rounded-md border border-green-400 hover:bg-green-100 transition"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Why FinGuard Section */}
      <div id="why-finguard" className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-700">Why FinGuard?</h2>
          <p className="mt-4 text-gray-600">
            FinGuard goes beyond basic budgeting with AI that thinks ahead.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                  <img src={AIpowered} alt="AI" className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Powered</h3>
              <p className="text-gray-700 text-sm">
                Learns your spending habits to adjust budgets in real-time and provide personalized recommendations.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                  <img src={Proactive} alt="proactive" className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proactive</h3>
              <p className="text-gray-700 text-sm">
                Alerts you before you overspend with smart notifications and corrective action suggestions.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                  <img src={SLflag} alt="localized" className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Localized</h3>
              <p className="text-gray-700 text-sm">
                Sri Lanka-focused tools: LKR tracking, inflation forecasts, and cost-of-living templates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FinGuard vs. Generic Budgeting Apps Section */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-700 text-center mb-8">
            FinGuard vs. Generic Budgeting Apps
          </h2>
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

      {/* Simple Plans, Big Results Section */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-700 text-center mb-12">
            Simple Plans, Big Results
          </h2>
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Free Plan */}
            <div className="w-full max-w-xs p-6 border border-gray-300 rounded-lg bg-white shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Free</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Basic budgeting
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Expense tracking
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Standard alerts
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Basic debt tracking
                </li>
              </ul>
              <Link
                to="/signup"
                className="mt-6 inline-block bg-green-500 text-white font-medium px-4 py-2 rounded-md hover:bg-green-600 transition"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="w-full max-w-xs p-6 border border-blue-300 rounded-lg bg-blue-50 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Premium</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> AI recommendations
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Priority support
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Hyper-local insights
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✔</span> Debt optimization tools
                </li>
              </ul>
              <Link
                to="/premium"
                className="mt-6 inline-block bg-blue-500 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition">
                Try Free Trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;