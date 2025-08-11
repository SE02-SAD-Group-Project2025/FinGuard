import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Check,
  Users,
  Lock,
  Unlock,
  Crown,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const FamilyTransactionCategories = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    type: 'expense',
    icon: '',
    color: '#3b82f6',
    isShared: true,
    restrictions: {
      maxAmount: null,
      requiresApproval: false,
      allowedMembers: []
    }
  });

  const categoryIcons = {
    '🍽️': 'Food & Dining',
    '🚗': 'Transportation', 
    '🛍️': 'Shopping',
    '🎬': 'Entertainment',
    '💡': 'Bills & Utilities',
    '🏥': 'Healthcare',
    '📚': 'Education',
    '✈️': 'Travel',
    '💼': 'Business',
    '💰': 'Investment',
    '🎁': 'Gifts',
    '🏠': 'Home',
    '⚽': 'Sports',
    '🔧': 'Maintenance',
    '📱': 'Technology',
    '👕': 'Clothing',
    '🌟': 'Other'
  };

  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  useEffect(() => {
    loadFamilyCategories();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    // Check if user is family head or has admin privileges
    const userRole = localStorage.getItem('family-role');
    const isHead = userRole === 'head' || userRole === 'admin';
    setIsAdmin(isHead);
  };

  const loadFamilyCategories = async () => {
    const token = localStorage.getItem('finguard-token');
    setLoading(true);

    try {
      // Try to load from API first
      const response = await fetch('/api/family/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        // Fallback to sample data if API fails
        setCategories([
          {
            id: 1,
            name: 'Family Groceries',
            description: 'Shared grocery expenses for the household',
            type: 'expense',
            icon: '🍽️',
            color: '#10b981',
            isShared: true,
            createdBy: 'Chathura',
            usageCount: 45,
            totalAmount: 125000,
            restrictions: {
              maxAmount: 50000,
              requiresApproval: false,
              allowedMembers: ['all']
            },
            lastUsed: '2025-08-06'
          },
          {
            id: 2,
            name: 'Kids Entertainment',
            description: 'Entertainment expenses for children',
            type: 'expense',
            icon: '🎬',
            color: '#8b5cf6',
            isShared: true,
            createdBy: 'Chathura',
            usageCount: 12,
            totalAmount: 25000,
            restrictions: {
              maxAmount: 10000,
              requiresApproval: true,
              allowedMembers: ['son', 'daughter']
            },
            lastUsed: '2025-08-05'
          },
          {
            id: 3,
            name: 'Transportation',
            description: 'Family vehicle and transport costs',
            type: 'expense', 
            icon: '🚗',
            color: '#f59e0b',
            isShared: true,
            createdBy: 'Chathura',
            usageCount: 28,
            totalAmount: 85000,
            restrictions: {
              maxAmount: null,
              requiresApproval: false,
              allowedMembers: ['all']
            },
            lastUsed: '2025-08-07'
          },
          {
            id: 4,
            name: 'Salary Income',
            description: 'Monthly salary and bonuses',
            type: 'income',
            icon: '💰',
            color: '#10b981',
            isShared: false,
            createdBy: 'Chathura',
            usageCount: 8,
            totalAmount: 450000,
            restrictions: {
              maxAmount: null,
              requiresApproval: false,
              allowedMembers: ['head', 'wife']
            },
            lastUsed: '2025-08-01'
          }
        ]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading family categories:', err);
      setLoading(false);
      // Show error to user
      error('Failed to load family categories');
    }
  };

  const createCategory = async () => {
    const token = localStorage.getItem('finguard-token');
    
    try {
      // Simulate API call
      const categoryData = {
        id: Date.now(),
        ...newCategory,
        createdBy: 'Current User',
        usageCount: 0,
        totalAmount: 0,
        lastUsed: null
      };

      setCategories(prev => [categoryData, ...prev]);
      setNewCategory({
        name: '',
        description: '',
        type: 'expense',
        icon: '',
        color: '#3b82f6',
        isShared: true,
        restrictions: {
          maxAmount: null,
          requiresApproval: false,
          allowedMembers: []
        }
      });
      setShowCreateModal(false);

      success('Category created successfully!');
    } catch (err) {
      console.error('Error creating category:', err);
      error('Failed to create category');
    }
  };

  const updateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const updatedCategories = categories.map(cat =>
        cat.id === selectedCategory.id ? selectedCategory : cat
      );
      
      setCategories(updatedCategories);
      setShowEditModal(false);
      setSelectedCategory(null);

      success('Category updated successfully!');
    } catch (err) {
      console.error('Error updating category:', err);
      error('Failed to update category');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      success('Category deleted successfully');
    } catch (err) {
      console.error('Error deleting category:', err);
      error('Failed to delete category');
    }
  };


  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Tags className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Family Transaction Categories</h2>
              <p className="text-gray-600">Manage shared categories for consistent family expense tracking</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Category
            </button>
          )}
        </div>

        {/* Category Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Categories</div>
            <div className="text-2xl font-bold text-blue-900">{categories.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Shared Categories</div>
            <div className="text-2xl font-bold text-green-900">
              {categories.filter(cat => cat.isShared).length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Active This Month</div>
            <div className="text-2xl font-bold text-purple-900">
              {categories.filter(cat => cat.usageCount > 0).length}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Total Transactions</div>
            <div className="text-2xl font-bold text-orange-900">
              {categories.reduce((sum, cat) => sum + cat.usageCount, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-xl p-6 shadow-sm border-l-4" 
               style={{ borderColor: category.color }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">{category.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center">
                    {category.name}
                    {category.isShared ? (
                      <Users className="w-4 h-4 ml-2 text-blue-500" />
                    ) : (
                      <Lock className="w-4 h-4 ml-2 text-gray-500" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowEditModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type:</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  category.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {category.type}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usage:</span>
                <span className="text-sm font-medium">{category.usageCount} transactions</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-sm font-medium">Rs.{category.totalAmount.toLocaleString()}</span>
              </div>

              {category.restrictions.maxAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Max Amount:</span>
                  <span className="text-sm font-medium text-orange-600">
                    Rs.{category.restrictions.maxAmount.toLocaleString()}
                  </span>
                </div>
              )}

              {category.restrictions.requiresApproval && (
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-sm text-yellow-600">Requires Approval</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Created by:</span>
                <span className="text-sm font-medium">{category.createdBy}</span>
              </div>

              {category.lastUsed && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Used:</span>
                  <span className="text-sm text-gray-500">
                    {new Date(category.lastUsed).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create New Category</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {e.preventDefault(); createCategory();}} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    placeholder="e.g., Family Entertainment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Brief description of this category..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.keys(categoryIcons).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategory({...newCategory, icon})}
                        className={`p-2 text-xl border rounded-lg hover:bg-gray-50 ${
                          newCategory.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({...newCategory, color})}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCategory.isShared}
                    onChange={(e) => setNewCategory({...newCategory, isShared: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Shared with family</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Amount (optional)
                  </label>
                  <input
                    type="number"
                    value={newCategory.restrictions.maxAmount || ''}
                    onChange={(e) => setNewCategory({
                      ...newCategory,
                      restrictions: {
                        ...newCategory.restrictions,
                        maxAmount: e.target.value ? parseFloat(e.target.value) : null
                      }
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCategory.restrictions.requiresApproval}
                      onChange={(e) => setNewCategory({
                        ...newCategory,
                        restrictions: {
                          ...newCategory.restrictions,
                          requiresApproval: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Requires approval</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Category</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {e.preventDefault(); updateCategory();}} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={selectedCategory.name}
                    onChange={(e) => setSelectedCategory({...selectedCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={selectedCategory.type}
                    onChange={(e) => setSelectedCategory({...selectedCategory, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedCategory.description}
                  onChange={(e) => setSelectedCategory({...selectedCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategory.isShared}
                    onChange={(e) => setSelectedCategory({...selectedCategory, isShared: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Shared with family</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategory.restrictions.requiresApproval}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      restrictions: {
                        ...selectedCategory.restrictions,
                        requiresApproval: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires approval</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTransactionCategories;