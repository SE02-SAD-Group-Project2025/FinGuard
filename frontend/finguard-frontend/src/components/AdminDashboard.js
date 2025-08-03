import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar';
import { Users, ClipboardList, FolderCog, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import AdminSummaryCards from './AdminSummaryCards';
import UserActivityChart from './UserActivityChart';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        credentials: 'include', // Include credentials for CORS
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
          localStorage.removeItem('finguard-token'); // Remove invalid token
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

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching logs...');
      
      const data = await apiCall('/admin/logs');
      if (data) {
        console.log('📜 Logs fetched:', data);
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      setLogs([]);
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
      fetchCategories(); // Refresh the list
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
      fetchCategories(); // Refresh the list
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
      fetchUsers(); // Refresh the list
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
      fetchUsers(); // Refresh the list
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
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  };

  // Load data when component mounts or tab changes
  useEffect(() => {
    console.log(`🔄 Tab changed to: ${activeTab}`);
    refreshData();
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
          logCount={logs.length} 
          adminCount={users.filter(user => user.role === 'Admin').length} 
          issueCount={6} 
        />

        {/* Global Error/Success Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            { id: 'users', label: 'Manage Users', icon: <Users className="w-4 h-4" /> },
            { id: 'logs', label: 'View Logs', icon: <ClipboardList className="w-4 h-4" /> },
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

          {/* View Logs */}
          {activeTab === 'logs' && !loading && (
            <div>
              <h2 className="text-xl font-semibold mb-4">System Activity Logs ({logs.length} entries)</h2>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No logs found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 border border-gray-200 rounded bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-gray-900">{log.activity}</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            User: {log.username || 'System'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Categories */}
          {activeTab === 'categories' && !loading && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Category Management ({categories.length} categories)</h2>
              
              {/* Add Category Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Add New Category</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="border border-gray-300 px-4 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    onClick={handleAddCategory}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Categories List */}
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <FolderCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No categories found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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