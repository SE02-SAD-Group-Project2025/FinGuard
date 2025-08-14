import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, AlertCircle, Plus, Edit3, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const CustomBudgetPeriods = () => {
  const { isDarkMode } = useTheme();
  const [budgetPeriods, setBudgetPeriods] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const [newPeriod, setNewPeriod] = useState({
    name: '',
    type: 'weekly',
    amount: '',
    startDate: '',
    description: '',
    categories: [],
    autoRenew: true,
    isActive: true
  });

  useEffect(() => {
    loadBudgetPeriods();
  }, []);

  const loadBudgetPeriods = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/custom-budgets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Custom budget periods loaded:', data);
        
        // Transform backend data to match frontend format
        const transformedPeriods = data.periods.map(period => {
          const startDate = new Date(period.startDate);
          const endDate = new Date(period.endDate);
          const now = new Date();
          
          // Calculate period type based on duration
          const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          let type = 'custom';
          if (durationDays <= 1) type = 'daily';
          else if (durationDays <= 7) type = 'weekly';
          else if (durationDays <= 14) type = 'bi-weekly';
          else if (durationDays <= 31) type = 'monthly';
          else if (durationDays <= 92) type = 'quarterly';
          
          return {
            id: period.id,
            name: period.name,
            type: type,
            amount: period.totalBudget,
            spent: period.totalSpent,
            startDate: startDate,
            endDate: endDate,
            description: period.description || '',
            categories: Array.isArray(period.categories) ? period.categories : Object.keys(period.categories || {}),
            autoRenew: true, // Default since backend doesn't track this yet
            isActive: period.isActive,
            daysRemaining: period.daysRemaining,
            percentageUsed: period.percentageUsed,
            isOverBudget: period.isOverBudget
          };
        });
        
        setBudgetPeriods(transformedPeriods);
      } else {
        console.error('Failed to load budget periods:', response.status, response.statusText);
        // Fall back to empty array on error
        setBudgetPeriods([]);
      }
    } catch (error) {
      console.error('Error loading budget periods:', error);
      setBudgetPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const periodTypes = [
    { value: 'daily', label: 'Daily', duration: 1 },
    { value: 'weekly', label: 'Weekly', duration: 7 },
    { value: 'bi-weekly', label: 'Bi-weekly', duration: 14 },
    { value: 'monthly', label: 'Monthly', duration: 30 },
    { value: 'quarterly', label: 'Quarterly', duration: 90 },
    { value: 'custom', label: 'Custom Period', duration: 0 }
  ];

  const categories = [
    'Food & Dining',
    'Shopping',
    'Entertainment',
    'Transportation',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Personal Care',
    'Travel',
    'Investments'
  ];

  const getStatusColor = (period) => {
    if (!period.isActive) return 'text-gray-500';
    if (period.isOverBudget) return 'text-red-600';
    if (period.percentageUsed > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (period) => {
    if (period.isOverBudget) return 'bg-red-500';
    if (period.percentageUsed > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatPeriodDates = (startDate, endDate) => {
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const calculateEndDate = (startDate, type) => {
    const start = new Date(startDate);
    const periodType = periodTypes.find(p => p.value === type);
    if (periodType && periodType.duration > 0) {
      const end = new Date(start);
      end.setDate(start.getDate() + periodType.duration - 1);
      return end;
    }
    return start;
  };

  const handleAddPeriod = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const startDate = new Date(newPeriod.startDate);
      const endDate = calculateEndDate(startDate, newPeriod.type);
      
      const requestData = {
        name: newPeriod.name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        total_budget: parseFloat(newPeriod.amount),
        categories: newPeriod.categories,
        description: newPeriod.description
      };

      const response = await fetch('http://localhost:5000/api/custom-budgets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        console.log('✅ Budget period created successfully');
        await loadBudgetPeriods(); // Refresh the list
        resetForm();
      } else {
        console.error('Failed to create budget period:', response.status);
      }
    } catch (error) {
      console.error('Error creating budget period:', error);
    }
  };

  const handleEditPeriod = (period) => {
    setEditingPeriod(period);
    setNewPeriod({
      name: period.name,
      type: period.type,
      amount: period.amount.toString(),
      startDate: period.startDate.toISOString().split('T')[0],
      description: period.description,
      categories: period.categories,
      autoRenew: period.autoRenew,
      isActive: period.isActive
    });
    setShowAddModal(true);
  };

  const handleUpdatePeriod = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const startDate = new Date(newPeriod.startDate);
      const endDate = calculateEndDate(startDate, newPeriod.type);
      
      const requestData = {
        name: newPeriod.name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        total_budget: parseFloat(newPeriod.amount),
        categories: newPeriod.categories,
        description: newPeriod.description,
        status: newPeriod.isActive ? 'active' : 'inactive'
      };

      const response = await fetch(`http://localhost:5000/api/custom-budgets/${editingPeriod.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        console.log('✅ Budget period updated successfully');
        await loadBudgetPeriods(); // Refresh the list
        resetForm();
      } else {
        console.error('Failed to update budget period:', response.status);
      }
    } catch (error) {
      console.error('Error updating budget period:', error);
    }
  };

  const handleDeletePeriod = async (periodId) => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/custom-budgets/${periodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Budget period deleted successfully');
        await loadBudgetPeriods(); // Refresh the list
      } else {
        console.error('Failed to delete budget period:', response.status);
      }
    } catch (error) {
      console.error('Error deleting budget period:', error);
    }
  };

  const togglePeriodStatus = async (periodId) => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const period = budgetPeriods.find(p => p.id === periodId);
      if (!period) return;

      const requestData = {
        name: period.name,
        start_date: period.startDate.toISOString().split('T')[0],
        end_date: period.endDate.toISOString().split('T')[0],
        total_budget: period.amount,
        categories: period.categories,
        description: period.description,
        status: period.isActive ? 'inactive' : 'active'
      };

      const response = await fetch(`http://localhost:5000/api/custom-budgets/${periodId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        console.log('✅ Budget period status updated successfully');
        await loadBudgetPeriods(); // Refresh the list
      } else {
        console.error('Failed to update budget period status:', response.status);
      }
    } catch (error) {
      console.error('Error updating budget period status:', error);
    }
  };

  const resetForm = () => {
    setNewPeriod({
      name: '',
      type: 'weekly',
      amount: '',
      startDate: '',
      description: '',
      categories: [],
      autoRenew: true,
      isActive: true
    });
    setEditingPeriod(null);
    setShowAddModal(false);
  };

  const filteredPeriods = budgetPeriods.filter(period => {
    if (activeTab === 'active') return period.isActive;
    if (activeTab === 'inactive') return !period.isActive;
    if (activeTab === 'overbudget') return period.isOverBudget;
    return true;
  });

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Custom Budget Periods
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create flexible budget periods beyond monthly cycles
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Period
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Periods</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {budgetPeriods.filter(p => p.isActive).length}
              </p>
            </div>
            <Clock className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Budget</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Rs. {budgetPeriods.filter(p => p.isActive).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Spent</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Rs. {budgetPeriods.filter(p => p.isActive).reduce((sum, p) => sum + p.spent, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Over Budget</p>
              <p className="text-2xl font-bold text-red-600">
                {budgetPeriods.filter(p => p.isOverBudget).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'active', label: 'Active', count: budgetPeriods.filter(p => p.isActive).length },
          { id: 'inactive', label: 'Inactive', count: budgetPeriods.filter(p => !p.isActive).length },
          { id: 'overbudget', label: 'Over Budget', count: budgetPeriods.filter(p => p.isOverBudget).length },
          { id: 'all', label: 'All Periods', count: budgetPeriods.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Budget Periods List */}
      <div className="space-y-4">
        {filteredPeriods.map((period) => (
          <div key={period.id} className={`p-5 rounded-lg border transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center flex-1">
                <div className={`p-2 rounded-lg mr-4 ${
                  period.isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-600'
                }`}>
                  <Calendar className={`w-5 h-5 ${getStatusColor(period)}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {period.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        period.type === 'weekly' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                        period.type === 'bi-weekly' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                        period.type === 'monthly' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {periodTypes.find(p => p.value === period.type)?.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        period.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {period.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {period.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-4">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatPeriodDates(period.startDate, period.endDate)}
                      </span>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {period.daysRemaining} days remaining
                      </span>
                      {period.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {period.categories.slice(0, 2).map(category => (
                            <span key={category} className={`px-2 py-1 rounded-full text-xs ${
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {category}
                            </span>
                          ))}
                          {period.categories.length > 2 && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              +{period.categories.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => togglePeriodStatus(period.id)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          period.isActive
                            ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                        }`}
                      >
                        {period.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditPeriod(period)}
                        className={`p-1 rounded transition-colors ${
                          isDarkMode 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeletePeriod(period.id)}
                        className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Budget Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rs. {period.spent.toLocaleString()} / Rs. {period.amount.toLocaleString()}
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(period)}`}>
                        {period.percentageUsed.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(period)}`}
                        style={{ width: `${Math.min(period.percentageUsed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {period.isOverBudget && (
                    <div className="mt-2 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Over budget by Rs. {(period.spent - period.amount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPeriods.length === 0 && (
        <div className="text-center py-12">
          <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Budget Periods Found
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your first custom budget period to get started with flexible budgeting.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Budget Period
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingPeriod ? 'Edit Budget Period' : 'Add New Budget Period'}
              </h3>
              <button
                onClick={resetForm}
                className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Period Name
                </label>
                <input
                  type="text"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({...newPeriod, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Weekly Groceries"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Period Type
                  </label>
                  <select
                    value={newPeriod.type}
                    onChange={(e) => setNewPeriod({...newPeriod, type: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {periodTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Budget Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={newPeriod.amount}
                    onChange={(e) => setNewPeriod({...newPeriod, amount: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod({...newPeriod, startDate: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Categories (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newPeriod.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPeriod({...newPeriod, categories: [...newPeriod.categories, category]});
                          } else {
                            setNewPeriod({...newPeriod, categories: newPeriod.categories.filter(c => c !== category)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={newPeriod.description}
                  onChange={(e) => setNewPeriod({...newPeriod, description: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="3"
                  placeholder="Describe this budget period..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPeriod.autoRenew}
                    onChange={(e) => setNewPeriod({...newPeriod, autoRenew: e.target.checked})}
                    className="mr-2"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Auto-renew period
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPeriod.isActive}
                    onChange={(e) => setNewPeriod({...newPeriod, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start immediately
                  </span>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button
                onClick={resetForm}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={editingPeriod ? handleUpdatePeriod : handleAddPeriod}
                disabled={!newPeriod.name || !newPeriod.amount || !newPeriod.startDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                {editingPeriod ? 'Update Period' : 'Create Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomBudgetPeriods;