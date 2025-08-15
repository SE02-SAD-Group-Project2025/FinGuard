import React, { useState, useEffect } from 'react';
import { ArrowDownIcon, ExclamationTriangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Brain, WifiOff, XCircle } from 'lucide-react';
import ExpenseChart from './ExpenseChart';
import RecentExpenses from './RecentExpenses';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import autoCategorizationService from '../services/autoCategorizationService';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';
import { SkeletonPage, SkeletonStatsCard, SkeletonChart, SkeletonTable } from './LoadingSkeleton';
import SpendingPatternAnalysis from './SpendingPatternAnalysis';
import AnomalyDetection from './AnomalyDetection';
import BudgetOverflowModal from './BudgetOverflowModal';

const ExpensePage = () => {
  const { isDarkMode } = useTheme();
  const { isPremium } = useSubscription();
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
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    budget_limit: '',
    budget_period: 'monthly'
  });
  
  // Budget overflow states
  const [showOverflowModal, setShowOverflowModal] = useState(false);
  const [overflowData, setOverflowData] = useState(null);

  // Child allowance states
  const [childAllowanceStatus, setChildAllowanceStatus] = useState(null);

  // Month/Year Selection State - Always default to current date
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Use selected month/year for API calls
  const currentMonth = selectedMonth;
  const currentYear = selectedYear;

  // Get token for API calls
  const getToken = () => {
    return localStorage.getItem('finguard-token') || localStorage.getItem('token');
  };

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

  // Fetch child allowance status
  const fetchChildAllowanceStatus = async () => {
    try {
      const result = await apiCall('/api/transactions/child-allowance-status');
      if (result) {
        setChildAllowanceStatus(result);
      }
    } catch (error) {
      console.error('Error fetching child allowance status:', error);
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

  // Fetch all data 
  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      // Fetch transactions (expenses)
      const transactionsResponse = await fetch(`http://localhost:5000/api/transactions?month=${currentMonth}&year=${currentYear}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        // Handle new API response format
        const transactions = transactionsData.transactions || transactionsData;
        const expenseData = transactions.filter(tx => tx.type === 'expense');
        setExpenses(expenseData);
      }

      // Use predefined expense categories only
      setCategories(getPredefinedExpenseCategories());

      // Fetch current month budgets
      const budgetsResponse = await fetch(`http://localhost:5000/api/budgets?month=${currentMonth}&year=${currentYear}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (budgetsResponse.ok) {
        const budgets = await budgetsResponse.json();
        setBudgets(budgets);
      }

      // Fetch budget summary
      const summaryResponse = await fetch(`http://localhost:5000/api/budgets/summary?month=${currentMonth}&year=${currentYear}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        console.log('Budget Summary Data:', summary); // Debug log
        setBudgetSummary(summary);
      }

      // Fetch budget alerts
      const alertsResponse = await fetch('http://localhost:5000/api/budgets/alerts', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (alertsResponse.ok) {
        const alerts = await alertsResponse.json();
        setBudgetAlerts(alerts);
      }

      // Fetch monthly summary
      const monthlyResponse = await fetch(`http://localhost:5000/api/summary?month=${currentMonth}&year=${currentYear}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (monthlyResponse.ok) {
        const monthly = await monthlyResponse.json();
        setMonthlySummary(monthly);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = 'Failed to load data. Please refresh the page.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }

    // Always fetch child allowance status (silently)
    fetchChildAllowanceStatus();
  };

  // Load data on component mount and when month/year changes
  useEffect(() => {
    fetchAllData();
  }, [selectedMonth, selectedYear]);

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

  // Handle budget creation from modal
  const handleCreateBudget = async () => {
    if (!budgetFormData.budget_limit) {
      setError('Please enter a budget limit');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: budgetFormData.category,
          limit_amount: parseFloat(budgetFormData.budget_limit),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });

      if (response.ok) {
        setSuccess(`Budget created for ${budgetFormData.category}: Rs.${parseFloat(budgetFormData.budget_limit).toLocaleString()}`);
        setShowBudgetModal(false);
        
        // Now process the pending expense
        if (pendingExpense) {
          await processPendingExpense();
        }
        
        // Refresh budget data
        await fetchAllData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create budget');
      }
    } catch (error) {
      setError('Failed to create budget');
      console.error('Budget creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process the pending expense after budget creation
  const processPendingExpense = async () => {
    if (!pendingExpense) return;

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pendingExpense)
      });

      if (response.ok) {
        const newTransaction = await response.json();
        setSuccess('Budget created and expense added successfully!');
        
        // Update challenge progress
        try {
          if (token) {
            await fetch('http://localhost:5000/api/challenges/update-progress', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                transactionType: 'expense',
                amount: pendingExpense.amount,
                category: pendingExpense.category,
                date: pendingExpense.date
              })
            });
          }
        } catch (error) {
          console.error('Error updating challenge progress:', error);
        }
        
        closeBudgetModal();
        // Refresh the page data
        fetchAllData();
      } else {
        const errorData = await response.json();
        setError(`Failed to add expense: ${errorData.error}`);
      }
    } catch (error) {
      setError('Budget created but failed to add expense');
      console.error('Pending expense processing error:', error);
    } finally {
      setPendingExpense(null);
    }
  };

  // Close budget modal
  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setPendingExpense(null);
    setBudgetFormData({
      category: '',
      budget_limit: '',
      budget_period: 'monthly'
    });
  };

  // Budget overflow handlers
  const handleOverflowTransferComplete = (transferResult) => {
    console.log('✅ Budget transfer completed:', transferResult);
    const transfer = transferResult.transfer;
    setSuccess(
      `✅ Budget transfer completed! LKR ${transfer.transfer_amount} transferred from ${transfer.from_category} to ${transfer.to_category}.`
    );
    
    // Refresh all data after successful transfer
    fetchAllData();
    
    setOverflowData(null);
    setShowOverflowModal(false);
  };

  const handleOverflowModalClose = () => {
    setOverflowData(null);
    setShowOverflowModal(false);
  };

  // Handle budget transfer selection
  const handleBudgetTransferSelection = async (overflow) => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Fetch available budgets for transfer
      const response = await fetch(`http://localhost:5000/api/budget-transfers/available-budgets?excludeCategory=${overflow.category}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const availableBudgets = data.availableBudgets || [];
        
        if (availableBudgets.length === 0) {
          window.alert('❌ No other categories have available budget for transfer.');
          return;
        }
        
        // Create selection prompt with available categories
        let selectionText = `💰 Available Categories for Transfer:\n\n`;
        availableBudgets.forEach((budget, index) => {
          selectionText += `${index + 1}. ${budget.category} - LKR ${budget.remaining_amount.toFixed(2)} available\n`;
        });
        selectionText += `\nEnter the number (1-${availableBudgets.length}) to select a category, or 0 to cancel:`;
        
        const selection = window.prompt(selectionText);
        const selectedIndex = parseInt(selection) - 1;
        
        if (selectedIndex >= 0 && selectedIndex < availableBudgets.length) {
          const selectedBudget = availableBudgets[selectedIndex];
          
          if (selectedBudget.remaining_amount < overflow.amount) {
            window.alert(`❌ Insufficient budget in ${selectedBudget.category}.\nAvailable: LKR ${selectedBudget.remaining_amount.toFixed(2)}\nRequired: LKR ${overflow.amount.toFixed(2)}`);
            return;
          }
          
          // Perform the budget transfer
          await performBudgetTransfer(overflow, selectedBudget.category);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching available budgets:', error);
      window.alert('❌ Failed to load available categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Perform the actual budget transfer
  const performBudgetTransfer = async (overflow, fromCategory) => {
    try {
      setLoading(true);
      const token = getToken();
      
      const transferData = {
        overflowId: overflow.overflowId,
        fromCategory: fromCategory,
        toCategory: overflow.category,
        transferAmount: overflow.amount,
        reason: `Budget overflow reallocation from ${fromCategory} to ${overflow.category}`
      };

      const response = await fetch('http://localhost:5000/api/budget-transfers/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transferData)
      });

      if (response.ok) {
        const result = await response.json();
        window.alert(`✅ Budget Transfer Completed!\n\nLKR ${overflow.amount.toFixed(2)} transferred from ${fromCategory} to ${overflow.category}.\n\nYour budgets have been rebalanced automatically.`);
        
        // Refresh data
        fetchAllData();
      } else {
        const error = await response.text();
        window.alert(`❌ Transfer failed: ${error}`);
      }
    } catch (error) {
      console.error('❌ Budget transfer error:', error);
      window.alert('❌ Failed to complete budget transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if budget limit exists for this category
    const budgetStatus = getBudgetStatus(formData.category);
    if (!budgetStatus) {
      // No budget limit exists - show budget creation modal
      setPendingExpense({
        type: 'expense',
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
      });
      setBudgetFormData({
        category: formData.category,
        budget_limit: '',
        budget_period: 'monthly'
      });
      setShowBudgetModal(true);
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
      const token = getToken();
      console.log('🔍 Submitting expense:', payload);
      console.log('🔍 Token available:', !!token);
      
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Transaction result:', result);
        
        // Enhanced overflow handling with proper transfer interface
        if (result.budgetOverflow && result.budgetOverflow.requiresTransfer) {
          console.log('🚨 Budget overflow detected:', result.budgetOverflow);
          setOverflowData(result.budgetOverflow);
          setShowOverflowModal(true);
          setIsExpensePopupOpen(false); // Close the expense form
          setLoading(false);
          return; // Don't proceed with normal success handling yet
        }
        
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

        // Update challenge progress based on this expense
        try {
          const token = localStorage.getItem('finguard-token');
          if (token) {
            await fetch('http://localhost:5000/api/challenges/update-progress', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                transactionType: 'expense',
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date
              })
            });
          }
        } catch (error) {
          console.error('Error updating challenge progress:', error);
          // Don't fail the expense submission if challenge update fails
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
      } else {
        const errorData = await response.json();
        
        // Handle child spending limit exceeded (403 status)
        if (response.status === 403 && errorData.limitExceeded) {
          setError(`❌ ${errorData.message || 'Spending limit exceeded!'}`);
          console.log('🚫 Child spending limit exceeded:', errorData);
        } else {
          setError(errorData.error || 'Failed to add expense');
        }
      }
    } catch (error) {
      console.error('❌ Error adding expense:', error);
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
        
        {/* Offline Status - Removed for now */}

        {/* Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
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
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • 
              Categories: {categories.length} • Budgets: {budgets.length}
            </p>
          </div>
          
          {/* Month/Year Selector */}
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              View Data For:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
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

        {/* Child Allowance Status - Only show for child users */}
        {childAllowanceStatus && childAllowanceStatus.isChild && (
          <div className={`p-6 rounded-lg shadow mb-6 transition-colors duration-300 border-l-4 ${
            childAllowanceStatus.limitExceeded 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
              : childAllowanceStatus.utilizationPercentage > 80 
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-green-500 bg-green-50 dark:bg-green-900/20'
          } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                💰 Monthly Allowance Status
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                childAllowanceStatus.limitExceeded 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
              }`}>
                {childAllowanceStatus.familyGroup}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Monthly Limit
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rs.{childAllowanceStatus.monthlyLimit?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Spent This Month
                </p>
                <p className={`text-xl font-bold ${
                  childAllowanceStatus.limitExceeded ? 'text-red-600' : 'text-blue-600'
                }`}>
                  Rs.{childAllowanceStatus.currentSpent?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Remaining
                </p>
                <p className={`text-xl font-bold ${
                  childAllowanceStatus.remaining <= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  Rs.{Math.max(0, childAllowanceStatus.remaining || 0).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Usage: {childAllowanceStatus.utilizationPercentage}%
                </span>
                {childAllowanceStatus.limitExceeded && (
                  <span className="text-sm font-medium text-red-600">
                    ⚠️ Limit Exceeded
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    childAllowanceStatus.limitExceeded 
                      ? 'bg-red-500' 
                      : childAllowanceStatus.utilizationPercentage > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, parseFloat(childAllowanceStatus.utilizationPercentage || 0))}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Warning Messages */}
            {childAllowanceStatus.limitExceeded && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900/30 dark:border-red-700">
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  🚫 You have exceeded your monthly allowance limit. Please contact your parent/guardian for approval before making more purchases.
                </p>
              </div>
            )}
            
            {!childAllowanceStatus.limitExceeded && childAllowanceStatus.utilizationPercentage > 80 && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg dark:bg-yellow-900/30 dark:border-yellow-700">
                <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                  ⚠️ You're approaching your spending limit. Only Rs.{childAllowanceStatus.remaining?.toLocaleString()} remaining.
                </p>
              </div>
            )}
          </div>
        )}

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

        {/* AI Analytics for Expenses - Admin and Premium Users Only */}
        {isPremium() && (
          <>
            {/* AI Spending Pattern Analysis */}
            <div className="mt-8">
              <SpendingPatternAnalysis />
            </div>

            {/* AI Anomaly Detection */}
            <div className="mt-8">
              <AnomalyDetection />
            </div>
          </>
        )}

        {/* Budget Creation Modal */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`p-6 rounded-2xl max-w-md w-full mx-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Add Budget Limit First
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create a budget for "{budgetFormData.category}" before adding expenses
                  </p>
                </div>
                <button
                  onClick={closeBudgetModal}
                  className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.category}
                    disabled
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-300' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Monthly Budget Limit (Rs.)
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.budget_limit}
                    onChange={(e) => setBudgetFormData({...budgetFormData, budget_limit: e.target.value})}
                    placeholder="e.g., 25000"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Budget Period
                  </label>
                  <select
                    value={budgetFormData.budget_period}
                    onChange={(e) => setBudgetFormData({...budgetFormData, budget_period: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {pendingExpense && (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      Pending Expense:
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      Rs.{pendingExpense.amount.toLocaleString()} - {pendingExpense.description || 'No description'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  onClick={closeBudgetModal}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBudget}
                  disabled={loading || !budgetFormData.budget_limit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Budget & Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Budget Overflow Modal */}
        <BudgetOverflowModal
          overflowData={overflowData}
          isOpen={showOverflowModal}
          onClose={handleOverflowModalClose}
          onTransferComplete={handleOverflowTransferComplete}
        />
      </div>
    </AnimatedPage>
  );
};

export default ExpensePage;