// components/ReportsPage.js
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { 
  Bug, 
  Lightbulb, 
  User, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Palette, 
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  MessageCircle
} from 'lucide-react';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
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

  // Get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'bug': <Bug className="w-5 h-5" />,
      'feature_request': <Lightbulb className="w-5 h-5" />,
      'account_issue': <User className="w-5 h-5" />,
      'payment_issue': <CreditCard className="w-5 h-5" />,
      'data_issue': <BarChart3 className="w-5 h-5" />,
      'security_concern': <Shield className="w-5 h-5" />,
      'ui_feedback': <Palette className="w-5 h-5" />,
      'other': <FileText className="w-5 h-5" />
    };
    return iconMap[category] || <FileText className="w-5 h-5" />;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'text-gray-600 bg-gray-100',
      'medium': 'text-blue-600 bg-blue-100',
      'high': 'text-orange-600 bg-orange-100',
      'urgent': 'text-red-600 bg-red-100'
    };
    return colors[priority] || colors['medium'];
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'resolved': 'text-green-600 bg-green-100',
      'closed': 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors['pending'];
  };

  // Fetch user reports
  const fetchReports = async () => {
    setLoading(true);
    setError('');

    try {
      const reportsData = await apiCall('/api/reports');
      if (reportsData) {
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch report categories
  const fetchCategories = async () => {
    try {
      const categoriesData = await apiCall('/api/reports/categories');
      if (categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories([
        { name: 'bug', description: 'Technical issues and bugs', icon: '🐛' },
        { name: 'feature_request', description: 'New feature suggestions', icon: '💡' },
        { name: 'account_issue', description: 'Login, profile, or account problems', icon: '👤' },
        { name: 'payment_issue', description: 'Transaction or payment problems', icon: '💳' },
        { name: 'data_issue', description: 'Incorrect calculations or data', icon: '📊' },
        { name: 'security_concern', description: 'Security-related issues', icon: '🔒' },
        { name: 'ui_feedback', description: 'User interface feedback', icon: '🎨' },
        { name: 'other', description: 'Other issues or feedback', icon: '📝' }
      ]);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchReports();
    fetchCategories();
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
    
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (editingReport) {
        // Update existing report
        response = await apiCall(`/api/reports/${editingReport.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        if (response) {
          setSuccess('Report updated successfully!');
        }
      } else {
        // Create new report
        response = await apiCall('/api/reports', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        if (response) {
          setSuccess('Report submitted successfully! We will review it shortly.');
        }
      }

      if (response) {
        closeModal();
        fetchReports();
      }
    } catch (error) {
      setError(`Failed to ${editingReport ? 'update' : 'submit'} report`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete report
  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    setLoading(true);
    try {
      const response = await apiCall(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Report deleted successfully');
        fetchReports();
      }
    } catch (error) {
      setError('Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  // Modal controls
  const openModal = (report = null) => {
    if (report) {
      setEditingReport(report);
      setFormData({
        title: report.title,
        description: report.description,
        category: report.category,
        priority: report.priority
      });
    } else {
      setEditingReport(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium'
      });
    }
    setShowReportModal(true);
  };

  const closeModal = () => {
    setShowReportModal(false);
    setEditingReport(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium'
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          {type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
            <h1 className="text-3xl font-bold text-gray-900">Support & Reports</h1>
            <p className="text-gray-600 mt-1">Submit feedback, report issues, or request new features</p>
            <p className="text-sm text-gray-500">
              Total reports: {reports.length} • Available categories: {categories.length}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Submit Report
            </button>
          </div>
        </div>

        {/* Quick Report Categories */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Report Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => {
                  setFormData(prev => ({ ...prev, category: category.name }));
                  openModal();
                }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  {getCategoryIcon(category.name)}
                  <span className="font-medium text-gray-900 capitalize">
                    {category.name.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Reports ({reports.length})</h3>
          </div>

          {loading && reports.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reports submitted yet</p>
              <button 
                onClick={() => openModal()}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Submit your first report
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getCategoryIcon(report.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{report.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                            {report.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{report.description}</p>
                        
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Submitted: {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            {report.updated_at !== report.created_at && (
                              <span>
                                Updated: {new Date(report.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Admin Response */}
                        {report.admin_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Admin Response {report.admin_username && `by ${report.admin_username}`}
                              </span>
                            </div>
                            <p className="text-sm text-blue-700">{report.admin_response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openModal(report)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit report"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit/Edit Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingReport ? 'Edit Report' : 'Submit New Report'}
                </h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Brief description of the issue or request"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name.replace('_', ' ').toUpperCase()} - {cat.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low - Minor issue or suggestion</option>
                    <option value="medium">Medium - Standard issue</option>
                    <option value="high">High - Important issue affecting functionality</option>
                    <option value="urgent">Urgent - Critical issue preventing app use</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    placeholder="Please provide detailed information about the issue or request..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include steps to reproduce (for bugs), expected behavior, or detailed feature requirements
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <Send className="w-4 h-4" />
                    {loading ? 'Submitting...' : (editingReport ? 'Update Report' : 'Submit Report')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default ReportsPage;