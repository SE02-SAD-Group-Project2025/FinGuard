import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import IncomeGraph from './IncomeGraph';
import RecentIncomeSources from './RecentIncomeSources';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';

const IncomePage = () => {
  const [isIncomePopupOpen, setIsIncomePopupOpen] = useState(false);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [monthlySummary, setMonthlySummary] = useState({ income: 0, expenses: 0, balance: 0 });

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

  // Get predefined income categories as fallback
  const getPredefinedIncomeCategories = () => {
    return [
      { id: 1, name: 'Salary' },
      { id: 2, name: 'Freelance' },
      { id: 3, name: 'Business Income' },
      { id: 4, name: 'Investment Returns' },
      { id: 5, name: 'Rental Income' },
      { id: 6, name: 'Bonus' },
      { id: 7, name: 'Commission' },
      { id: 8, name: 'Side Hustle' },
      { id: 9, name: 'Gift Money' },
      { id: 10, name: 'Refund' },
      { id: 11, name: 'Other Income' }
    ];
  };

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

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch transactions (incomes)
      const transactionsData = await apiCall('/api/transactions');
      if (transactionsData) {
        const incomeData = transactionsData
          .filter(tx => tx.type === 'income')
          .map(income => ({
            ...income,
            icon: getIncomeIcon(income.category),
            color: getIncomeColor(income.category)
          }));
        setIncomes(incomeData);
      }

      // Use predefined income categories only
      setCategories(getPredefinedIncomeCategories());

      // Fetch monthly summary
      const summaryData = await apiCall(`/api/summary?month=${currentMonth}&year=${currentYear}`);
      if (summaryData) {
        setMonthlySummary(summaryData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please refresh the page.');
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

  // Get income icon based on category name
  const getIncomeIcon = (categoryName) => {
    if (!categoryName) return '💰';
    
    const iconMap = {
      'salary': '💼', 'primary income': '💼', 'job': '💼', 'employment': '💼',
      'freelance': '💻', 'secondary income': '💻', 'side hustle': '💻',
      'business': '🏢', 'company': '🏢', 'enterprise': '🏢',
      'investment': '📈', 'dividend': '📊', 'stocks': '📈', 'crypto': '₿',
      'rental': '🏠', 'property': '🏠', 'real estate': '🏠',
      'bonus': '🎁', 'commission': '💰', 'tip': '💵',
      'pension': '👴', 'retirement': '👴', 'social security': '🏛️',
      'grant': '🎓', 'scholarship': '🎓', 'award': '🏆',
      'refund': '💸', 'cashback': '💳', 'rebate': '💰',
      'gift': '🎁', 'other': '💰', 'miscellaneous': '💰'
    };

    const categoryLower = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryLower.includes(key)) {
        return icon;
      }
    }
    return '💰'; // Default income icon
  };

  // Get income color based on category name
  const getIncomeColor = (categoryName) => {
    if (!categoryName) return 'green';
    
    const colorMap = {
      'salary': 'blue', 'primary income': 'blue', 'job': 'blue',
      'freelance': 'purple', 'secondary income': 'purple', 'side hustle': 'purple',
      'business': 'indigo', 'company': 'indigo', 'enterprise': 'indigo',
      'investment': 'emerald', 'dividend': 'emerald', 'stocks': 'emerald',
      'rental': 'orange', 'property': 'orange', 'real estate': 'orange',
      'bonus': 'yellow', 'commission': 'yellow', 'tip': 'yellow',
      'gift': 'pink', 'refund': 'cyan', 'cashback': 'teal'
    };

    const categoryLower = categoryName.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (categoryLower.includes(key)) {
        return color;
      }
    }
    return 'green'; // Default income color
  };

  const openIncomePopup = () => setIsIncomePopupOpen(true);
  const closeIncomePopup = () => {
    setIsIncomePopupOpen(false);
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
      type: 'income',
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
    };

    try {
      const response = await apiCall('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response) {
        setSuccess('Income added successfully!');
        closeIncomePopup();
        await fetchAllData(); // Refresh all data
      }
    } catch (error) {
      setError('Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeEdit = async (id, updatedData) => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });

      if (response) {
        setSuccess('Income updated successfully!');
        await fetchAllData(); // Refresh all data
      }
    } catch (error) {
      setError('Failed to update income');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income?')) return;

    setLoading(true);
    try {
      const response = await apiCall(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Income deleted successfully!');
        await fetchAllData(); // Refresh all data
      }
    } catch (error) {
      setError('Failed to delete income');
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
        <span className="flex-shrink-0">
          {type === 'error' ? '⚠️' : '✅'}
        </span>
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        
        {/* Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
            <p className="text-gray-600 mt-1">Track your income sources and monitor earnings</p>
            <p className="text-sm text-gray-500">
              Categories: {categories.length} available • Total income entries: {incomes.length}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={openIncomePopup}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowUpIcon className="h-5 w-5" />
              Add Income
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary ({currentMonth}/{currentYear})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Total Income</span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                LKR {monthlySummary.income?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpIcon className="h-5 w-5 text-red-600 rotate-180" />
                <span className="text-red-700 font-medium">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-800">
                LKR {monthlySummary.expenses?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">Net Balance</span>
              </div>
              <p className={`text-2xl font-bold ${
                monthlySummary.balance >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                LKR {monthlySummary.balance?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Income Categories Overview */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Categories Overview</h3>
          
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Loading categories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const categoryIncomes = incomes.filter(income => 
                  income.category.toLowerCase() === category.name.toLowerCase()
                );
                const totalAmount = categoryIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
                
                return (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{getIncomeIcon(category.name)}</span>
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Earned:</span>
                        <span className="font-medium text-green-600">
                          LKR {totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Entries:</span>
                        <span className="font-medium text-gray-900">{categoryIncomes.length}</span>
                      </div>
                      
                      {categoryIncomes.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Avg: LKR {(totalAmount / categoryIncomes.length).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Graph */}
        <IncomeGraph incomes={incomes} />

        {/* Add Income Modal */}
        {isIncomePopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Income</h2>
                <button 
                  onClick={closeIncomePopup}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category * <span className="text-xs text-gray-500">({categories.length} available)</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {getIncomeIcon(cat.name)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    placeholder="What is this income from?"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeIncomePopup}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? 'Adding...' : 'Add Income'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recent Income Sources */}
        <RecentIncomeSources
          incomes={incomes}
          onIncomeEdit={handleIncomeEdit}
          onIncomeDelete={handleIncomeDelete}
        />

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">Total Income Entries</p>
              <p className="text-2xl font-bold text-green-800">
                {incomes.length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700 font-medium">Categories Used</p>
              <p className="text-2xl font-bold text-blue-800">
                {new Set(incomes.map(i => i.category)).size}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-700 font-medium">This Month</p>
              <p className="text-2xl font-bold text-purple-800">
                LKR {monthlySummary.income?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-orange-700 font-medium">Average Income</p>
              <p className="text-2xl font-bold text-orange-800">
                LKR {incomes.length > 0 ? 
                  (incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0) / incomes.length).toLocaleString() : 
                  '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default IncomePage;