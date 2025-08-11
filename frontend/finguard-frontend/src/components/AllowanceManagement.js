import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit3, Trash2, Calendar, DollarSign, Clock,
  CheckCircle, AlertTriangle, Settings, TrendingUp, Award,
  Gift, Target, CreditCard, Wallet
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../contexts/ThemeContext';

const AllowanceManagement = () => {
  const { hasFamilyAccess, user } = useSubscription();
  const { isDarkMode } = useTheme();
  const [allowances, setAllowances] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newAllowance, setNewAllowance] = useState({
    memberId: '',
    amount: '',
    frequency: 'monthly',
    category: 'General Allowance',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoPayment: true,
    conditions: '',
    spendingCategories: ['Food & Dining', 'Entertainment'],
    maxSpendPerCategory: '',
    requireApproval: false,
    bonusConditions: []
  });

  // Allowance frequencies
  const frequencies = [
    { value: 'weekly', label: 'Weekly', days: 7 },
    { value: 'biweekly', label: 'Bi-weekly', days: 14 },
    { value: 'monthly', label: 'Monthly', days: 30 },
    { value: 'quarterly', label: 'Quarterly', days: 90 }
  ];

  // Allowance categories
  const allowanceCategories = [
    'General Allowance', 'Chores & Tasks', 'School Performance',
    'Savings Goal Reward', 'Special Project', 'Behavior Incentive'
  ];

  // Spending categories for restrictions
  const spendingCategories = [
    'Food & Dining', 'Entertainment', 'Shopping', 'Transportation',
    'Education', 'Healthcare', 'Personal Care', 'Gifts'
  ];

  // Get token for API calls
  const getToken = () => localStorage.getItem('finguard-token');

  // Load data on component mount
  useEffect(() => {
    if (hasFamilyAccess()) {
      loadAllowanceData();
    }
  }, [hasFamilyAccess]);

  // Load allowance and family data
  const loadAllowanceData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAllowances(),
        loadFamilyMembers()
      ]);
    } catch (error) {
      console.error('Error loading allowance data:', error);
      setError('Failed to load allowance data');
    } finally {
      setLoading(false);
    }
  };

  // Load allowances from API
  const loadAllowances = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/family/allowances', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch allowances');
      }

      const data = await response.json();
      setAllowances(data.allowances || []);
      return;
    } catch (error) {
      console.error('Error loading allowances from API:', error);
      // Fallback to mock data if API fails
    const mockAllowances = [
      {
        id: 1,
        memberId: 'child1',
        memberName: 'Emma Johnson',
        amount: 50.00,
        frequency: 'weekly',
        category: 'General Allowance',
        startDate: '2024-01-01',
        endDate: '',
        autoPayment: true,
        status: 'active',
        nextPayment: '2024-12-15',
        totalPaid: 650.00,
        conditions: 'Complete weekly chores',
        spendingCategories: ['Food & Dining', 'Entertainment'],
        maxSpendPerCategory: 25.00,
        requireApproval: false,
        currentBalance: 75.00,
        spentThisPeriod: 35.00
      },
      {
        id: 2,
        memberId: 'child2',
        memberName: 'Michael Johnson',
        amount: 75.00,
        frequency: 'monthly',
        category: 'School Performance',
        startDate: '2024-09-01',
        endDate: '2025-06-30',
        autoPayment: true,
        status: 'active',
        nextPayment: '2025-01-01',
        totalPaid: 300.00,
        conditions: 'Maintain B+ average',
        spendingCategories: ['Entertainment', 'Shopping', 'Education'],
        maxSpendPerCategory: 30.00,
        requireApproval: true,
        currentBalance: 120.00,
        spentThisPeriod: 45.00
      }
    ];
    
      setAllowances(mockAllowances);
    }
  };

  // Load family members
  const loadFamilyMembers = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/family/members', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch family members');
      }

      const data = await response.json();
      setFamilyMembers(data.members || []);
      return;
    } catch (error) {
      console.error('Error loading family members from API:', error);
      // Fallback to mock data if API fails
    const mockMembers = [
      { id: 'child1', name: 'Emma Johnson', role: 'child', age: 14, avatar: null },
      { id: 'child2', name: 'Michael Johnson', role: 'child', age: 16, avatar: null },
      { id: 'child3', name: 'Sophie Johnson', role: 'child', age: 12, avatar: null }
    ];
    
      setFamilyMembers(mockMembers);
    }
  };

  // Add new allowance
  const addAllowance = async () => {
    if (!newAllowance.memberId || !newAllowance.amount || !newAllowance.frequency) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      const allowanceData = {
        id: Date.now(),
        ...newAllowance,
        memberName: familyMembers.find(m => m.id === newAllowance.memberId)?.name || 'Unknown',
        status: 'active',
        nextPayment: calculateNextPayment(newAllowance.startDate, newAllowance.frequency),
        totalPaid: 0,
        currentBalance: 0,
        spentThisPeriod: 0
      };

      setAllowances(prev => [...prev, allowanceData]);
      setSuccess('Allowance created successfully!');
      setShowAddForm(false);
      resetForm();
      
    } catch (error) {
      setError('Failed to create allowance');
    } finally {
      setLoading(false);
    }
  };

  // Update existing allowance
  const updateAllowance = async (id, updatedData) => {
    setLoading(true);
    try {
      // Mock API call
      setAllowances(prev => 
        prev.map(allowance => 
          allowance.id === id 
            ? { ...allowance, ...updatedData }
            : allowance
        )
      );
      
      setSuccess('Allowance updated successfully!');
      setEditingAllowance(null);
      
    } catch (error) {
      setError('Failed to update allowance');
    } finally {
      setLoading(false);
    }
  };

  // Delete allowance
  const deleteAllowance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allowance?')) return;

    setLoading(true);
    try {
      // Mock API call
      setAllowances(prev => prev.filter(allowance => allowance.id !== id));
      setSuccess('Allowance deleted successfully!');
      
    } catch (error) {
      setError('Failed to delete allowance');
    } finally {
      setLoading(false);
    }
  };

  // Calculate next payment date
  const calculateNextPayment = (startDate, frequency) => {
    const start = new Date(startDate);
    const now = new Date();
    const freqData = frequencies.find(f => f.value === frequency);
    
    if (!freqData) return null;
    
    let nextPayment = new Date(start);
    while (nextPayment <= now) {
      nextPayment.setDate(nextPayment.getDate() + freqData.days);
    }
    
    return nextPayment.toISOString().split('T')[0];
  };

  // Process allowance payment
  const processPayment = async (allowanceId) => {
    const allowance = allowances.find(a => a.id === allowanceId);
    if (!allowance) return;

    setLoading(true);
    try {
      // Mock payment processing
      const updatedAllowance = {
        ...allowance,
        currentBalance: allowance.currentBalance + allowance.amount,
        totalPaid: allowance.totalPaid + allowance.amount,
        nextPayment: calculateNextPayment(allowance.nextPayment, allowance.frequency),
        lastPayment: new Date().toISOString().split('T')[0]
      };

      await updateAllowance(allowanceId, updatedAllowance);
      setSuccess(`Payment of $${allowance.amount} processed for ${allowance.memberName}`);
      
    } catch (error) {
      setError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewAllowance({
      memberId: '',
      amount: '',
      frequency: 'monthly',
      category: 'General Allowance',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      autoPayment: true,
      conditions: '',
      spendingCategories: ['Food & Dining', 'Entertainment'],
      maxSpendPerCategory: '',
      requireApproval: false,
      bonusConditions: []
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if user has permission to manage allowances
  if (!hasFamilyAccess()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Family Plan Required</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Allowance management is available for Family plan users only.
          </p>
          <button
            onClick={() => window.location.href = '/subscription/plans'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade to Family Plan
          </button>
        </div>
      </div>
    );
  }

  if (loading && allowances.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading allowance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Allowance Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Allowance</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'active', label: 'Active Allowances', icon: CheckCircle },
          { id: 'payments', label: 'Payment History', icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm'
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Monthly</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(allowances.reduce((sum, a) => sum + (a.frequency === 'monthly' ? a.amount : a.amount * 4), 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Allowances</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {allowances.filter(a => a.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Family Members</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{familyMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Due This Week</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {allowances.filter(a => {
                      const nextPayment = new Date(a.nextPayment);
                      const oneWeekFromNow = new Date();
                      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
                      return nextPayment <= oneWeekFromNow;
                    }).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <Gift className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Create New Allowance</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Set up allowance for family member</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  const duePayments = allowances.filter(a => {
                    const nextPayment = new Date(a.nextPayment);
                    return nextPayment <= new Date();
                  });
                  duePayments.forEach(allowance => processPayment(allowance.id));
                }}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Process Due Payments</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pay all overdue allowances</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Allowances Tab */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {allowances.filter(a => a.status === 'active').length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No active allowances</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Create an allowance to get started
              </p>
            </div>
          ) : (
            allowances.filter(a => a.status === 'active').map((allowance) => (
              <div key={allowance.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{allowance.memberName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{allowance.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(allowance.status)}`}>
                      {allowance.status}
                    </span>
                    <button
                      onClick={() => setEditingAllowance(allowance)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAllowance(allowance.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Amount & Frequency</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(allowance.amount)} / {allowance.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current Balance</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(allowance.currentBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Next Payment</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(allowance.nextPayment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(allowance.totalPaid)}
                    </p>
                  </div>
                </div>

                {allowance.conditions && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Conditions:</strong> {allowance.conditions}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    {allowance.autoPayment && (
                      <span className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                        Auto-pay
                      </span>
                    )}
                    {allowance.requireApproval && (
                      <span className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
                        Requires approval
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => processPayment(allowance.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'payments' && (
        <PaymentHistoryComponent allowances={allowances} isDarkMode={isDarkMode} />
      )}

      {/* Add Allowance Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Allowance</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                {/* Family Member Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Family Member *
                  </label>
                  <select
                    value={newAllowance.memberId}
                    onChange={(e) => setNewAllowance({ ...newAllowance, memberId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select a family member</option>
                    {familyMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.age} years old)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      value={newAllowance.amount}
                      onChange={(e) => setNewAllowance({ ...newAllowance, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="50.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequency *
                    </label>
                    <select
                      value={newAllowance.frequency}
                      onChange={(e) => setNewAllowance({ ...newAllowance, frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {frequencies.map(freq => (
                        <option key={freq.value} value={freq.value}>{freq.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newAllowance.category}
                    onChange={(e) => setNewAllowance({ ...newAllowance, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {allowanceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Conditions (Optional)
                  </label>
                  <textarea
                    value={newAllowance.conditions}
                    onChange={(e) => setNewAllowance({ ...newAllowance, conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="e.g., Complete weekly chores, maintain good grades"
                  />
                </div>

                {/* Settings */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoPayment"
                      checked={newAllowance.autoPayment}
                      onChange={(e) => setNewAllowance({ ...newAllowance, autoPayment: e.target.checked })}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="autoPayment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable automatic payments
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireApproval"
                      checked={newAllowance.requireApproval}
                      onChange={(e) => setNewAllowance({ ...newAllowance, requireApproval: e.target.checked })}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="requireApproval" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Require approval for spending
                    </label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addAllowance}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Allowance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Payment History Component
const PaymentHistoryComponent = ({ allowances, isDarkMode }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    generatePaymentHistory();
  }, [allowances]);

  const generatePaymentHistory = () => {
    setLoading(true);
    
    // Generate payment history based on allowances
    const history = [];
    const currentDate = new Date();
    
    allowances.forEach(allowance => {
      // Generate payments for the last 6 months
      for (let i = 0; i < 6; i++) {
        const paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, Math.floor(Math.random() * 28) + 1);
        
        if (paymentDate <= currentDate) {
          history.push({
            id: `${allowance.id}-${i}`,
            allowanceId: allowance.id,
            childName: allowance.childName,
            amount: allowance.amount,
            type: Math.random() > 0.8 ? 'bonus' : 'regular',
            status: Math.random() > 0.1 ? 'completed' : 'pending',
            date: paymentDate,
            description: Math.random() > 0.8 ? 'Bonus for excellent grades' : 'Weekly allowance',
            category: allowance.category,
            parentName: 'Dad' // Simulated parent name
          });
        }
      }
    });
    
    // Sort by date (newest first)
    const sortedHistory = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPaymentHistory(sortedHistory);
    setLoading(false);
  };

  const filteredPayments = paymentHistory.filter(payment => {
    if (filter === 'all') return true;
    if (filter === 'completed') return payment.status === 'completed';
    if (filter === 'pending') return payment.status === 'pending';
    if (filter === 'bonus') return payment.type === 'bonus';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    return type === 'bonus' 
      ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400'
      : 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className={`h-4 rounded w-1/4 mb-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                  <div className={`h-3 rounded w-1/2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`h-6 w-16 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPaid = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Payments</div>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {filteredPayments.length}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Paid</div>
          <div className="text-2xl font-bold text-green-600">
            Rs.{totalPaid.toLocaleString()}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            Rs.{pendingAmount.toLocaleString()}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>This Month</div>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {filteredPayments.filter(p => {
              const paymentMonth = new Date(p.date).getMonth();
              const currentMonth = new Date().getMonth();
              return paymentMonth === currentMonth;
            }).length}
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Payments' },
          { key: 'completed', label: 'Completed' },
          { key: 'pending', label: 'Pending' },
          { key: 'bonus', label: 'Bonus Payments' }
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === option.key
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No payment history found</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Payments will appear here once allowances are distributed
            </p>
          </div>
        ) : (
          filteredPayments.map(payment => (
            <div 
              key={payment.id} 
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {payment.childName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(payment.type)}`}>
                      {payment.type}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {payment.description}
                  </p>
                  
                  <div className={`flex items-center gap-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span>📅 {payment.date.toLocaleDateString()}</span>
                    <span>👤 Paid by {payment.parentName}</span>
                    <span>🏷️ {payment.category}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    Rs.{payment.amount.toLocaleString()}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {payment.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllowanceManagement;