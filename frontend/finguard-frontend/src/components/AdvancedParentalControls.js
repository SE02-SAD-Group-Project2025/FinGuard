import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Users, DollarSign, Calendar, AlertTriangle, CheckCircle, X, Plus, Edit3, Trash2, Settings, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AdvancedParentalControls = () => {
  const { isDarkMode } = useTheme();
  const [controls, setControls] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newControl, setNewControl] = useState({
    memberId: '',
    type: 'spending_limit',
    value: '',
    timeframe: 'daily',
    category: 'all',
    description: '',
    isActive: true
  });

  const [activeTab, setActiveTab] = useState('limits');

  useEffect(() => {
    loadParentalControls();
  }, []);

  const loadParentalControls = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockFamilyMembers = [
        {
          id: 1,
          name: 'Alice (Daughter)',
          email: 'alice@family.com',
          role: 'child',
          age: 16,
          profilePhoto: null,
          status: 'active'
        },
        {
          id: 2,
          name: 'Bob (Son)',
          email: 'bob@family.com',
          role: 'child', 
          age: 14,
          profilePhoto: null,
          status: 'active'
        },
        {
          id: 3,
          name: 'Sarah (Spouse)',
          email: 'sarah@family.com',
          role: 'adult',
          age: 35,
          profilePhoto: null,
          status: 'active'
        }
      ];

      const mockControls = [
        {
          id: 1,
          memberId: 1,
          memberName: 'Alice (Daughter)',
          type: 'spending_limit',
          value: 5000,
          timeframe: 'weekly',
          category: 'Entertainment',
          description: 'Weekly entertainment spending limit',
          isActive: true,
          currentUsage: 3200,
          violations: 0,
          lastViolation: null
        },
        {
          id: 2,
          memberId: 2,
          memberName: 'Bob (Son)',
          type: 'spending_limit',
          value: 2000,
          timeframe: 'daily',
          category: 'all',
          description: 'Daily overall spending limit',
          isActive: true,
          currentUsage: 1800,
          violations: 2,
          lastViolation: new Date(2025, 7, 5)
        },
        {
          id: 3,
          memberId: 1,
          memberName: 'Alice (Daughter)',
          type: 'category_block',
          value: 0,
          timeframe: 'permanent',
          category: 'Shopping',
          description: 'Block online shopping completely',
          isActive: true,
          currentUsage: 0,
          violations: 1,
          lastViolation: new Date(2025, 7, 3)
        },
        {
          id: 4,
          memberId: 2,
          memberName: 'Bob (Son)',
          type: 'time_restriction',
          value: 2200, // 10 PM in 24hr format
          timeframe: 'daily',
          category: 'all',
          description: 'No spending after 10 PM',
          isActive: true,
          currentUsage: 0,
          violations: 0,
          lastViolation: null
        },
        {
          id: 5,
          memberId: 1,
          memberName: 'Alice (Daughter)',
          type: 'approval_required',
          value: 1000,
          timeframe: 'per_transaction',
          category: 'all',
          description: 'Require approval for purchases over Rs. 1,000',
          isActive: true,
          currentUsage: 0,
          violations: 0,
          lastViolation: null
        }
      ];
      
      setFamilyMembers(mockFamilyMembers);
      setControls(mockControls);
    } catch (error) {
      console.error('Error loading parental controls:', error);
    } finally {
      setLoading(false);
    }
  };

  const controlTypes = [
    {
      id: 'spending_limit',
      name: 'Spending Limit',
      description: 'Set maximum spending amounts',
      icon: DollarSign
    },
    {
      id: 'category_block',
      name: 'Category Block',
      description: 'Block specific spending categories',
      icon: Lock
    },
    {
      id: 'time_restriction',
      name: 'Time Restriction',
      description: 'Restrict spending during certain hours',
      icon: Clock
    },
    {
      id: 'approval_required',
      name: 'Approval Required',
      description: 'Require approval for transactions',
      icon: CheckCircle
    }
  ];

  const timeframes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'per_transaction', label: 'Per Transaction' },
    { value: 'permanent', label: 'Permanent' }
  ];

  const categories = [
    'all', 'Food & Dining', 'Shopping', 'Entertainment', 
    'Transportation', 'Bills & Utilities', 'Healthcare', 'Education'
  ];

  const getControlIcon = (type) => {
    const controlType = controlTypes.find(ct => ct.id === type);
    return controlType ? controlType.icon : Shield;
  };

  const getStatusColor = (control) => {
    if (!control.isActive) return 'text-gray-500';
    if (control.violations > 0) return 'text-red-600';
    if (control.type === 'spending_limit' && control.currentUsage / control.value > 0.8) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  const formatValue = (control) => {
    switch (control.type) {
      case 'spending_limit':
        return `Rs. ${control.value.toLocaleString()}`;
      case 'time_restriction':
        const hour = Math.floor(control.value / 100);
        const minute = control.value % 100;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      case 'approval_required':
        return `Above Rs. ${control.value.toLocaleString()}`;
      case 'category_block':
        return 'Blocked';
      default:
        return control.value;
    }
  };

  const getUsagePercentage = (control) => {
    if (control.type !== 'spending_limit') return 0;
    return Math.min((control.currentUsage / control.value) * 100, 100);
  };

  const handleAddControl = () => {
    const controlData = {
      ...newControl,
      id: Date.now(),
      memberName: familyMembers.find(m => m.id === parseInt(newControl.memberId))?.name || '',
      value: parseFloat(newControl.value) || newControl.value,
      currentUsage: 0,
      violations: 0,
      lastViolation: null
    };
    
    setControls(prev => [...prev, controlData]);
    resetForm();
  };

  const handleEditControl = (control) => {
    setEditingControl(control);
    setNewControl({
      memberId: control.memberId.toString(),
      type: control.type,
      value: control.value.toString(),
      timeframe: control.timeframe,
      category: control.category,
      description: control.description,
      isActive: control.isActive
    });
    setShowAddModal(true);
  };

  const handleUpdateControl = () => {
    const updatedControl = {
      ...editingControl,
      ...newControl,
      memberId: parseInt(newControl.memberId),
      memberName: familyMembers.find(m => m.id === parseInt(newControl.memberId))?.name || '',
      value: parseFloat(newControl.value) || newControl.value
    };
    
    setControls(prev => prev.map(control => 
      control.id === editingControl.id ? updatedControl : control
    ));
    
    resetForm();
  };

  const handleDeleteControl = (controlId) => {
    setControls(prev => prev.filter(control => control.id !== controlId));
  };

  const toggleControlStatus = (controlId) => {
    setControls(prev => prev.map(control => 
      control.id === controlId 
        ? { ...control, isActive: !control.isActive }
        : control
    ));
  };

  const resetForm = () => {
    setNewControl({
      memberId: '',
      type: 'spending_limit',
      value: '',
      timeframe: 'daily',
      category: 'all',
      description: '',
      isActive: true
    });
    setEditingControl(null);
    setShowAddModal(false);
  };

  const childMembers = familyMembers.filter(member => member.role === 'child');

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Advanced Parental Controls
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Set spending limits and restrictions for family members
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Control
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Controls</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {controls.filter(c => c.isActive).length}
              </p>
            </div>
            <Settings className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Violations</p>
              <p className="text-2xl font-bold text-red-600">
                {controls.reduce((sum, c) => sum + c.violations, 0)}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Children</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {childMembers.length}
              </p>
            </div>
            <Users className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Protected</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Rs. {controls.filter(c => c.type === 'spending_limit').reduce((sum, c) => sum + c.value, 0).toLocaleString()}
              </p>
            </div>
            <Lock className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'limits', label: 'Spending Limits', count: controls.filter(c => c.type === 'spending_limit').length },
          { id: 'blocks', label: 'Category Blocks', count: controls.filter(c => c.type === 'category_block').length },
          { id: 'time', label: 'Time Restrictions', count: controls.filter(c => c.type === 'time_restriction').length },
          { id: 'approval', label: 'Approval Required', count: controls.filter(c => c.type === 'approval_required').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Controls List */}
      <div className="space-y-4">
        {controls
          .filter(control => {
            if (activeTab === 'limits') return control.type === 'spending_limit';
            if (activeTab === 'blocks') return control.type === 'category_block';
            if (activeTab === 'time') return control.type === 'time_restriction';
            if (activeTab === 'approval') return control.type === 'approval_required';
            return true;
          })
          .map((control) => {
            const ControlIcon = getControlIcon(control.type);
            const usagePercentage = getUsagePercentage(control);
            
            return (
              <div key={control.id} className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <div className={`p-2 rounded-lg mr-4 ${
                      control.isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-600'
                    }`}>
                      <ControlIcon className={`w-5 h-5 ${getStatusColor(control)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {control.memberName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatValue(control)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            control.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {control.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {control.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {control.timeframe}
                          </span>
                          <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Category: {control.category}
                          </span>
                          {control.violations > 0 && (
                            <span className="flex items-center text-red-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {control.violations} violations
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleControlStatus(control.id)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              control.isActive
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                            }`}
                          >
                            {control.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleEditControl(control)}
                            className={`p-1 rounded transition-colors ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteControl(control.id)}
                            className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Usage Progress Bar for Spending Limits */}
                      {control.type === 'spending_limit' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              Used: Rs. {control.currentUsage.toLocaleString()}
                            </span>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                usagePercentage > 90 ? 'bg-red-500' :
                                usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {controls.filter(control => {
        if (activeTab === 'limits') return control.type === 'spending_limit';
        if (activeTab === 'blocks') return control.type === 'category_block';
        if (activeTab === 'time') return control.type === 'time_restriction';
        if (activeTab === 'approval') return control.type === 'approval_required';
        return true;
      }).length === 0 && (
        <div className="text-center py-12">
          <Shield className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Controls Found
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Add your first parental control to start protecting your family's spending.
          </p>
        </div>
      )}

      {/* Add/Edit Control Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingControl ? 'Edit Control' : 'Add New Control'}
              </h3>
              <button
                onClick={resetForm}
                className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Family Member
                </label>
                <select
                  value={newControl.memberId}
                  onChange={(e) => setNewControl({...newControl, memberId: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select member</option>
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Control Type
                </label>
                <select
                  value={newControl.type}
                  onChange={(e) => setNewControl({...newControl, type: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {controlTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {newControl.type === 'spending_limit' ? 'Limit Amount (Rs.)' :
                   newControl.type === 'time_restriction' ? 'Time (24hr format, e.g., 2200 for 10 PM)' :
                   newControl.type === 'approval_required' ? 'Approval Threshold (Rs.)' : 'Value'}
                </label>
                <input
                  type={newControl.type === 'time_restriction' ? 'text' : 'number'}
                  value={newControl.value}
                  onChange={(e) => setNewControl({...newControl, value: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder={newControl.type === 'time_restriction' ? '2200' : '0'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Timeframe
                  </label>
                  <select
                    value={newControl.timeframe}
                    onChange={(e) => setNewControl({...newControl, timeframe: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {timeframes.map(timeframe => (
                      <option key={timeframe.value} value={timeframe.value}>
                        {timeframe.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={newControl.category}
                    onChange={(e) => setNewControl({...newControl, category: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={newControl.description}
                  onChange={(e) => setNewControl({...newControl, description: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="3"
                  placeholder="Describe this control..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newControl.isActive}
                  onChange={(e) => setNewControl({...newControl, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isActive" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Activate this control immediately
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button
                onClick={resetForm}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={editingControl ? handleUpdateControl : handleAddControl}
                disabled={!newControl.memberId || !newControl.value}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {editingControl ? 'Update Control' : 'Add Control'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedParentalControls;