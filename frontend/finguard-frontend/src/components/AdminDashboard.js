import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar';
import { 
  Users, 
  ClipboardList, 
  FolderCog, 
  Trash2, 
  AlertCircle, 
  RefreshCw,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  Clock,
  Activity,
  Download,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminSummaryCards from './AdminSummaryCards';
import UserActivityChart from './UserActivityChart';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Enhanced logs state
  const [logFilters, setLogFilters] = useState({
    username: '',
    activity: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    sortOrder: 'DESC'
  });
  const [logPagination, setLogPagination] = useState({});
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // API base URL
  const API_BASE = 'http://localhost:5000';

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem('finguard-token');
    console.log('🔑 Token retrieved:', token ? 'Present' : 'Missing');
    return token;
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Enhanced API call function with better error handling
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    
    if (!token) {
      setError('No authentication token found. Please login again.');
      return null;
    }

    const url = `${API_BASE}${endpoint}`;
    console.log(`🌐 Making API call to: ${url}`);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });

      console.log(`📡 Response status: ${response.status} for ${url}`);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        }
        
        if (response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          localStorage.removeItem('finguard-token');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ API success for ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error for ${url}:`, error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Connection failed. Please check if the server is running on port 5000.');
      } else {
        setError(error.message || 'An unexpected error occurred');
      }
      
      throw error;
    }
  };

  // Get activity icon
  const getActivityIcon = (activity) => {
    const icons = {
      'logged in': '🔑',
      'logged out': '🚪',
      'registered': '✨',
      'failed login': '❌',
      'password': '🔒',
      'profile': '👤',
      'transaction': '💰',
      'income': '💚',
      'expense': '💸',
      'budget': '📊',
      'banned': '🚫',
      'unbanned': '✅',
      'role': '👑',
      'admin': '🛡️',
      'alert': '🚨',
      'security': '🔐',
      'category': '📁',
      'added': '➕',
      'updated': '✏️',
      'deleted': '🗑️',
      'completed': '✅',
      'attempt': '⚠️',
      'reset': '🔄'
    };

    const activityLower = activity.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (activityLower.includes(key)) {
        return icon;
      }
    }
    return '📝';
  };

  // Get activity color class
  const getActivityColor = (activity) => {
    const activityLower = activity.toLowerCase();
    if (activityLower.includes('failed') || activityLower.includes('banned') || activityLower.includes('blocked') || activityLower.includes('attempt')) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (activityLower.includes('logged in') || activityLower.includes('registered') || activityLower.includes('unbanned') || activityLower.includes('added') || activityLower.includes('completed')) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (activityLower.includes('admin') || activityLower.includes('role')) {
      return 'text-purple-600 bg-purple-50 border-purple-200';
    } else if (activityLower.includes('alert') || activityLower.includes('budget')) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    } else if (activityLower.includes('password') || activityLower.includes('security')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else if (activityLower.includes('updated') || activityLower.includes('changed')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else if (activityLower.includes('deleted')) {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching users...');
      
      const data = await apiCall('/admin/users');
      if (data) {
        console.log('👥 Users fetched:', data);
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fetch logs with filters
  const fetchLogs = async (filters = logFilters) => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching logs with filters:', filters);

      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const data = await apiCall(`/admin/logs?${params.toString()}`);
      if (data) {
        console.log('📜 Logs fetched:', data);
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setLogPagination(data.pagination || {});
      }
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch log statistics
  const fetchLogStats = async (timeframe = '30d') => {
    try {
      console.log('🔄 Fetching log stats...');
      
      const data = await apiCall(`/admin/logs/stats?timeframe=${timeframe}`);
      if (data) {
        console.log('📊 Log stats fetched:', data);
        setLogStats(data);
      }
    } catch (error) {
      console.error('❌ Error fetching log stats:', error);
      setLogStats({});
    }
  };

  // Handle log filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...logFilters, [key]: value, page: 1 };
    setLogFilters(newFilters);
    
    // Debounce API calls for text inputs
    if (key === 'username' || key === 'activity') {
      clearTimeout(window.filterTimeout);
      window.filterTimeout = setTimeout(() => {
        fetchLogs(newFilters);
      }, 500);
    } else {
      fetchLogs(newFilters);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    const newFilters = { ...logFilters, page: newPage };
    setLogFilters(newFilters);
    fetchLogs(newFilters);
  };

  // Toggle log details
  const toggleLogDetails = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // Export logs
  const exportLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ ...logFilters, limit: 10000 });
      const data = await apiCall(`/admin/logs?${params.toString()}`);
      
      if (data && data.logs) {
        const csvContent = [
          ['Timestamp', 'Username', 'Activity', 'Details'],
          ...data.logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.username || 'System',
            log.activity,
            log.details ? JSON.stringify(log.details) : ''
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finguard-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        setSuccess('Logs exported successfully');
      }
    } catch (error) {
      setError('Failed to export logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching categories...');
      
      const data = await apiCall('/admin/categories');
      if (data) {
        console.log('📁 Categories fetched:', data);
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Add category to backend
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (categories.some(cat => cat.name === newCategory.trim())) {
      setError('Category already exists');
      return;
    }

    try {
      setError('');
      console.log('➕ Adding category:', newCategory);
      
      await apiCall('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      
      setSuccess('Category added successfully');
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error('❌ Error adding category:', error);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setError('');
      console.log('🗑️ Deleting category:', categoryId);
      
      await apiCall(`/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('❌ Error deleting category:', error);
    }
  };

  // Ban/unban user
  const handleBanUser = async (userId, isBanned) => {
    try {
      setError('');
      console.log(`${!isBanned ? '🚫' : '✅'} ${!isBanned ? 'Banning' : 'Unbanning'} user:`, userId);
      
      await apiCall(`/admin/users/${userId}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ is_banned: !isBanned }),
      });

      setSuccess(`User ${!isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('❌ Error banning/unbanning user:', error);
    }
  };

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError('');
      console.log('🔄 Updating user role:', userId, 'to', newRole);
      
      await apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });

      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user role:', error);
    }
  };

  // Refresh current tab data
  const refreshData = () => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchLogs();
      fetchLogStats();
    }
  };

  // Load data when component mounts or tab changes
  useEffect(() => {
    console.log(`🔄 Tab changed to: ${activeTab}`);
    refreshData();
  }, [activeTab]);

  // Load log stats when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogStats();
    }
  }, [activeTab]);

  // Error/Success Message Component
  const MessageAlert = ({ message, type }) => {
    if (!message) return null;
    
    return (
      <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
        type === 'error' 
          ? 'bg-red-100 text-red-800 border border-red-200' 
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  return (
    <>
      {/* Full-width Sticky Admin Navbar */}
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Summary Cards */}
        <AdminSummaryCards 
          userCount={users.length} 
          logCount={logStats.overview?.totalLogs || 0} 
          adminCount={users.filter(user => user.role === 'Admin').length} 
          issueCount={logStats.overview?.securityEvents || 0} 
        />

        {/* Global Error/Success Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            { id: 'users', label: 'Manage Users', icon: <Users className="w-4 h-4" /> },
            { id: 'logs', label: 'System Logs', icon: <ClipboardList className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          
          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-white text-gray-700 hover:bg-gray-100 border-gray-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
            </div>
          )}

          {/* Manage Users */}
          {activeTab === 'users' && !loading && (
            <div>
              <h2 className="text-xl font-semibold mb-4">User Management ({users.length} users)</h2>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                  <button onClick={fetchUsers} className="mt-2 text-blue-600 hover:text-blue-800">
                    Try refreshing
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-left border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 font-medium text-gray-700">ID</th>
                        <th className="p-3 font-medium text-gray-700">Username</th>
                        <th className="p-3 font-medium text-gray-700">Email</th>
                        <th className="p-3 font-medium text-gray-700">Role</th>
                        <th className="p-3 font-medium text-gray-700">Status</th>
                        <th className="p-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-sm">{user.id}</td>
                          <td className="p-3">{user.username || 'N/A'}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">
                            <select 
                              value={user.role || 'User'} 
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="User">User</option>
                              <option value="Admin">Admin</option>
                              <option value="Premium User">Premium User</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.is_banned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => handleBanUser(user.id, user.is_banned)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                user.is_banned 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              {user.is_banned ? 'Unban' : 'Ban'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Enhanced System Logs */}
          {activeTab === 'logs' && !loading && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">System Activity Logs</h2>
                  <p className="text-sm text-gray-600">
                    Total: {logPagination.total || 0} entries • 
                    Page {logPagination.page || 1} of {logPagination.totalPages || 1}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportLogs}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                  </button>
                </div>
              </div>

              {/* Log Statistics */}
              {logStats.overview && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-700 font-medium">Total Logs</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{logStats.overview.totalLogs}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">Active Users</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">{logStats.overview.activeUsers}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-700 font-medium">24h Activity</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-800">{logStats.overview.recentActivity}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 font-medium">Security Events</span>
                    </div>
                    <p className="text-2xl font-bold text-red-800">{logStats.overview.securityEvents}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      <span className="text-purple-700 font-medium">Admin Actions</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-800">{logStats.overview.adminActions || 0}</p>
                  </div>
                </div>
              )}

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search username..."
                          value={logFilters.username}
                          onChange={(e) => handleFilterChange('username', e.target.value)}
                          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                      <input
                        type="text"
                        placeholder="Search activity..."
                        value={logFilters.activity}
                        onChange={(e) => handleFilterChange('activity', e.target.value)}
                        className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="datetime-local"
                        value={logFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="datetime-local"
                        value={logFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setLogFilters({
                          username: '',
                          activity: '',
                          startDate: '',
                          endDate: '',
                          page: 1,
                          limit: 20,
                          sortBy: 'timestamp',
                          sortOrder: 'DESC'
                        });
                        fetchLogs({
                          username: '',
                          activity: '',
                          startDate: '',
                          endDate: '',
                          page: 1,
                          limit: 20,
                          sortBy: 'timestamp',
                          sortOrder: 'DESC'
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Logs List */}
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No logs found</p>
                  <button onClick={() => fetchLogs()} className="mt-2 text-blue-600 hover:text-blue-800">
                    Try refreshing
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className={`border rounded-lg transition-all ${getActivityColor(log.activity)}`}>
                      <div 
                        className="p-4 cursor-pointer hover:bg-opacity-75"
                        onClick={() => toggleLogDetails(log.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-2xl mt-1">
                              {getActivityIcon(log.activity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {log.activity}
                                </span>
                                {log.details?.admin_action && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                    Admin Action
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">User:</span> {log.username || 'System'} 
                                {log.role && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {log.role}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            {expandedLogs.has(log.id) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedLogs.has(log.id) && log.details && (
                        <div className="border-t bg-gray-50 p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Activity Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {Object.entries(log.details).map(([key, value]) => {
                              if (typeof value === 'object' && value !== null) {
                                return (
                                  <div key={key} className="bg-white p-3 rounded border">
                                    <span className="font-medium text-gray-700 capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    <pre className="mt-1 text-gray-600 text-xs overflow-x-auto">
                                      {JSON.stringify(value, null, 2)}
                                    </pre>
                                  </div>
                                );
                              }
                              return (
                                <div key={key} className="bg-white p-3 rounded border">
                                  <span className="font-medium text-gray-700 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <p className="mt-1 text-gray-600">{String(value)}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {logPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((logPagination.page - 1) * logFilters.limit) + 1} to{' '}
                    {Math.min(logPagination.page * logFilters.limit, logPagination.total)} of{' '}
                    {logPagination.total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(logPagination.page - 1)}
                      disabled={!logPagination.hasPrev}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, logPagination.totalPages))].map((_, idx) => {
                        const pageNum = logPagination.page - 2 + idx;
                        if (pageNum < 1 || pageNum > logPagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg ${
                              pageNum === logPagination.page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(logPagination.page + 1)}
                      disabled={!logPagination.hasNext}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Top Activities and Users */}
              {logStats.topActivities && logStats.topUsers && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Top Activities */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Top Activities
                    </h3>
                    <div className="space-y-3">
                      {logStats.topActivities.slice(0, 8).map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getActivityIcon(activity.activity)}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {activity.activity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ 
                                  width: `${(activity.count / logStats.topActivities[0].count) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                              {activity.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Users */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Most Active Users
                    </h3>
                    <div className="space-y-3">
                      {logStats.topUsers.slice(0, 8).map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                {user.username}
                              </span>
                              {user.role && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {user.role}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ 
                                  width: `${(user.activity_count / logStats.topUsers[0].activity_count) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                              {user.activity_count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Activity Chart */}
        <UserActivityChart />
      </div>
    </>
  );
};

export default AdminDashboard;