import React, { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiSettings, FiBarChart } from 'react-icons/fi';
import axios from 'axios';
import authStorage from '../utils/authStorage';

const AdminPremiumOversight = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [featureAdoption, setFeatureAdoption] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [anomalyQueue, setAnomalyQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const token = authStorage.getToken();
    const baseURL = 'http://localhost:5000/admin/premium';
    
    console.log('🔍 AdminPremiumOversight - Token:', token ? 'Found' : 'Missing');
    
    try {
      setLoading(true);
      
      const [subData, finData, featData, healthData, anomData] = await Promise.all([
        axios.get(`${baseURL}/subscription-analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/financial-overview`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/feature-adoption`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/system-health`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/anomaly-queue?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSubscriptionData(subData.data);
      setFinancialOverview(finData.data);
      setFeatureAdoption(featData.data);
      setSystemHealth(healthData.data);
      setAnomalyQueue(anomData.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin premium data:', err);
      
      // Check if it's a 403 Forbidden error (invalid/expired token)
      if (err.response && err.response.status === 403) {
        setError('Access denied. Your session may have expired. Please log in again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (err.response && err.response.status === 401) {
        setError('Authentication required. Please log in as an admin.');
      } else {
        setError('Failed to load admin premium oversight data. Please check your permissions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAnomalyUpdate = async (anomalyIds, status, notes) => {
    const token = authStorage.getToken();
    
    try {
      await axios.patch('http://localhost:5000/admin/premium/anomalies/bulk-update', {
        anomalyIds,
        status,
        adminNotes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh anomaly queue
      const response = await axios.get('http://localhost:5000/admin/premium/anomaly-queue?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnomalyQueue(response.data);
    } catch (err) {
      console.error('Error updating anomalies:', err);
      alert('Failed to update anomalies');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <FiAlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchAllData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Premium Subscription Oversight</h1>
          <p className="mt-2 text-gray-600">Comprehensive admin dashboard for premium user management and analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'subscriptions', label: 'Subscriptions', icon: FiUsers },
                { id: 'financial', label: 'Financial', icon: FiDollarSign },
                { id: 'features', label: 'Features', icon: FiTrendingUp },
                { id: 'system', label: 'System Health', icon: FiSettings },
                { id: 'anomalies', label: 'Anomalies', icon: FiAlertTriangle }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`${
                    activeTab === id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Subscription Analytics Tab */}
        {activeTab === 'subscriptions' && subscriptionData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FiUsers className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionData.totalActiveSubscriptions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FiDollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">Rs. {subscriptionData.totalMonthlyRevenue?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FiBarChart className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Premium Plans</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptionData.subscriptionStats?.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FiTrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                    <p className="text-2xl font-bold text-gray-900">+12.4%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plans Table */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Subscription Plans Overview</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Age (Days)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptionData.subscriptionStats?.map((plan, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{plan.display_name || plan.plan_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{plan.active_subscriptions}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Rs. {plan.total_revenue?.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{Math.round(plan.avg_subscription_age_days) || 'N/A'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Financial Overview Tab */}
        {activeTab === 'financial' && financialOverview && (
          <div className="space-y-6">
            {/* User Comparison */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Premium vs Regular Users</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {financialOverview.userComparison?.map((userType, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase">{userType.user_type} Users</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-lg font-semibold">{userType.user_count} Users</p>
                      <p className="text-sm text-gray-600">Avg Monthly Volume: Rs. {userType.avg_monthly_volume?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Avg Transactions: {Math.round(userType.avg_monthly_transactions)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Spending Categories (Last 30 Days)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialOverview.topCategories?.map((category, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.transaction_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {category.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {Math.round(category.avg_amount)?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Feature Adoption Tab */}
        {activeTab === 'features' && featureAdoption && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Premium Feature Adoption Rates</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adoption Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {featureAdoption.featureAdoption?.map((feature, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feature.feature_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{feature.users_using_feature}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900">{feature.adoption_rate_percentage}%</div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, feature.adoption_rate_percentage)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Math.round(feature.avg_usage_per_user)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Math.round(feature.avg_session_duration)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && systemHealth && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Memory Usage</h4>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-gray-900">{systemHealth.performanceMetrics?.memoryUsage}%</div>
                  <div className="ml-4 flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${systemHealth.performanceMetrics?.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">CPU Usage</h4>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-gray-900">{systemHealth.performanceMetrics?.cpuUsage}%</div>
                  <div className="ml-4 flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${systemHealth.performanceMetrics?.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Cache Hit Rate</h4>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-gray-900">{systemHealth.performanceMetrics?.cacheHitRate}%</div>
                  <div className="ml-4 flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${systemHealth.performanceMetrics?.cacheHitRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Metrics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Avg Response Time</p>
                  <p className="text-xl font-semibold text-gray-900">{systemHealth.apiMetrics?.avgResponseTime}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Error Rate</p>
                  <p className="text-xl font-semibold text-red-600">{systemHealth.apiMetrics?.errorRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requests/Min</p>
                  <p className="text-xl font-semibold text-gray-900">{systemHealth.apiMetrics?.requestsPerMinute}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Connections</p>
                  <p className="text-xl font-semibold text-gray-900">{systemHealth.performanceMetrics?.activeConnections}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && anomalyQueue && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {anomalyQueue.summary?.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <FiAlertTriangle className={`h-8 w-8 ${
                      item.severity === 'high' ? 'text-red-500' :
                      item.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{item.severity.toUpperCase()} Severity</p>
                      <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Anomaly Queue */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">High-Confidence Anomaly Review Queue</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {anomalyQueue.anomalies?.map((anomaly, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{anomaly.username}</div>
                          <div className="text-sm text-gray-500">{anomaly.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{anomaly.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                            anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {anomaly.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{anomaly.confidence}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(anomaly.detected_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button 
                            onClick={() => handleBulkAnomalyUpdate([anomaly.id], 'acknowledged', 'Reviewed by admin')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Acknowledge
                          </button>
                          <button 
                            onClick={() => handleBulkAnomalyUpdate([anomaly.id], 'dismissed', 'False positive')}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="fixed bottom-6 right-6">
          <button 
            onClick={fetchAllData}
            className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPremiumOversight;