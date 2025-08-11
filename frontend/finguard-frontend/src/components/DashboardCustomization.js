import React, { useState, useEffect } from 'react';
import { Layout, Grip, Eye, EyeOff, Settings, Save, RotateCcw, Maximize2, Minimize2, Move, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const DashboardCustomization = () => {
  const { isDarkMode } = useTheme();
  const [widgets, setWidgets] = useState([]);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardConfiguration();
  }, []);

  const loadDashboardConfiguration = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAvailableWidgets = [
        {
          id: 'financial-health',
          name: 'Financial Health Score',
          description: 'Track your overall financial wellness',
          component: 'FinancialHealthScore',
          size: 'large',
          category: 'analytics',
          icon: '📊'
        },
        {
          id: 'quick-actions',
          name: 'Quick Actions',
          description: 'Fast access to common tasks',
          component: 'QuickActions',
          size: 'medium',
          category: 'actions',
          icon: '⚡'
        },
        {
          id: 'recent-transactions',
          name: 'Recent Transactions',
          description: 'Latest income and expenses',
          component: 'RecentTransactions',
          size: 'large',
          category: 'transactions',
          icon: '💳'
        },
        {
          id: 'budget-overview',
          name: 'Budget Overview',
          description: 'Current month budget status',
          component: 'BudgetOverview',
          size: 'medium',
          category: 'budget',
          icon: '📈'
        },
        {
          id: 'spending-categories',
          name: 'Spending Categories',
          description: 'Breakdown by expense categories',
          component: 'SpendingCategories',
          size: 'medium',
          category: 'analytics',
          icon: '🍕'
        },
        {
          id: 'savings-progress',
          name: 'Savings Progress',
          description: 'Track your savings goals',
          component: 'SavingsProgress',
          size: 'small',
          category: 'goals',
          icon: '🎯'
        },
        {
          id: 'bill-reminders',
          name: 'Bill Reminders',
          description: 'Upcoming bills and due dates',
          component: 'BillReminders',
          size: 'small',
          category: 'reminders',
          icon: '📅'
        },
        {
          id: 'family-summary',
          name: 'Family Summary',
          description: 'Family spending overview',
          component: 'FamilySummary',
          size: 'large',
          category: 'family',
          icon: '👨‍👩‍👧‍👦'
        },
        {
          id: 'achievement-badges',
          name: 'Achievement Badges',
          description: 'Your latest financial achievements',
          component: 'AchievementBadges',
          size: 'medium',
          category: 'gamification',
          icon: '🏆'
        },
        {
          id: 'cash-flow-chart',
          name: 'Cash Flow Chart',
          description: 'Income vs expenses trends',
          component: 'CashFlowChart',
          size: 'large',
          category: 'analytics',
          icon: '📊'
        }
      ];

      const mockCurrentWidgets = [
        {
          ...mockAvailableWidgets[0],
          position: 0,
          isVisible: true,
          customSize: 'large'
        },
        {
          ...mockAvailableWidgets[1],
          position: 1,
          isVisible: true,
          customSize: 'medium'
        },
        {
          ...mockAvailableWidgets[2],
          position: 2,
          isVisible: true,
          customSize: 'large'
        },
        {
          ...mockAvailableWidgets[3],
          position: 3,
          isVisible: false,
          customSize: 'medium'
        },
        {
          ...mockAvailableWidgets[4],
          position: 4,
          isVisible: true,
          customSize: 'medium'
        }
      ];

      setAvailableWidgets(mockAvailableWidgets);
      setWidgets(mockCurrentWidgets.sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Error loading dashboard configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-3 row-span-2'
  };

  const categories = [
    { id: 'analytics', name: 'Analytics', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' },
    { id: 'actions', name: 'Actions', color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
    { id: 'transactions', name: 'Transactions', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' },
    { id: 'budget', name: 'Budget', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' },
    { id: 'goals', name: 'Goals', color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' },
    { id: 'reminders', name: 'Reminders', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
    { id: 'family', name: 'Family', color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300' },
    { id: 'gamification', name: 'Gamification', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300' }
  ];

  const handleDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPosition(position);
  };

  const handleDrop = (e, position) => {
    e.preventDefault();
    
    if (draggedWidget) {
      const newWidgets = [...widgets];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget.id);
      
      if (draggedIndex !== -1) {
        const [draggedItem] = newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(position, 0, draggedItem);
        
        // Update positions
        const updatedWidgets = newWidgets.map((widget, index) => ({
          ...widget,
          position: index
        }));
        
        setWidgets(updatedWidgets);
      }
    }
    
    setDraggedWidget(null);
    setDragOverPosition(null);
  };

  const toggleWidgetVisibility = (widgetId) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, isVisible: !widget.isVisible }
        : widget
    ));
  };

  const changeWidgetSize = (widgetId, newSize) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, customSize: newSize }
        : widget
    ));
  };

  const addWidget = (availableWidget) => {
    const newWidget = {
      ...availableWidget,
      position: widgets.length,
      isVisible: true,
      customSize: availableWidget.size
    };
    
    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const resetToDefault = () => {
    loadDashboardConfiguration();
  };

  const saveDashboardConfiguration = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('finguard-token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Save to localStorage as backup and immediate persistence
      const configData = {
        widgets: widgets,
        layout: widgets.map(w => ({ id: w.id, enabled: w.enabled, position: w.position })),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('dashboard-config', JSON.stringify(configData));
      
      // Make API call to backend
      const response = await fetch('http://localhost:5000/api/user/dashboard-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save dashboard configuration to server');
      }
      
      console.log('Dashboard configuration saved successfully:', widgets);
      
      if (window.showToast) {
        window.showToast('Dashboard configuration saved successfully!', 'success');
      } else {
        alert('Dashboard configuration saved successfully!');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving dashboard configuration:', error);
      
      // If API fails but localStorage succeeded, still show partial success
      if (localStorage.getItem('dashboard-config')) {
        if (window.showToast) {
          window.showToast('Configuration saved locally. Please check your connection.', 'warning');
        } else {
          alert('Configuration saved locally. Please check your connection.');
        }
      } else {
        if (window.showToast) {
          window.showToast('Error saving dashboard configuration. Please try again.', 'error');
        } else {
          alert('Error saving dashboard configuration. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300';
  };

  const renderWidgetContent = (widget) => {
    const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const valueColor = isDarkMode ? 'text-white' : 'text-gray-900';
    
    switch (widget.id) {
      case 'financial-health':
        return (
          <div className="flex items-center justify-between w-full">
            <div>
              <div className={`text-xs ${textColor}`}>Health Score</div>
              <div className={`text-lg font-bold text-green-500`}>85/100</div>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
              A
            </div>
          </div>
        );
      
      case 'quick-actions':
        return (
          <div className="flex space-x-2 w-full">
            <div className="flex-1 bg-blue-500 rounded text-white text-xs text-center py-1">+ Income</div>
            <div className="flex-1 bg-red-500 rounded text-white text-xs text-center py-1">+ Expense</div>
          </div>
        );
      
      case 'recent-transactions':
        return (
          <div className="w-full space-y-1">
            <div className="flex justify-between">
              <span className={`text-xs ${textColor}`}>Salary</span>
              <span className={`text-xs text-green-600 font-medium`}>+Rs.100,000</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${textColor}`}>Food</span>
              <span className={`text-xs text-red-600 font-medium`}>-Rs.8,000</span>
            </div>
          </div>
        );
      
      case 'budget-overview':
        return (
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs ${textColor}`}>Aug Budget</span>
              <span className={`text-xs ${valueColor}`}>75%</span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>
        );
      
      case 'spending-categories':
        return (
          <div className="flex justify-between w-full text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span className={textColor}>Food</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              <span className={textColor}>Transport</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className={textColor}>Bills</span>
            </div>
          </div>
        );
      
      case 'savings-progress':
        return (
          <div className="text-center w-full">
            <div className={`text-xs ${textColor}`}>Savings Goal</div>
            <div className={`text-sm font-bold ${valueColor}`}>Rs.25,000 / Rs.50,000</div>
            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1 mt-1">
              <div className="bg-green-500 h-1 rounded-full" style={{width: '50%'}}></div>
            </div>
          </div>
        );
      
      case 'bill-reminders':
        return (
          <div className="w-full space-y-1">
            <div className="flex justify-between">
              <span className={`text-xs ${textColor}`}>Electricity</span>
              <span className={`text-xs text-orange-600`}>Due in 3 days</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-xs ${textColor}`}>Internet</span>
              <span className={`text-xs text-red-600`}>Overdue</span>
            </div>
          </div>
        );
      
      case 'family-summary':
        return (
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div>
                <div className={`text-xs ${textColor}`}>Family Spending</div>
                <div className={`text-sm font-bold ${valueColor}`}>Rs.45,000</div>
              </div>
              <div className="text-right">
                <div className={`text-xs ${textColor}`}>4 Members</div>
                <div className={`text-xs text-blue-600`}>View Details</div>
              </div>
            </div>
          </div>
        );
      
      case 'achievement-badges':
        return (
          <div className="flex space-x-2 w-full items-center">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">🏆</div>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">⭐</div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🎯</div>
            <span className={`text-xs ${textColor} ml-2`}>+5 more</span>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center w-full">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {widget.icon} Widget Preview
            </span>
          </div>
        );
    }
  };

  const renderWidgetPreview = (widget, index) => {
    const isDraggedOver = dragOverPosition === index;
    
    return (
      <div
        key={widget.id}
        className={`${sizeClasses[widget.customSize]} p-4 rounded-lg border-2 transition-all duration-200 ${
          widget.isVisible 
            ? isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            : isDarkMode ? 'bg-gray-800 border-gray-700 opacity-50' : 'bg-gray-100 border-gray-300 opacity-50'
        } ${isDraggedOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
        draggable={isEditing}
        onDragStart={(e) => handleDragStart(e, widget)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {isEditing && <Grip className="w-4 h-4 text-gray-400 mr-2 cursor-move" />}
            <span className="text-2xl mr-2">{widget.icon}</span>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {widget.name}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {widget.description}
              </p>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => toggleWidgetVisibility(widget.id)}
                className={`p-1 rounded transition-colors ${
                  widget.isVisible
                    ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title={widget.isVisible ? 'Hide widget' : 'Show widget'}
              >
                {widget.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              
              <select
                value={widget.customSize}
                onChange={(e) => changeWidgetSize(widget.id, e.target.value)}
                className={`text-xs px-1 py-1 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                title="Change widget size"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              
              <button
                onClick={() => removeWidget(widget.id)}
                className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="Remove widget"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(widget.category)}`}>
            {categories.find(cat => cat.id === widget.category)?.name || widget.category}
          </span>
        </div>
        
        {/* Widget Preview Content */}
        <div className={`mt-3 h-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-3 flex items-center`}>
          {renderWidgetContent(widget)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
          <Layout className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dashboard Customization
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Drag and drop to customize your dashboard layout
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing && (
            <>
              <button
                onClick={resetToDefault}
                className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
              
              <button
                onClick={saveDashboardConfiguration}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </button>
            </>
          )}
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'Exit Edit Mode' : 'Customize'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Available Widgets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableWidgets
              .filter(available => !widgets.some(widget => widget.id === available.id))
              .map((widget) => (
                <div
                  key={widget.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:border-blue-500 ${
                    isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => addWidget(widget)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{widget.icon}</span>
                      <div>
                        <h4 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {widget.name}
                        </h4>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {widget.description}
                        </p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(widget.category)}`}>
                      {categories.find(cat => cat.id === widget.category)?.name || widget.category}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dashboard Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
        {widgets.map((widget, index) => renderWidgetPreview(widget, index))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-12">
          <Layout className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Widgets Configured
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Start customizing your dashboard by adding widgets from the available options.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Customizing
          </button>
        </div>
      )}

      {isEditing && (
        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Customization Tips
          </h3>
          <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>• Drag widgets to reorder them on your dashboard</li>
            <li>• Use the eye icon to show/hide widgets</li>
            <li>• Change widget sizes using the dropdown menu</li>
            <li>• Add new widgets from the available widgets section</li>
            <li>• Click "Save Layout" to persist your changes</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DashboardCustomization;