import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle,
  ShoppingCart,
  Car,
  Utensils,
  Zap,
  RotateCcw,
  CheckCircle,
  XCircle,
  SparklesIcon
} from 'lucide-react';
import PremiumNavbar from './PremiumNavbar';

const AIBudgetPage = () => {
  const [timeframe, setTimeframe] = useState('This month');
  const [viewMode, setViewMode] = useState('monthly');
  const [simulatorValues, setSimulatorValues] = useState({
    food: 25000,
    transport: 15000,
    utilities: 8000,
    shopping: 12000
  });
  const [explainModalState, setExplainModalState] = useState({
    isOpen: false,
    categoryId: null
  });
  const [appliedChanges, setAppliedChanges] = useState([]);

  // Mock data
  const userInsights = [
    {
      id: 1,
      text: "Your food spending increased by 12% this month",
      type: "warning",
      feedback: null
    },
    {
      id: 2,
      text: "Subscription expenses are recurring but underutilized",
      type: "info",
      feedback: null
    },
    {
      id: 3,
      text: "Transport costs are 15% below optimal range",
      type: "success",
      feedback: null
    }
  ];

  const categoryData = [
    {
      id: 'food',
      name: 'Food & Dining',
      icon: Utensils,
      current: 28200,
      suggested: 25000,
      status: 'over',
      color: 'bg-red-500'
    },
    {
      id: 'transport',
      name: 'Transport',
      icon: Car,
      current: 15000,
      suggested: 18000,
      status: 'under',
      color: 'bg-green-500'
    },
    {
      id: 'utilities',
      name: 'Utilities',
      icon: Zap,
      current: 8000,
      suggested: 8000,
      status: 'optimal',
      color: 'bg-blue-500'
    },
    {
      id: 'shopping',
      name: 'Shopping',
      icon: ShoppingCart,
      current: 12000,
      suggested: 10000,
      status: 'over',
      color: 'bg-orange-500'
    }
  ];

  const budgetHistory = [
    {
      date: '2025-07-10',
      category: 'Food & Dining',
      previous: 30000,
      new: 25000,
      source: 'AI',
      applied: false
    },
    {
      date: '2025-07-08',
      category: 'Shopping',
      previous: 15000,
      new: 12000,
      source: 'Manual',
      applied: true
    }
  ];

  const handleSliderChange = (category, value) => {
    setSimulatorValues(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleApplyBudget = () => {
    const newChanges = categoryData.map(cat => ({
      date: new Date().toISOString().split('T')[0],
      category: cat.name,
      previous: cat.current,
      new: cat.suggested,
      source: 'AI',
      applied: true
    }));
    setAppliedChanges(prev => [...prev, ...newChanges]);
    
    // Simulate success notification
    setTimeout(() => {
      alert('AI Budget recommendations applied successfully!');
    }, 500);
  };

  const totalSavings = categoryData.reduce((sum, cat) => {
    return sum + (cat.current - cat.suggested);
  }, 0);

  const StatusBadge = ({ status }) => {
    const configs = {
      over: { color: 'bg-red-100 text-red-800', text: 'Overspent' },
      under: { color: 'bg-green-100 text-green-800', text: 'Under Budget' },
      optimal: { color: 'bg-blue-100 text-blue-800', text: 'Optimal' }
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${configs[status].color}`}>
        {configs[status].text}
      </span>
    );
  };

  const ExplainModal = ({ isOpen, onClose, categoryId }) => {
    if (!isOpen) return null;

    // Find the category data based on the ID
    const category = categoryData.find(cat => cat.id === categoryId) || categoryData[0];
    const difference = category.current - category.suggested;
    const percentageChange = Math.abs(difference / category.current * 100).toFixed(0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Why this recommendation for {category.name}?</h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
              <p className="text-blue-800 text-sm">
                Based on your spending patterns over the last 3 months, your {category.name.toLowerCase()} expenses 
                have {difference > 0 ? 'increased' : 'decreased'} by {percentageChange}%. 
                Our model suggests {difference > 0 ? 'reducing' : 'increasing'} by LKR {Math.abs(difference).toLocaleString()} 
                to align with your savings goals.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Peer Comparison</h4>
              <p className="text-green-800 text-sm">
                Users with similar income levels spend {difference > 0 ? '18% less' : '12% more'} on {category.name.toLowerCase()}. 
                This adjustment brings you closer to optimal spending patterns.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  handleApplyBudget();
                  onClose();
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply This Change
              </button>
              <button 
                onClick={onClose}
                className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PremiumNavbar/>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hello, User 👋</h1>
              <div className="flex items-center mt-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Optimized • 78% Efficient
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>This month</option>
                <option>Last 3 months</option>
                <option>Custom range</option>
              </select>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">AI Budget Insights</h2>
          </div>
          
          <div className="space-y-3">
            {userInsights.map((insight) => (
              <div key={insight.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <p className="text-gray-800 flex-1">{insight.text}</p>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-green-600 hover:text-green-700 transition-colors">
                      <ThumbsUp size={18} />
                    </button>
                    <button className="text-red-600 hover:text-red-700 transition-colors">
                      <ThumbsDown size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Recommendations */}
        <div className="bg-white rounded-2xl p-6 shadow-sm" id="category-recommendations">
          <h2 className="text-xl font-semibold mb-6">Smart Category Recommendations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryData.map((category) => {
              const Icon = category.icon;
              const difference = category.current - category.suggested;
              
              return (
                <div 
                  key={category.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${category.color} bg-opacity-20`}>
                        <Icon className={`w-5 h-5 ${category.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">LKR {category.current.toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusBadge status={category.status} />
                  </div>
                  
                  {difference !== 0 && (
                    <div className="mb-3">
                      <div className="flex items-center">
                        {difference > 0 ? (
                          <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${difference > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          {difference > 0 ? 'Reduce' : 'Increase'} by LKR {Math.abs(difference).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        New limit: LKR {category.suggested.toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      Apply to Budget
                    </button>
                    <button 
                      onClick={() => setExplainModalState({ isOpen: true, categoryId: category.id })}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <HelpCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Before vs After Comparison */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Before vs. After Budget Comparison</h2>
          
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{category.name}</span>
                  <span className="text-sm text-red-600">
                    {category.current - category.suggested > 0 ? '↓' : '↑'} LKR {Math.abs(category.current - category.suggested).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {/* Before */}
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 w-16">Before</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-red-400 h-2 rounded-full"
                        style={{width: `${(category.current / 35000) * 100}%`}}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-20">LKR {category.current.toLocaleString()}</span>
                  </div>
                  
                  {/* After */}
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 w-16">After</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-400 h-2 rounded-full"
                        style={{width: `${(category.suggested / 35000) * 100}%`}}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-20">LKR {category.suggested.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What-If Simulator */}
        <div className="bg-white rounded-2xl p-6 shadow-sm" id="budget-simulator">
          <h2 className="text-xl font-semibold mb-6">What-If Budget Simulator</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className="text-sm text-gray-600">
                      LKR {simulatorValues[category.id]?.toLocaleString() || category.suggested.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    value={simulatorValues[category.id] || category.suggested}
                    onChange={(e) => handleSliderChange(category.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">Impact Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-800">Total Monthly Budget:</span>
                  <span className="font-medium text-blue-900">
                    LKR {Object.values(simulatorValues).reduce((a, b) => a + b, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Projected Savings:</span>
                  <span className="font-medium text-green-600">
                    LKR {Math.max(0, 80000 - Object.values(simulatorValues).reduce((a, b) => a + b, 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Savings Goal Timeline:</span>
                  <span className="font-medium text-blue-900">8.2 months</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Decision History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Budget Decision History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Previous</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">New</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...budgetHistory, ...appliedChanges].map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-600">{item.date}</td>
                    <td className="py-3 px-4 text-gray-900">{item.category}</td>
                    <td className="py-3 px-4 text-gray-600">LKR {item.previous.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">LKR {item.new.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.source === 'AI' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        <RotateCcw size={16} className="inline mr-1" />
                        Revert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Apply Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">
                Total potential savings: <span className="font-medium text-green-600">LKR {totalSavings.toLocaleString()}</span>
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                <SparklesIcon size={16} className="mr-2" />
                Generate
              </button>
              <button 
                onClick={handleApplyBudget}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Brain size={16} className="mr-2" />
                Apply AI Budget
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explain Modal */}
      <ExplainModal 
        isOpen={explainModalState.isOpen} 
        onClose={() => setExplainModalState({ isOpen: false, categoryId: null })}
        categoryId={explainModalState.categoryId}
      />
    </div>
  );
}

export default AIBudgetPage;