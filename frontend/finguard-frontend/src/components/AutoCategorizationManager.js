import React, { useState, useEffect } from 'react';
import { 
  Brain, Settings, TrendingUp, Clock, CheckCircle, AlertTriangle,
  Plus, Trash2, Edit3, Search, Filter, BarChart3
} from 'lucide-react';
import autoCategorizationService from '../services/autoCategorizationService';

const AutoCategorizationManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryRules, setCategoryRules] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({ merchant: '', category: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Available categories for selection
  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Finance', 'Housing',
    'Income', 'Other'
  ];

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Set up event listeners
    autoCategorizationService.on('rule-updated', loadData);
    autoCategorizationService.on('rule-deleted', loadData);
    autoCategorizationService.on('recurring-detected', handleRecurringDetected);
    
    return () => {
      autoCategorizationService.off('rule-updated', loadData);
      autoCategorizationService.off('rule-deleted', loadData);
      autoCategorizationService.off('recurring-detected', handleRecurringDetected);
    };
  }, []);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      // Get category rules
      const rules = Array.from(autoCategorizationService.merchantPatterns.entries())
        .map(([merchant, data]) => ({ merchant, ...data }));
      setCategoryRules(rules);
      
      // Get recurring transactions
      const recurring = autoCategorizationService.getRecurringTransactions();
      setRecurringTransactions(recurring);
      
      // Get stats
      const statistics = autoCategorizationService.getCategorizationStats();
      setStats(statistics);
      
    } catch (error) {
      console.error('Error loading auto-categorization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle recurring transactions detected
  const handleRecurringDetected = (patterns) => {
    setRecurringTransactions(prev => [...prev, ...patterns]);
  };

  // Add new category rule
  const addCategoryRule = () => {
    if (!newRule.merchant || !newRule.category) return;
    
    autoCategorizationService.updateCategoryRule(newRule.merchant, newRule.category);
    setNewRule({ merchant: '', category: '' });
    loadData();
  };

  // Update existing rule
  const updateRule = (merchant, category) => {
    autoCategorizationService.updateCategoryRule(merchant, category);
    setEditingRule(null);
    loadData();
  };

  // Delete rule
  const deleteRule = (merchant) => {
    autoCategorizationService.deleteCategoryRule(merchant);
    loadData();
  };

  // Filter rules based on search and category
  const filteredRules = categoryRules.filter(rule => {
    const matchesSearch = !searchTerm || 
      rule.merchant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get frequency color
  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'weekly': return 'text-green-600 bg-green-100';
      case 'biweekly': return 'text-blue-600 bg-blue-100';
      case 'monthly': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading auto-categorization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Auto-Categorization</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>AI-Powered</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'rules', label: 'Category Rules', icon: Settings },
          { id: 'recurring', label: 'Recurring Transactions', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Category Rules</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalRules || 0}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Recurring Detected</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.recurringTransactions || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Pattern Categories</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.categoryPatterns || 0}</p>
                </div>
                <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Auto-Categorization</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• AI analyzes transaction descriptions</li>
                  <li>• Learns from your manual categorizations</li>
                  <li>• Suggests categories for new transactions</li>
                  <li>• Improves accuracy over time</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Recurring Detection</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Identifies recurring payments automatically</li>
                  <li>• Predicts next payment dates</li>
                  <li>• Helps with budget planning</li>
                  <li>• Alerts for missed payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Add New Rule */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Category Rule</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Merchant name (e.g., Starbucks)"
                value={newRule.merchant}
                onChange={(e) => setNewRule({ ...newRule, merchant: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <select
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={addCategoryRule}
                disabled={!newRule.merchant || !newRule.category}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search merchants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2">
            {filteredRules.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || selectedCategory !== 'all' ? 'No matching rules found' : 'No category rules defined yet'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Add rules to automatically categorize transactions from specific merchants
                </p>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div key={rule.merchant} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    {editingRule === rule.merchant ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={rule.merchant}
                          disabled
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        />
                        <select
                          defaultValue={rule.category}
                          onChange={(e) => updateRule(rule.merchant, e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{rule.merchant}</p>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                            {rule.category}
                          </span>
                          <span className={getConfidenceColor(rule.confidence)}>
                            {Math.round(rule.confidence * 100)}% confidence
                          </span>
                          <span>{rule.count || 1} transactions</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingRule(editingRule === rule.merchant ? null : rule.merchant)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.merchant)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recurring Transactions Tab */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          {recurringTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No recurring transactions detected yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                The AI needs at least 3 similar transactions to identify recurring patterns
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringTransactions.map((recurring) => (
                <div key={recurring.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {recurring.merchant || 'Unknown Merchant'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyColor(recurring.frequency)}`}>
                        {recurring.frequency}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(recurring.avgAmount)}
                      </p>
                      <p className={`text-xs ${getConfidenceColor(recurring.confidence)}`}>
                        {Math.round(recurring.confidence * 100)}% confident
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Category</p>
                      <p className="font-medium text-gray-900 dark:text-white">{recurring.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Interval</p>
                      <p className="font-medium text-gray-900 dark:text-white">Every {recurring.avgInterval} days</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Next Expected</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {recurring.nextExpected ? formatDate(recurring.nextExpected.date) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {recurring.transactions && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Based on {recurring.transactions.length} transactions
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recurring.transactions.slice(-5).map((transaction, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded text-xs">
                            {formatDate(transaction.date)}
                          </span>
                        ))}
                        {recurring.transactions.length > 5 && (
                          <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                            +{recurring.transactions.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {recurring.nextExpected && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Next payment expected: {formatCurrency(recurring.nextExpected.estimatedAmount)} on {formatDate(recurring.nextExpected.date)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoCategorizationManager;