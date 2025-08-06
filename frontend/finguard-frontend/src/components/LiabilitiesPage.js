// components/LiabilitiesPage.js
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { 
  CreditCard, 
  Home, 
  Car, 
  GraduationCap, 
  Building, 
  Heart, 
  FileText,
  Plus,
  Calculator,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Edit3,
  Trash2,
  PiggyBank,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';

const LiabilitiesPage = () => {
  const [liabilities, setLiabilities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayoffModal, setShowPayoffModal] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState(null);
  const [payoffScenarios, setPayoffScenarios] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    creditor: '',
    total_amount: '',
    current_balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_date: '',
    payment_frequency: 'monthly',
    start_date: '',
    target_payoff_date: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'regular',
    description: ''
  });

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

  // Get liability type icon
  const getLiabilityIcon = (type) => {
    const iconMap = {
      'credit_card': <CreditCard className="w-6 h-6" />,
      'mortgage': <Home className="w-6 h-6" />,
      'loan': <Car className="w-6 h-6" />,
      'personal_debt': <DollarSign className="w-6 h-6" />,
      'other': <FileText className="w-6 h-6" />
    };
    return iconMap[type] || <FileText className="w-6 h-6" />;
  };

  // Get liability type color
  const getLiabilityColor = (type) => {
    const colorMap = {
      'credit_card': 'bg-red-100 text-red-700 border-red-200',
      'mortgage': 'bg-blue-100 text-blue-700 border-blue-200',
      'loan': 'bg-green-100 text-green-700 border-green-200',
      'personal_debt': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'other': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colorMap[type] || colorMap['other'];
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Calculate progress percentage
  const getPayoffProgress = (total, current) => {
    if (!total || total === 0) return 0;
    return Math.max(0, ((total - current) / total) * 100);
  };

  // Fetch liabilities
  const fetchLiabilities = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiCall('/api/liabilities');
      if (data) {
        setLiabilities(data);
      }
    } catch (error) {
      console.error('Error fetching liabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const data = await apiCall('/api/liabilities/summary');
      if (data) {
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLiabilities();
    fetchSummary();
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.total_amount || formData.current_balance === '') {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.current_balance) > parseFloat(formData.total_amount)) {
      setError('Current balance cannot exceed total amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/liabilities', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          total_amount: parseFloat(formData.total_amount),
          current_balance: parseFloat(formData.current_balance),
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
          minimum_payment: formData.minimum_payment ? parseFloat(formData.minimum_payment) : null,
          due_date: formData.due_date ? parseInt(formData.due_date) : null
        })
      });

      if (response) {
        setSuccess('Liability added successfully!');
        closeAddModal();
        fetchLiabilities();
        fetchSummary();
      }
    } catch (error) {
      setError('Failed to add liability');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || !paymentData.payment_date) {
      setError('Please fill in all required payment fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/liabilities/${selectedLiability.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          ...paymentData,
          amount: parseFloat(paymentData.amount)
        })
      });

      if (response) {
        setSuccess(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully!`);
        closePaymentModal();
        fetchLiabilities();
        fetchSummary();
      }
    } catch (error) {
      setError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (liabilityId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setLoading(true);
    try {
      const response = await apiCall(`/api/liabilities/${liabilityId}`, {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Liability deleted successfully');
        fetchLiabilities();
        fetchSummary();
      }
    } catch (error) {
      setError('Failed to delete liability');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payoff scenarios
  const fetchPayoffScenarios = async (liabilityId, extraPayment = 0) => {
    try {
      const data = await apiCall(`/api/liabilities/${liabilityId}/payoff?extra_payment=${extraPayment}`);
      if (data) {
        setPayoffScenarios(data);
      }
    } catch (error) {
      console.error('Error fetching payoff scenarios:', error);
    }
  };

  // Modal controls
  const openAddModal = () => {
    setFormData({
      name: '',
      type: '',
      creditor: '',
      total_amount: '',
      current_balance: '',
      interest_rate: '',
      minimum_payment: '',
      due_date: '',
      payment_frequency: 'monthly',
      start_date: '',
      target_payoff_date: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openPaymentModal = (liability) => {
    setSelectedLiability(liability);
    setPaymentData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_type: 'regular',
      description: ''
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedLiability(null);
  };

  const openPayoffModal = (liability) => {
    setSelectedLiability(liability);
    setShowPayoffModal(true);
    fetchPayoffScenarios(liability.id);
  };

  const closePayoffModal = () => {
    setShowPayoffModal(false);
    setSelectedLiability(null);
    setPayoffScenarios(null);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
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
          {type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
            <h1 className="text-3xl font-bold text-gray-900">Debt & Liabilities</h1>
            <p className="text-gray-600 mt-1">Track and manage your debts, loans, and payment schedules</p>
            <p className="text-sm text-gray-500">
              Total liabilities: {liabilities.length} • Total debt: {summary ? formatCurrency(summary.summary.total_current_balance) : 'Loading...'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                fetchLiabilities();
                fetchSummary();
              }}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Liability
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Total Debt</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.summary.total_current_balance)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.payments_summary.total_payments)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Avg Interest Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {parseFloat(summary.summary.avg_interest_rate || 0).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Payment Count</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.payments_summary.total_payment_count}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Payments */}
        {summary && summary.upcoming_payments && summary.upcoming_payments.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Upcoming Payments</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.upcoming_payments.map(payment => (
                <div key={payment.id} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{payment.name}</span>
                    <span className="text-yellow-600 font-semibold">
                      {formatCurrency(payment.minimum_payment)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Due: Day {payment.due_date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liabilities List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Liabilities</h3>

          {loading && liabilities.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your liabilities...</p>
            </div>
          ) : liabilities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PiggyBank className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No liabilities added yet</p>
              <button 
                onClick={openAddModal}
                className="mt-2 text-red-600 hover:text-red-800"
              >
                Add your first liability
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {liabilities.map(liability => {
                const progress = getPayoffProgress(liability.total_amount, liability.current_balance);
                return (
                  <div key={liability.id} className={`border rounded-lg p-4 ${getLiabilityColor(liability.type)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          {getLiabilityIcon(liability.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{liability.name}</h4>
                          <p className="text-sm opacity-75 capitalize">
                            {liability.type.replace('_', ' ')} 
                            {liability.creditor && ` • ${liability.creditor}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openPaymentModal(liability)}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                          title="Record Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPayoffModal(liability)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                          title="Payoff Calculator"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(liability.id, liability.name)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Current Balance:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(liability.current_balance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Original Amount:</span>
                        <span className="font-medium">
                          {formatCurrency(liability.total_amount)}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Paid Off</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div className="text-xs opacity-75 space-y-1">
                        {liability.interest_rate && (
                          <p>Interest Rate: {liability.interest_rate}%</p>
                        )}
                        {liability.minimum_payment && (
                          <p>Minimum Payment: {formatCurrency(liability.minimum_payment)}</p>
                        )}
                        {liability.due_date && (
                          <p>Due Date: Day {liability.due_date} of each month</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Liability Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Liability</h2>
                <button 
                  onClick={closeAddModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Chase Credit Card"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select type</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="loan">Personal Loan</option>
                      <option value="mortgage">Mortgage</option>
                      <option value="personal_debt">Personal Debt</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Creditor/Lender
                  </label>
                  <input
                    type="text"
                    name="creditor"
                    placeholder="Bank name or person"
                    value={formData.creditor}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      placeholder="0.00"
                      value={formData.total_amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Balance *
                    </label>
                    <input
                      type="number"
                      name="current_balance"
                      placeholder="0.00"
                      value={formData.current_balance}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      name="interest_rate"
                      placeholder="0.0"
                      value={formData.interest_rate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Payment
                    </label>
                    <input
                      type="number"
                      name="minimum_payment"
                      placeholder="0.00"
                      value={formData.minimum_payment}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date (Day)
                    </label>
                    <input
                      type="number"
                      name="due_date"
                      placeholder="15"
                      value={formData.due_date}
                      onChange={handleChange}
                      min="1"
                      max="31"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Additional notes about this liability..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {loading ? 'Adding...' : 'Add Liability'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && selectedLiability && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Record Payment</h2>
                <button 
                  onClick={closePaymentModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedLiability.name}</h3>
                <p className="text-sm text-gray-600">
                  Current Balance: {formatCurrency(selectedLiability.current_balance)}
                </p>
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={paymentData.amount}
                    onChange={handlePaymentChange}
                    required
                    min="0.01"
                    max={selectedLiability.current_balance}
                    step="0.01"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={paymentData.payment_date}
                    onChange={handlePaymentChange}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    name="payment_type"
                    value={paymentData.payment_type}
                    onChange={handlePaymentChange}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="regular">Regular Payment</option>
                    <option value="minimum">Minimum Payment</option>
                    <option value="extra">Extra Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Payment description..."
                    value={paymentData.description}
                    onChange={handlePaymentChange}
                    rows="2"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {loading ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payoff Calculator Modal */}
        {showPayoffModal && selectedLiability && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Debt Payoff Calculator</h2>
                <button 
                  onClick={closePayoffModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedLiability.name}</h3>
                <p className="text-sm text-gray-600">
                  Balance: {formatCurrency(selectedLiability.current_balance)} | 
                  Interest: {selectedLiability.interest_rate || 0}% | 
                  Min Payment: {formatCurrency(selectedLiability.minimum_payment || 0)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Monthly Payment
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  onChange={(e) => fetchPayoffScenarios(selectedLiability.id, e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {payoffScenarios && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Payoff Scenarios</h3>
                  {payoffScenarios.scenarios.map((scenario, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{scenario.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>Monthly Payment: <span className="font-medium">{formatCurrency(scenario.monthly_payment)}</span></p>
                          <p>Months to Payoff: <span className="font-medium">{scenario.months_to_payoff}</span></p>
                        </div>
                        <div>
                          <p>Total Paid: <span className="font-medium">{formatCurrency(scenario.total_paid)}</span></p>
                          <p>Total Interest: <span className="font-medium text-red-600">{formatCurrency(scenario.total_interest)}</span></p>
                        </div>
                        {scenario.savings > 0 && (
                          <div className="col-span-2 pt-2 border-t">
                            <p className="text-green-600 font-medium">
                              Savings: {formatCurrency(scenario.savings)} | 
                              Time Saved: {scenario.time_saved} months
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={closePayoffModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default LiabilitiesPage;