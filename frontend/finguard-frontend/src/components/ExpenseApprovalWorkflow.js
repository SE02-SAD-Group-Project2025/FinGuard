import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Eye, DollarSign,
  User, Calendar, Tag, MessageSquare, Send, Filter, Search,
  Trash2, ThumbsUp, ThumbsDown, Bell, CreditCard
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const ExpenseApprovalWorkflow = () => {
  const { hasFamilyAccess, user } = useSubscription();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user role from subscription data
  const userRole = user?.role?.toLowerCase()?.includes('child') ? 'child' : 'parent';

  // Load data on component mount
  useEffect(() => {
    if (hasFamilyAccess()) {
      loadApprovalData();
    }
  }, [hasFamilyAccess]);

  // Load pending approvals and history
  const loadApprovalData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPendingApprovals(),
        loadApprovalHistory()
      ]);
    } catch (error) {
      console.error('Error loading approval data:', error);
      setError('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  // Load pending approval requests
  const loadPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/family/expense-approvals/pending', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data);
      } else {
        // If endpoint doesn't exist yet, show empty array instead of mock data
        setPendingApprovals([]);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      setPendingApprovals([]);
    }
  };

  // Load approval history
  const loadApprovalHistory = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/family/expense-approvals/history', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApprovalHistory(data);
      } else {
        // If endpoint doesn't exist yet, show empty array instead of mock data
        setApprovalHistory([]);
      }
    } catch (error) {
      console.error('Error loading approval history:', error);
      setApprovalHistory([]);
    }
  };

  // Handle approval decision
  const handleApprovalDecision = async (requestId, decision, message = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch(`http://localhost:5000/api/family/expense-approvals/${requestId}/${decision}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        // Reload data to reflect changes
        await Promise.all([
          loadPendingApprovals(),
          loadApprovalHistory()
        ]);
        setSuccess(`Request ${decision} successfully`);
        setShowDetailsModal(false);
        setApprovalMessage('');
      } else {
        setError(`Failed to ${decision} request`);
      }
    } catch (error) {
      setError(`Failed to ${decision} request`);
    } finally {
      setLoading(false);
    }
  };

  // Submit expense request (for children)
  const submitExpenseRequest = async (expenseData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/family/expense-approvals', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });

      if (response.ok) {
        await loadPendingApprovals(); // Reload pending requests
        setSuccess('Expense request submitted successfully');
      } else {
        setError('Failed to submit expense request');
      }
    } catch (error) {
      setError('Failed to submit expense request');
    } finally {
      setLoading(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
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

  // Filter requests based on search and status
  const filteredRequests = (requests) => {
    return requests.filter(request => {
      const matchesSearch = !searchTerm || 
        request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  };

  // Check if user has permission
  if (!hasFamilyAccess()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Family Plan Required</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Expense approval workflows are available for Family plan users only.
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

  if (loading && pendingApprovals.length === 0 && approvalHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading approval data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CheckCircle className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expense Approvals</h2>
        </div>
        <div className="flex items-center space-x-2">
          {pendingApprovals.length > 0 && (
            <div className="flex items-center text-orange-600 bg-orange-100 px-3 py-1 rounded-full text-sm">
              <Bell className="w-4 h-4 mr-1" />
              {pendingApprovals.length} pending
            </div>
          )}
        </div>
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
          { id: 'pending', label: 'Pending Requests', count: pendingApprovals.length },
          { id: 'history', label: 'Approval History', count: approvalHistory.length }
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
            <span className="font-medium">{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        {activeTab === 'history' && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No pending approval requests</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                All expense requests are up to date
              </p>
            </div>
          ) : (
            filteredRequests(pendingApprovals).map((request) => (
              <div key={request.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{request.requesterName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(request.requestedDate)}
                        </span>
                        <span className="flex items-center">
                          <Tag className="w-3 h-3 mr-1" />
                          {request.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(request.amount)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Context */}
                <div className="bg-white dark:bg-gray-800 rounded p-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Allowance Balance</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(request.allowanceBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Monthly Spent</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(request.monthlySpent)} / {formatCurrency(request.monthlyLimit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">After This Expense</p>
                      <p className={`font-semibold ${
                        (request.monthlySpent + request.amount) > request.monthlyLimit 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatCurrency(request.monthlySpent + request.amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {request.reason && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 mb-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      <strong>Reason:</strong> {request.reason}
                    </p>
                  </div>
                )}

                {/* Budget Warning */}
                {(request.monthlySpent + request.amount) > request.monthlyLimit && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      This expense will exceed the monthly spending limit
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprovalDecision(request.id, 'rejected')}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalDecision(request.id, 'approved')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approval History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {approvalHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No approval history</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Approved and rejected requests will appear here
              </p>
            </div>
          ) : (
            filteredRequests(approvalHistory).map((request) => (
              <div key={request.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {request.status === 'approved' ? (
                        <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{request.requesterName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approverName} on {formatDate(request.approvedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(request.amount)}
                    </p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                {/* Approver Message */}
                {request.approverMessage && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      <strong>Approver Note:</strong> {request.approverMessage}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expense Request Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Request Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Request Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requester</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.requesterName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedRequest.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Category</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Merchant</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.merchant}</p>
                    </div>
                  </div>
                </div>

                {/* Approval Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Add a note about your decision..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApprovalDecision(selectedRequest.id, 'rejected', approvalMessage)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprovalDecision(selectedRequest.id, 'approved', approvalMessage)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseApprovalWorkflow;