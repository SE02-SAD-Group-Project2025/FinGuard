import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
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
  CheckCircle,
  GamepadIcon,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Mail,
  Bell
} from 'lucide-react';

const BudgetPage = () => {
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for backend data
  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({ income: 0, expenses: 0, balance: 0 });
  
  // Form state for new budgets
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit_amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [savingsGoal, setSavingsGoal] = useState({
    name: 'Emergency Fund',
    amount: 50000,
    saved: 15000
  });

  // Get current month/year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get token for API calls
  const getToken = () => localStorage.getItem('finguard-token');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    if (!token) {
      setError('Please login to continue');
      return null;
    }

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      setError(`Failed to ${options.method || 'fetch'} data: ${error.message}`);
      return null;
    }
  };

  // Fetch all budget-related data
  const fetchBudgetData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch budgets for current month
      const budgetsData = await apiCall(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      if (budgetsData) setBudgets(budgetsData);

      // Fetch budget summary (spending vs limits)
      const summaryData = await apiCall(`/api/budgets/summary?month=${currentMonth}&year=${currentYear}`);
      if (summaryData) setBudgetSummary(summaryData);

      // Fetch budget alerts
      const alertsData = await apiCall('/api/budgets/alerts');
      if (alertsData) setBudgetAlerts(alertsData);

      // Fetch monthly financial summary
      const monthlyData = await apiCall(`/api/summary?month=${currentMonth}&year=${currentYear}`);
      if (monthlyData) setMonthlySummary(monthlyData);

    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBudgetData();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Modal controls
  const openBudgetSettings = () => setIsBudgetSettingsOpen(true);
  const closeBudgetSettings = () => {
    setIsBudgetSettingsOpen(false);
    setNewBudget({
      category: '',
      limit_amount: '',
      month: currentMonth,
      year: currentYear
    });
  };
  const openSavingsModal = () => setIsSavingsModalOpen(true);
  const closeSavingsModal = () => setIsSavingsModalOpen(false);

  // Handle adding new budget
  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.limit_amount) {
      setError('Please fill in all budget fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: newBudget.category,
          limit_amount: parseFloat(newBudget.limit_amount),
          month: newBudget.month,
          year: newBudget.year
        })
      });

      if (response) {
        setSuccess(`Budget for ${newBudget.category} added successfully!`);
        closeBudgetSettings();
        fetchBudgetData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to add budget');
    } finally {
      setLoading(false);
    }
  };

  // Handle updating existing budget
  const handleUpdateBudget = async (budgetId, updatedData) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });

      if (response) {
        setSuccess('Budget updated successfully!');
        fetchBudgetData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting budget
  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Budget deleted successfully!');
        fetchBudgetData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to delete budget');
    } finally {
      setLoading(false);
    }
  };

  // Save savings goal (for now just local state)
  const handleSaveSavingsGoal = () => {
    setSuccess('Savings goal updated successfully!');
    closeSavingsModal();
  };

  // Available categories for budgets
  const availableCategories = [
    'Food & Dining',
    'Groceries',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Other'
  ];

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': '🍽️',
      'Groceries': '🛒',
      'Transportation': '🚗',
      'Entertainment': '🎮',
      'Utilities': '⚡',
      'Shopping': '🛍️',
      'Healthcare': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Other': '📝'
    };
    return icons[category] || '📝';
  };

  // Message Alert Component
  const MessageAlert = ({ message, type }) => {
    if (!message) return null;
    
    return (
      <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
        type === 'error' 
          ? 'bg-red-100 text-red-800 border border-red-200' 
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  // Budget Settings Modal
  const BudgetSettingsModal = () => {
    if (!isBudgetSettingsOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold">Budget Management</h3>
              <p className="text-gray-600 mt-1">Add and manage your monthly budget limits</p>
            </div>
            <button 
              onClick={closeBudgetSettings} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          
          {/* Add New Budget Form */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Add New Budget</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={newBudget.category}
                onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Budget Limit (LKR)"
                value={newBudget.limit_amount}
                onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                value={newBudget.month}
                onChange={(e) => setNewBudget({...newBudget, month: parseInt(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleAddBudget}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Budget
              </button>
            </div>
          </div>

          {/* Existing Budgets List */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Current Budgets ({budgets.length})</h4>
            
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No budgets set for this month</p>
                <p className="text-sm">Add your first budget above</p>
              </div>
            ) : (
              budgets.map((budget) => (
                <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(budget.category)}</span>
                      <div>
                        <h5 className="font-medium text-gray-900">{budget.category}</h5>
                        <p className="text-sm text-gray-600">
                          Budget: LKR {parseFloat(budget.limit_amount).toLocaleString()}
                        </p>
                        {budget.alert_triggered && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Mail className="w-3 h-3 mr-1" />
                            Alert Sent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Savings Goal Modal
  const SavingsGoalModal = () => {
    if (!isSavingsModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">Savings Goal</h3>
              <p className="text-sm text-gray-600">Set and track your savings target</p>
            </div>
            <button onClick={closeSavingsModal} className="text-gray-500 hover:text-gray-700">
              <XCircle size={22} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 block mb-1">Goal Name</label>
              <input
                type="text"
                value={savingsGoal.name}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Target Amount (LKR)</label>
              <input
                type="number"
                value={savingsGoal.amount}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, amount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Current Saved (LKR)</label>
              <input
                type="number"
                value={savingsGoal.saved}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, saved: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                LKR {Math.max(savingsGoal.amount - savingsGoal.saved, 0).toLocaleString()} remaining
              </p>
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
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />

        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Global Messages */}
          <MessageAlert message={error} type="error" />
          <MessageAlert message={success} type="success" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 text-left mb-2">Budget Management</h1>
              <p className="text-sm text-gray-600">Track spending, set limits, and receive smart alerts</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>Updated now</span>
            </div>
          </div>

          {/* Monthly Overview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Monthly Overview</h3>
                <p className="text-sm text-gray-600">
                  {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={openBudgetSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Manage Budgets
                </button>
                <button 
                  onClick={openSavingsModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Target className="w-4 h-4" /> Savings Goal
                </button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-green-800">
                      LKR {monthlySummary.income.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-800">
                      LKR {monthlySummary.expenses.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${monthlySummary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${monthlySummary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      Net Balance
                    </p>
                    <p className={`text-2xl font-bold ${monthlySummary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      LKR {monthlySummary.balance.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className={`w-8 h-8 ${monthlySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </div>

            {/* Savings Goal Display */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">{savingsGoal.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-blue-700 font-bold text-lg">LKR {savingsGoal.saved.toLocaleString()}</p>
                <p className="text-sm text-gray-600">of LKR {savingsGoal.amount.toLocaleString()}</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100)}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((savingsGoal.saved / savingsGoal.amount) * 100).toFixed(1)}% complete
              </p>
            </div>
          </div>

          {/* Budget vs Spending Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Budget vs Spending</h3>
              <button 
                onClick={fetchBudgetData}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading budget data...</p>
              </div>
            ) : budgetSummary.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No budgets set for this month</p>
                <button 
                  onClick={openBudgetSettings}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Set your first budget
                </button>
              </div>
            ) : (
              budgetSummary.map((item, i) => {
                const percent = item.budget_limit > 0 ? (item.spent / item.budget_limit) * 100 : 0;
                const isOverBudget = item.status === 'Over Budget';
                
                return (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.category}</h4>
                          <p className="text-sm text-gray-500">
                            LKR {item.spent.toFixed(2)} / LKR {item.budget_limit.toLocaleString()} 
                            {item.remaining >= 0 ? (
                              <span className="text-green-600"> • LKR {item.remaining.toFixed(2)} remaining</span>
                            ) : (
                              <span className="text-red-600"> • LKR {Math.abs(item.remaining).toFixed(2)} over budget</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverBudget && (
                          <div className="bg-red-100 p-1 rounded cursor-pointer" title="Over budget - Alert triggered">
                            <Bell className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {percent > 80 && !isOverBudget && (
                          <div className="bg-yellow-100 p-1 rounded cursor-pointer" title="Close to budget limit">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                          </div>
                        )}
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          isOverBudget ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isOverBudget ? 'bg-red-500' : percent <= 70 ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Alerts */}
          {budgetAlerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Active Budget Alerts ({budgetAlerts.length})
              </h3>

              {budgetAlerts.map((alert) => (
                <div key={alert.id} className="bg-red-100 border-l-4 border-red-400 p-3 text-sm text-red-800 rounded mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">🚨 Budget Alert: {alert.category}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Alert triggered for {new Date(alert.created_at || Date.now()).toLocaleDateString()} • 
                        Email notification sent
                      </p>
                    </div>
                    <Mail className="w-4 h-4 text-red-600" />
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Email Notification Settings</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Send email when budget exceeded</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Send email at 80% of budget</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Weekly budget summaries</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* General Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Insights</h3>

            {/* Dynamic insights based on data */}
            {budgetSummary.some(item => item.status === 'Over Budget') && (
              <div className="bg-red-100 border-l-4 border-red-400 p-3 text-sm text-red-800 rounded mb-3">
                💡 You have exceeded budgets in {budgetSummary.filter(item => item.status === 'Over Budget').length} categories this month
                <p className="text-xs text-gray-500 mt-1">Consider reviewing your spending in these areas</p>
              </div>
            )}

            {monthlySummary.balance < 0 && (
              <div className="bg-orange-100 border-l-4 border-orange-400 p-3 text-sm text-orange-800 rounded mb-3">
                ⚠️ Your expenses exceed your income by LKR {Math.abs(monthlySummary.balance).toLocaleString()} this month
                <p className="text-xs text-gray-500 mt-1">Consider reducing expenses or increasing income</p>
              </div>
            )}

            {budgetSummary.some(item => item.status === 'Within Budget') && (
              <div className="bg-green-100 border-l-4 border-green-400 p-3 text-sm text-green-800 rounded mb-3">
                ✅ Great job! You're staying within budget in {budgetSummary.filter(item => item.status === 'Within Budget').length} categories
                <p className="text-xs text-gray-500 mt-1">Keep up the good spending habits</p>
              </div>
            )}

            {budgets.length === 0 && (
              <div className="bg-blue-100 border-l-4 border-blue-400 p-3 text-sm text-blue-800 rounded mb-3">
                💡 Set up budgets to track your spending and receive alerts when you're close to limits
                <p className="text-xs text-gray-500 mt-1">
                  <button 
                    onClick={openBudgetSettings}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Create your first budget
                  </button>
                </p>
              </div>
            )}

            {/* AI Recommendations Button */}
            <div className="mt-4 text-center">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 mx-auto">
                <Zap className="w-5 h-5" /> 
                Get AI-Powered Recommendations
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Analyze your spending patterns and get personalized advice
              </p>
            </div>
          </div>

          {/* Historical Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Spending Trends</h3>
            <p className="text-sm text-gray-600 mb-4">Track your spending patterns over time</p>
            
            <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Spending Analytics Coming Soon</p>
                <p className="text-sm mt-2">
                  Current month: {budgetSummary.length} categories tracked
                </p>
                <p className="text-sm">
                  Total budgets: LKR {budgetSummary.reduce((sum, item) => sum + item.budget_limit, 0).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2 text-sm">
              <button className="px-3 py-1 rounded bg-blue-600 text-white">Monthly</button>
              <button className="px-3 py-1 rounded hover:bg-gray-200">Quarterly</button>
              <button className="px-3 py-1 rounded hover:bg-gray-200">Yearly</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={openBudgetSettings}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <Settings className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900">Manage Budgets</h4>
                <p className="text-sm text-gray-600">Add, edit, or delete budget categories</p>
              </button>
              
              <button 
                onClick={() => window.location.href = '/expense'}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <Plus className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900">Add Expense</h4>
                <p className="text-sm text-gray-600">Record a new expense transaction</p>
              </button>
              
              <button 
                onClick={fetchBudgetData}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <RefreshCw className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-medium text-gray-900">Refresh Data</h4>
                <p className="text-sm text-gray-600">Update budget and spending information</p>
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <BudgetSettingsModal />
        <SavingsGoalModal />
      </div>
    </AnimatedPage>
  );
};

export default BudgetPage;