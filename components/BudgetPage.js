import React, { useState } from 'react';
import Navbar from './Navbar';
import {
  Edit3,
  Lightbulb,
  Target,
  Settings,
  Plus,
  BarChart3,
  Zap,
  XCircle,
  Utensils,
  Car,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

const BudgetPage = () => {
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [budgetLimits, setBudgetLimits] = useState({
    dining: 250,
    groceries: 400,
    transportation: 200,
    entertainment: 150,
    utilities: 300,
    shopping: 200
  });

  const [savingsGoal, setSavingsGoal] = useState({
    name: 'Sri Lanka trip',
    amount: 1000,
    saved: 500
  });

  const openBudgetSettings = () => setIsBudgetSettingsOpen(true);
  const closeBudgetSettings = () => setIsBudgetSettingsOpen(false);
  const openSavingsModal = () => setIsSavingsModalOpen(true);
  const closeSavingsModal = () => setIsSavingsModalOpen(false);

  const handleLimitChange = (category, value) => {
    setBudgetLimits(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
  };

  const handleSaveBudget = () => {
    categories.forEach(cat => {
      const key = cat.name.toLowerCase().replace(' & ', '').replace(' ', '').replace('&', '');
      cat.limit = budgetLimits[key];
    });

    alert('Budget limits updated successfully!');
    closeBudgetSettings();
  };

  const handleSaveSavingsGoal = () => {
    alert('Savings goal updated successfully!');
    closeSavingsModal();
  };

  const budgetUsed = 1200;
  const budgetTotal = Object.values(budgetLimits).reduce((a, b) => a + b, 0);

  const categories = [
    { name: 'Dining', spent: 200, limit: budgetLimits.dining, icon: '🍽️', iconComponent: Utensils },
    { name: 'Groceries', spent: 380, limit: budgetLimits.groceries, icon: '🛒', iconComponent: ShoppingCart },
    { name: 'Transportation', spent: 150, limit: budgetLimits.transportation, icon: '🚗', iconComponent: Car },
    { name: 'Entertainment', spent: 120, limit: budgetLimits.entertainment, icon: '🎮', iconComponent: Target },
    { name: 'Utilities', spent: 280, limit: budgetLimits.utilities, icon: '⚡', iconComponent: Zap },
    { name: 'Shopping', spent: 30, limit: budgetLimits.shopping, icon: '🛍️', iconComponent: ShoppingCart },
  ];

  const BudgetSettingsModal = () => {
    if (!isBudgetSettingsOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold">Budget Settings</h3>
              <p className="text-gray-600 mt-1">Set your monthly budget limits for each category</p>
            </div>
            <button 
              onClick={closeBudgetSettings} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          
          <div className="space-y-6">
            {categories.map((category) => {
              const key = category.name.toLowerCase().replace(' & ', '').replace(' ', '').replace('&', '');
              const IconComponent = category.iconComponent;
              const currentLimit = budgetLimits[key];
              
              return (
                <div key={category.name} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <p className="text-sm text-gray-600">Currently spent: LKR {category.spent}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">
                        LKR {currentLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">Budget Limit (LKR)</label>
                    <input
                      type="number"
                      value={currentLimit}
                      onChange={(e) => handleLimitChange(key, e.target.value)}
                      min="0"
                      step="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Current usage display */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Current Usage</span>
                      <span>{((category.spent / currentLimit) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (category.spent / currentLimit) * 100 <= 70 
                            ? 'bg-green-500' 
                            : (category.spent / currentLimit) * 100 <= 90 
                              ? 'bg-orange-500' 
                              : 'bg-red-500'
                        }`}
                        style={{width: `${Math.min((category.spent / currentLimit) * 100, 100)}%`}}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Total Budget Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-800 font-medium">Total Monthly Budget:</span>
                <span className="font-bold text-blue-900 text-lg">
                  LKR {Object.values(budgetLimits).reduce((a, b) => a + b, 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button 
                onClick={closeBudgetSettings}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBudget}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle size={16} className="mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

    const SavingsGoalModal = () => {
    if (!isSavingsModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">Add/Edit Savings Goal</h3>
              <p className="text-sm text-gray-600">Set your savings goal and track progress</p>
            </div>
            <button onClick={closeSavingsModal} className="text-gray-500 hover:text-gray-700">
              <XCircle size={22} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Goal Name</label>
              <input
                type="text"
                value={savingsGoal.name}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Target Amount (LKR)</label>
              <input
                type="number"
                value={savingsGoal.amount}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, amount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Current Saved (LKR)</label>
              <input
                type="number"
                value={savingsGoal.saved}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, saved: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={closeSavingsModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSavingsGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-left mb-6">Budget Management</h1>
            <p className="text-sm text-gray-600">Take control of your finances with simple budget tracking</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="w-4 h-4" />
            <span>Updated 2 min ago</span>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Budget Overview</h3>
              <p className="text-sm text-gray-600">Track your spending and stay on target</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openBudgetSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Set Budget
              </button>
              <button onClick={openSavingsModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Savings Goal
              </button>
            </div>
          </div>

          <div className="text-sm font-medium mb-2">
            LKR{budgetUsed.toLocaleString()} / LKR{budgetTotal.toLocaleString()}{' '}
            <span className="text-green-600 float-right">LKR{(budgetTotal - budgetUsed).toLocaleString()} remaining</span>
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
            <p className="text-blue-700 font-bold text-base">LKR {savingsGoal.saved.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mb-2">of LKR {savingsGoal.toLocaleString()} saved for Sri Lanka trip</p>
            <div className="w-full bg-blue-200 rounded-full h-2">
            <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100)}%` }}
            />
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
                        LKR{cat.spent.toLocaleString()} / LKR{cat.limit.toLocaleString()} • LKR{(cat.limit - cat.spent).toLocaleString()} remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {percent > 80 && (
                      <div className="bg-yellow-100 p-1 rounded cursor-pointer" title="Close to budget limit">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                      </div>
                    )}
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

          <div className="bg-orange-100 border-l-4 border-orange-400 p-3 text-sm text-orange-800 rounded mb-3">
            ⚠️ You're at 95% of your Groceries budget!
            <p className="text-xs text-gray-500">Category: Groceries • LKR 380 of LKR 400 used</p>
          </div>

          <div className="bg-blue-100 border-l-4 border-blue-400 p-3 text-sm text-blue-800 rounded">
            ✅ Great job staying under budget on Transportation!
            <p className="text-xs text-gray-500">Category: Transportation • LKR 150 of LKR 200 used</p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Notification Settings</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Alert at 80% of budget</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Alert at 95% of budget</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">Weekly spending summaries</span>
              </label>
            </div>
          </div>
        </div>

        {/* Historical Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Historical Trends</h3>
          <p className="text-sm text-gray-600">Compare your spending patterns over time</p><br />
          <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Chart will appear here</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-sm">
            <button className="px-3 py-1 rounded bg-blue-600 text-white">Monthly</button>
            <button className="px-3 py-1 rounded hover:bg-gray-200">Quarterly</button>
            <button className="px-3 py-1 rounded hover:bg-gray-200">Yearly</button>
          </div>
        </div>
      </div>

      {/* Budget Settings Modal */}
      <BudgetSettingsModal />

      {/* Savings Goal Modal */}
      <SavingsGoalModal />
    </div>
  );
};

export default BudgetPage;