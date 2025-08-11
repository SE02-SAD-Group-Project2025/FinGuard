import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import {
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SubscriptionManagement = () => {
  const [subscription, setSubscription] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
      throw error;
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/subscriptions/current');
      if (response.success) {
        setSubscription(response.subscription);
        setFamilyMembers(response.subscription.family_members || []);
      }
    } catch (error) {
      if (error.message.includes('404')) {
        setError('No active subscription found. Please subscribe to a plan first.');
        navigate('/subscription/plans');
      } else {
        setError(`Failed to load subscription: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);
    try {
      const response = await apiCall('/api/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });

      if (response.success) {
        setSuccess(response.message);
        setShowCancelModal(false);
        await fetchSubscriptionData(); // Refresh data
      }
    } catch (error) {
      setError(`Failed to cancel subscription: ${error.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' },
      cancelled: { color: 'bg-yellow-100 text-yellow-800', text: 'Cancelled' },
      suspended: { color: 'bg-gray-100 text-gray-800', text: 'Suspended' }
    };
    
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatPrice = (monthly, yearly, billingCycle) => {
    const price = billingCycle === 'yearly' ? yearly : monthly;
    return price === 0 ? 'Free' : `LKR ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar />
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription details...</p>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!subscription) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar />
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
            <p className="text-gray-600 mb-6">You don't have an active subscription.</p>
            <Link
              to="/subscription/plans"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage your FinGuard subscription and billing</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border border-red-200">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-800 border border-green-200">
            <span className="font-medium">Success:</span> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                {getStatusBadge(subscription.status)}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium">{subscription.display_name}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-medium">
                    {formatPrice(subscription.price_monthly, subscription.price_yearly, subscription.billing_cycle)}
                    <span className="text-gray-500">/{subscription.billing_cycle}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center">
                    {subscription.is_expired ? (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    )}
                    <span className="font-medium">
                      {subscription.is_expired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">
                    {subscription.is_expired ? 'Expired on' : 'Renews on'}
                  </span>
                  <span className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Auto Renewal</span>
                  <span className={`font-medium ${subscription.auto_renew ? 'text-green-600' : 'text-red-600'}`}>
                    {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Plan Features */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Plan Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {subscription.features && subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Family Members (if family plan) */}
            {subscription.plan_name === 'family' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <UserGroupIcon className="w-6 h-6 mr-2" />
                    Family Members
                  </h2>
                  <Link
                    to="/family/manage"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage Family →
                  </Link>
                </div>

                {familyMembers.length > 0 ? (
                  <div className="space-y-3">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">{member.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Budget: LKR {member.monthly_budget?.toLocaleString() || 0}/month
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No family members added yet</p>
                    <Link
                      to="/family/manage"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                    >
                      Add Family Members
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/subscription/plans"
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-3" />
                  Change Plan
                </Link>
                
                <Link
                  to="/reports"
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChartBarIcon className="w-5 h-5 mr-3" />
                  View Reports
                </Link>

                {subscription.plan_name === 'family' && (
                  <Link
                    to="/family/manage"
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <UserGroupIcon className="w-5 h-5 mr-3" />
                    Manage Family
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CogIcon className="w-5 h-5 mr-3" />
                  Account Settings
                </Link>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Billing Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-gray-600">Payment Method</div>
                    <div className="font-medium">Credit Card •••• 1234</div>
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-gray-600">Next Payment</div>
                    <div className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                Update Payment Method
              </button>
            </div>

            {/* Cancel Subscription */}
            {subscription.status === 'active' && subscription.auto_renew && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You'll keep access until your current billing period ends.
                </p>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Subscription
              </h3>
              <p className="text-gray-600 mb-4">
                We're sorry to see you go! Please let us know why you're cancelling so we can improve our service.
              </p>
              
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tell us why you're cancelling..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default SubscriptionManagement;