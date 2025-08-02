import React from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import {
  BarChart3,
  Zap,
  Lightbulb,
  Edit3,
  Target,
  Settings,
  Plus,
} from 'lucide-react';

const BudgetPage = () => {
  const budgetUsed = 1200;
  const budgetTotal = 1500;
  const savings = 500;
  const savingsGoal = 1000;

  const categories = [
    { name: 'Dining', spent: 200, limit: 250, icon: '🍽️', bar: 'orange' },
    { name: 'Groceries', spent: 380, limit: 400, icon: '🛒', bar: 'red' },
    { name: 'Transportation', spent: 150, limit: 200, icon: '🚗', bar: 'orange' },
    { name: 'Entertainment', spent: 120, limit: 150, icon: '🎮', bar: 'orange' },
    { name: 'Utilities', spent: 280, limit: 300, icon: '⚡', bar: 'red' },
    { name: 'Shopping', spent: 30, limit: 200, icon: '🛍️', bar: 'green' },
  ];

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />

        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 text-left mb-6">Budget Management</h1>
              <p className="text-sm text-gray-600">Take control of your finances with AI-powered insights</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>Updated 2 min ago</span>
            </div>
          </div>

          {/* Overview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Budget Overview</h3>
                <p className="text-sm text-gray-600">Track your spending and stay on target</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Adjust Budget
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Savings Goal
                </button>
              </div>
            </div>

            <div className="text-sm font-medium mb-2">
              LKR{budgetUsed} / LKR{budgetTotal}{' '}
              <span className="text-green-600 float-right">LKR{budgetTotal - budgetUsed} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${(budgetUsed / budgetTotal) * 100}%` }} />
            </div>

            {/* Savings */}
            <div className="bg-blue-50 p-4 rounded-lg shadow-inner">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Savings Goal</span>
              </div>
              <p className="text-blue-700 font-bold text-base">LKR {savings}</p>
              <p className="text-xs text-gray-500 mb-2">of LKR {savingsGoal} saved for Sri Lanka trip</p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(savings / savingsGoal) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Category Breakdown</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2">
                <Zap className="w-4 h-4" /> AI Recommendations
              </button>
            </div>

            {categories.map((cat, i) => {
              const percent = (cat.spent / cat.limit) * 100;
              return (
                <div key={i} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{cat.name}</h4>
                        <p className="text-sm text-gray-500">
                          LKR{cat.spent} / LKR{cat.limit} • LKR{cat.limit - cat.spent} remaining
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {percent > 80 && <Lightbulb className="w-4 h-4 text-yellow-500 cursor-pointer" />}
                      <Edit3 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            percent <= 70 ? 'bg-green-500' : percent <= 90 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{percent.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Alerts & Notifications</h3>

            <div className="bg-orange-100 border-l-4 border-orange-400 p-3 text-sm text-orange-800 rounded mb-2">
              ⚠️ You're spending 2x faster on dining than last month!
              <p className="text-xs text-gray-500">Category: Dining</p>
            </div>

            <div className="bg-blue-100 border-l-4 border-blue-400 p-3 text-sm text-blue-800 rounded">
              ✅ Great job staying under budget on Transportation!
              <p className="text-xs text-gray-500">Category: Transportation</p>
            </div>

            {/* Notification Settings */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Notification Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Alert at 80% of budget</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Weekly spending summaries</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">AI optimization suggestions</span>
                </label>
              </div>
            </div>
          </div>

          {/* Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Historical Trends</h3>
            <p className="text-sm text-gray-600">Compare your spending patterns over time</p><br/>
            <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-400">
              Chart placeholder
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              <button className="px-3 py-1 rounded bg-blue-600 text-white">Monthly</button>
              <button className="px-3 py-1 rounded hover:bg-gray-200">Quarterly</button>
              <button className="px-3 py-1 rounded hover:bg-gray-200">Yearly</button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default BudgetPage;
