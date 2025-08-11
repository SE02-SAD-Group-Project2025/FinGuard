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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBudgetPeriods = [
        {
          id: 1,
          name: 'Weekly Groceries',
          type: 'weekly',
          amount: 8000,
          spent: 6200,
          startDate: new Date(2025, 7, 5),
          endDate: new Date(2025, 7, 11),
          description: 'Weekly grocery shopping budget',
          categories: ['Food & Dining'],
          autoRenew: true,
          isActive: true,
          daysRemaining: 3,
          percentageUsed: 77.5,
          isOverBudget: false
        },
        {
          id: 2,
          name: 'Bi-weekly Entertainment',
          type: 'bi-weekly',
          amount: 5000,
          spent: 5800,
          startDate: new Date(2025, 7, 1),
          endDate: new Date(2025, 7, 14),
          description: 'Entertainment and leisure activities',
          categories: ['Entertainment', 'Shopping'],
          autoRenew: true,
          isActive: true,
          daysRemaining: 6,
          percentageUsed: 116,
          isOverBudget: true
        },
        {
          id: 3,
          name: 'Weekly Fuel Budget',
          type: 'weekly',
          amount: 3000,
          spent: 2100,
          startDate: new Date(2025, 7, 5),
          endDate: new Date(2025, 7, 11),
          description: 'Weekly fuel and transportation',
          categories: ['Transportation'],
          autoRenew: true,
          isActive: true,
          daysRemaining: 3,
          percentageUsed: 70,
          isOverBudget: false
        },
        {
          id: 4,
          name: 'Monthly Utilities',
          type: 'monthly',
          amount: 15000,
          spent: 12500,
          startDate: new Date(2025, 7, 1),
          endDate: new Date(2025, 7, 31),
          description: 'Monthly utility bills',
          categories: ['Bills & Utilities'],
          autoRenew: true,
          isActive: true,
          daysRemaining: 23,
          percentageUsed: 83.3,
          isOverBudget: false
        },
        {
          id: 5,
          name: 'Bi-weekly Dining Out',
          type: 'bi-weekly',
          amount: 4000,
          spent: 4000,
          startDate: new Date(2025, 6, 20),
          endDate: new Date(2025, 7, 2),
          description: 'Restaurant and dining expenses',
          categories: ['Food & Dining'],
          autoRenew: false,
          isActive: false,
          daysRemaining: 0,
          percentageUsed: 100,
          isOverBudget: false
        }
      ];
      
      setBudgetPeriods(mockBudgetPeriods);
    } catch (error) {
      console.error('Error loading budget periods:', error);
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

  const handleAddPeriod = () => {
    const startDate = new Date(newPeriod.startDate);
    const endDate = calculateEndDate(startDate, newPeriod.type);
    
    const periodData = {
      ...newPeriod,
      id: Date.now(),
      amount: parseFloat(newPeriod.amount),
      spent: 0,
      startDate,
      endDate,
      daysRemaining: Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))),
      percentageUsed: 0,
      isOverBudget: false
    };
    
    setBudgetPeriods(prev => [...prev, periodData]);
    resetForm();
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

  const handleUpdatePeriod = () => {
    const startDate = new Date(newPeriod.startDate);
    const endDate = calculateEndDate(startDate, newPeriod.type);
    
    const updatedPeriod = {
      ...editingPeriod,
      ...newPeriod,
      amount: parseFloat(newPeriod.amount),
      startDate,
      endDate,
      daysRemaining: Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))),
      percentageUsed: editingPeriod.spent / parseFloat(newPeriod.amount) * 100
    };
    updatedPeriod.isOverBudget = updatedPeriod.percentageUsed > 100;
    
    setBudgetPeriods(prev => prev.map(period => 
      period.id === editingPeriod.id ? updatedPeriod : period
    ));
    
    resetForm();
  };

  const handleDeletePeriod = (periodId) => {
    setBudgetPeriods(prev => prev.filter(period => period.id !== periodId));
  };

  const togglePeriodStatus = (periodId) => {
    setBudgetPeriods(prev => prev.map(period => 
      period.id === periodId 
        ? { ...period, isActive: !period.isActive }
        : period
    ));
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