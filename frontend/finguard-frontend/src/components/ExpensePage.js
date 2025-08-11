import React, { useState, useEffect } from 'react';
import { ArrowDownIcon, ExclamationTriangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Brain, WifiOff } from 'lucide-react';
import ExpenseChart from './ExpenseChart';
import RecentExpenses from './RecentExpenses';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import autoCategorizationService from '../services/autoCategorizationService';
import { useTheme } from '../contexts/ThemeContext';
import { useOfflineHandler } from '../hooks/useOfflineHandler';
import { SkeletonPage, SkeletonStatsCard, SkeletonChart, SkeletonTable } from './LoadingSkeleton';

const ExpensePage = () => {
  const { isDarkMode } = useTheme();
  const { isOnline, makeOfflineCapableRequest } = useOfflineHandler();
  const [isExpensePopupOpen, setIsExpensePopupOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [monthlySummary, setMonthlySummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(true);

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
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

  // Get predefined expense categories as fallback
  const getPredefinedExpenseCategories = () => {
    return [
      { id: 1, name: 'Food & Dining' },
      { id: 2, name: 'Groceries' },
      { id: 3, name: 'Transportation' },
      { id: 4, name: 'Entertainment' },
      { id: 5, name: 'Utilities' },
      { id: 6, name: 'Shopping' },
      { id: 7, name: 'Healthcare' },
      { id: 8, name: 'Education' },
      { id: 9, name: 'Travel' },
      { id: 10, name: 'Rent' },
      { id: 11, name: 'Insurance' },
      { id: 12, name: 'Phone & Internet' },
      { id: 13, name: 'Fuel' },
      { id: 14, name: 'Clothing' },
      { id: 15, name: 'Personal Care' },
      { id: 16, name: 'Home Maintenance' },
      { id: 17, name: 'Subscriptions' },
      { id: 18, name: 'Other Expenses' }
    ];
  };

  // Fetch all data with offline support
  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch transactions (expenses) with offline fallback
      const token = getToken();
      const transactionsResult = await makeOfflineCapableRequest({
        endpoint: 'http://localhost:5000/api/transactions',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        offlineKey: 'expenses-transactions',
        description: 'Load expenses data'
      });
      
      if (transactionsResult.data) {
        const expenseData = transactionsResult.data.filter(tx => tx.type === 'expense');
        setExpenses(expenseData);
      }

      // Use predefined expense categories only
      setCategories(getPredefinedExpenseCategories());

      // Fetch current month budgets with offline fallback
      const budgetsResult = await makeOfflineCapableRequest({
        endpoint: `http://localhost:5000/api/budgets?month=${currentMonth}&year=${currentYear}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        offlineKey: `budgets-${currentMonth}-${currentYear}`,
        description: 'Load budgets data'
      });
      
      if (budgetsResult.data) {
        setBudgets(budgetsResult.data);
      }

      // Fetch budget summary with offline fallback
      const summaryResult = await makeOfflineCapableRequest({
        endpoint: `http://localhost:5000/api/budgets/summary?month=${currentMonth}&year=${currentYear}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        offlineKey: `budget-summary-${currentMonth}-${currentYear}`,
        description: 'Load budget summary'
      });
      
      if (summaryResult.data) {
        setBudgetSummary(summaryResult.data);
      }

      // Fetch budget alerts with offline fallback
      const alertsResult = await makeOfflineCapableRequest({
        endpoint: 'http://localhost:5000/api/budgets/alerts',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        offlineKey: 'budget-alerts',
        description: 'Load budget alerts'
      });
      
      if (alertsResult.data) {
        setBudgetAlerts(alertsResult.data);
      }

      // Fetch monthly summary with offline fallback
      const monthlyResult = await makeOfflineCapableRequest({
        endpoint: `http://localhost:5000/api/summary?month=${currentMonth}&year=${currentYear}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        offlineKey: `monthly-summary-${currentMonth}-${currentYear}`,
        description: 'Load monthly summary'
      });
      
      if (monthlyResult.data) {
        setMonthlySummary(monthlyResult.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = isOnline ? 
        'Failed to load data. Please refresh the page.' :
        'Offline mode: Some data may not be current.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Get category icon based on name
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'food': '🍽️', 'dining': '🍽️', 'restaurant': '🍽️',
      'groceries': '🛒', 'grocery': '🛒', 'food shopping': '🛒',
      'transportation': '🚗', 'transport': '🚗', 'car': '🚗', 'fuel': '⛽',
      'entertainment': '🎮', 'movies': '🎬', 'games': '🎮',
      'utilities': '⚡', 'electricity': '⚡', 'water': '💧', 'gas': '🔥',
      'shopping': '🛍️', 'clothes': '👕', 'clothing': '👕',
      'healthcare': '🏥', 'medical': '🏥', 'health': '🏥',
      'education': '📚', 'books': '📚', 'course': '🎓',
      'travel': '✈️', 'vacation': '🏖️', 'hotel': '🏨',
      'rent': '🏠', 'housing': '🏠', 'home': '🏠',
      'insurance': '🛡️', 'phone': '📱', 'internet': '📡',
      'personal care': '🧴', 'care': '🧴',
      'maintenance': '🔧', 'repair': '🔧',
      'subscription': '📺', 'membership': '📺'
    };

    const categoryLower = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryLower.includes(key)) {
        return icon;
      }
    }
    return '💸'; // Default expense icon
  };

  // Get budget status for a specific category
  const getBudgetStatus = (categoryName) => {
    const budgetItem = budgetSummary.find(item => 
      item.category.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (!budgetItem) return null;

    return {
      spent: budgetItem.spent,
      limit: budgetItem.budget_limit,
      remaining: budgetItem.remaining,
      percentage: (budgetItem.spent / budgetItem.budget_limit) * 100,
      status: budgetItem.status,
      isOverBudget: budgetItem.status === 'Over Budget'
    };
  };

  // Check if category has active budget alert
  const hasActiveAlert = (categoryName) => {
    return budgetAlerts.some(alert => 
      alert.category.toLowerCase() === categoryName.toLowerCase()
    );
  };

  const openExpensePopup = () => setIsExpensePopupOpen(true);
  const closeExpensePopup = () => {
    setIsExpensePopupOpen(false);
    setFormData({ 
      category: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      description: '' 
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-suggest categories when description changes
    if (name === 'description' && value && autoCategorizationEnabled) {
      suggestCategory({ description: value, amount: formData.amount });
    }
  };

  // Get category suggestions
  const suggestCategory = (transactionData) => {
    if (!transactionData.description) {
      setCategorySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const suggestions = autoCategorizationService.getCategorysuggestions(transactionData);
      if (suggestions && suggestions.alternatives && suggestions.alternatives.length > 0) {
        setCategorySuggestions([suggestions.primary, ...suggestions.alternatives]);
        setShowSuggestions(true);
      } else {
        setCategorySuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error getting category suggestions:', error);
    }
  };

  // Apply suggested category
  const applySuggestedCategory = (suggestion) => {
    setFormData(prev => ({ ...prev, category: suggestion.category }));
    setShowSuggestions(false);
    setCategorySuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      type: 'expense',
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
    };

    try {
      const result = await makeOfflineCapableRequest({
        endpoint: '/api/transactions',
        method: 'POST',
        data: payload,
        description: `Add expense: ${formData.description || 'Expense'} - $${formData.amount}`
      });

      if (result.queued) {
        setSuccess('Expense queued - will be saved when connection is restored!');
      } else if (result.data) {
        setSuccess('Expense added successfully!');
        
        // Learn from this transaction for auto-categorization
        if (autoCategorizationEnabled) {
          try {
            autoCategorizationService.learnFromTransaction({
              description: formData.description,
              category: formData.category,
              amount: -parseFloat(formData.amount), // Negative for expenses
              date: formData.date
            });
          } catch (error) {
            console.error('Error learning from transaction:', error);
          }
        }
        
        // Check if this will trigger a budget alert
        const budgetStatus = getBudgetStatus(formData.category);
        if (budgetStatus) {
          const newTotal = budgetStatus.spent + parseFloat(formData.amount);
          if (newTotal > budgetStatus.limit) {
            setSuccess('Expense added! Budget limit exceeded - email alert will be sent.');
          }
        }
        
        closeExpensePopup();
        await fetchAllData(); // Refresh all data including budget status
      }
    } catch (error) {
      setError('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseEdit = async (id, updatedData) => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });

      if (response) {
        setSuccess('Expense updated successfully!');
        await fetchAllData(); // Refresh all data
      }
    } catch (error) {
      setError('Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    setLoading(true);
    try {
      const response = await apiCall(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Expense deleted successfully!');
        await fetchAllData(); // Refresh all data
      }
    } catch (error) {
      setError('Failed to delete expense');
    } finally {
      setLoading(false);
    }
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
        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  // Show skeleton loading for initial load
  if (loading && expenses.length === 0) {
    return <SkeletonPage />;
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        
        {/* Offline Status */}
        {!isOnline && (
          <div className="mb-4 p-4 rounded-lg flex items-center gap-2 bg-yellow-100 text-yellow-800 border border-yellow-200">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">You are currently offline. Changes will be synced when connection is restored.</span>
          </div>
        )}

        {/* Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Expense Management</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Track your spending and monitor budget limits</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Categories: {categories.length} available • Budgets: {budgets.length} set
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/budget'}
              className="bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              Manage Budgets
            </button>
            <button
              onClick={openExpensePopup}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowDownIcon className="h-5 w-5" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className={`p-6 rounded-lg shadow mb-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Monthly Summary ({currentMonth}/{currentYear})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-800">
                LKR {monthlySummary.income?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-700 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-800">
                LKR {monthlySummary.expenses?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 hover:bg-blue-50 dark:bg-blue-50 dark:hover:bg-blue-50 rounded-lg">
              <p className="text-blue-700 font-medium">Net Balance</p>
              <p className={`text-2xl font-bold ${
                monthlySummary.balance >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                LKR {monthlySummary.balance?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Alerts Section */}
        {budgetAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Active Budget Alerts ({budgetAlerts.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {budgetAlerts.map(alert => (
                <div key={alert.id} className="bg-red-100 p-3 rounded text-sm">
                  <p className="text-red-800 font-medium">
                    🚨 {alert.category} - Budget Exceeded
                  </p>
                  <p className="text-red-600 text-xs">
                    Email alert sent • Budget: LKR {parseFloat(alert.limit_amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Budget Status Grid */}
        <div className={`p-6 rounded-lg shadow mb-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Budget Status by Category</h3>
            <button 
              onClick={() => window.location.href = '/budget'}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Set Budget Limits →
            </button>
          </div>
          
          {categories.length === 0 ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p>Loading categories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const budgetStatus = getBudgetStatus(category.name);
                const hasAlert = hasActiveAlert(category.name);
                
                return (
                  <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{getCategoryIcon(category.name)}</span>
                      <span className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{category.name}</span>
                      {hasAlert && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                          Alert!
                        </span>
                      )}
                    </div>
                    
                    {budgetStatus ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Spent:</span>
                          <span className={`font-medium ${budgetStatus.isOverBudget ? 'text-red-600' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                            LKR {budgetStatus.spent.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Budget:</span>
                          <span className="font-medium text-gray-900 dark:text-white">LKR {budgetStatus.limit.toFixed(2)}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className={`flex justify-between text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span>Progress</span>
                            <span>{budgetStatus.percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                budgetStatus.isOverBudget ? 'bg-red-500' :
                                budgetStatus.percentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                            />
                          </div>
                          <p className={`text-xs ${budgetStatus.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {budgetStatus.remaining < 0 
                              ? `LKR ${Math.abs(budgetStatus.remaining).toFixed(2)} over budget`
                              : `LKR ${budgetStatus.remaining.toFixed(2)} remaining`
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No budget set</p>
                        <button 
                          onClick={() => window.location.href = '/budget'}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                        >
                          Set Budget →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Chart */}
        <ExpenseChart expenses={expenses} />

        {/* Add Expense Modal */}
        {isExpensePopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Expense</h2>
                <button 
                  onClick={closeExpensePopup}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Category * <span className="text-xs text-gray-500">({categories.length} available)</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => {
                      const budgetStatus = getBudgetStatus(cat.name);
                      return (
                        <option key={cat.id} value={cat.name}>
                          {getCategoryIcon(cat.name)} {cat.name}
                          {budgetStatus ? ` (Budget: LKR ${budgetStatus.limit.toFixed(0)})` : ' (No budget)'}
                        </option>
                      );
                    })}
                  </select>
                  {formData.category && getBudgetStatus(formData.category) && (
                    <div className="mt-2 p-2 bg-blue-50 hover:bg-blue-50 dark:bg-blue-50 dark:hover:bg-blue-50 rounded text-sm">
                      <p className="text-blue-700">
                        💰 Budget remaining: LKR {getBudgetStatus(formData.category).remaining.toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {/* AI Category Suggestions */}
                  {showSuggestions && categorySuggestions.length > 0 && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <Brain className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">AI Category Suggestions</span>
                      </div>
                      <div className="space-y-1">
                        {categorySuggestions.slice(0, 3).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => applySuggestedCategory(suggestion)}
                            className="w-full text-left px-3 py-2 bg-white dark:bg-gray-800 hover:bg-blue-100 hover:bg-blue-100 dark:bg-blue-100 dark:hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-800 dark:text-gray-100">{suggestion.category}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {Math.round((suggestion.confidence || 0) * 100)}% confidence
                              </span>
                              <span className="text-blue-600 text-xs">Apply</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoCategorizationEnabled(!autoCategorizationEnabled)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-200"
                      >
                        {autoCategorizationEnabled ? 'Disable' : 'Enable'} AI suggestions
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                  {formData.amount && formData.category && getBudgetStatus(formData.category) && (
                    <div className="mt-1">
                      {parseFloat(formData.amount) > getBudgetStatus(formData.category).remaining && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          ⚠️ This expense will exceed your budget limit! Email alert will be sent.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                  <textarea
                    name="description"
                    placeholder="What was this expense for?"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeExpensePopup}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? 'Adding...' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        {loading ? (
          <SkeletonTable rows={8} cols={5} className="mt-6" />
        ) : (
          <RecentExpenses
            expenses={expenses}
            onExpenseEdit={handleExpenseEdit}
            onExpenseDelete={handleExpenseDelete}
          />
        )}

        {/* Quick Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonStatsCard key={index} />
            ))}
          </div>
        ) : (
          <div className={`p-6 rounded-lg shadow mt-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Quick Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-700 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-800">
                {expenses.length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 hover:bg-blue-50 dark:bg-blue-50 dark:hover:bg-blue-50 rounded-lg">
              <p className="text-blue-700 font-medium">Categories Used</p>
              <p className="text-2xl font-bold text-blue-800">
                {new Set(expenses.map(e => e.category)).size}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">Budgets Set</p>
              <p className="text-2xl font-bold text-green-800">
                {budgets.length}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-orange-700 font-medium">Active Alerts</p>
              <p className="text-2xl font-bold text-orange-800">
                {budgetAlerts.length}
              </p>
            </div>
          </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default ExpensePage;