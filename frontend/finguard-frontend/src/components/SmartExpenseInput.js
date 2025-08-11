import React, { useState, useEffect } from 'react';
import { Brain, Check, X, Lightbulb, TrendingUp } from 'lucide-react';
import smartCategorization from '../services/smartCategorizationService';

const SmartExpenseInput = ({ onSubmit, categories, initialData = {} }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    ...initialData
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLearning, setIsLearning] = useState(false);

  // Get category suggestions when description changes
  useEffect(() => {
    if (formData.description && formData.description.length > 3) {
      const categorySuggestions = smartCategorization.getCategorySuggestions(formData.description);
      setSuggestions(categorySuggestions);
      setShowSuggestions(categorySuggestions.length > 0 && !formData.category);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.description, formData.category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    // Save the user's categorization choice for learning
    smartCategorization.saveUserPattern(formData.description, formData.category);
    setIsLearning(true);
    
    // Brief learning animation
    setTimeout(() => setIsLearning(false), 1000);

    // Call parent's submit handler
    if (onSubmit) {
      await onSubmit(formData);
    }

    // Reset form
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const applySuggestion = (suggestion) => {
    setFormData({ ...formData, category: suggestion.category });
    setShowSuggestions(false);
  };

  const dismissSuggestions = () => {
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center mb-4">
        <Brain className={`w-5 h-5 mr-2 ${isLearning ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
        <h3 className="text-lg font-semibold text-gray-900">Smart Expense Entry</h3>
        {isLearning && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
            Learning...
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (Rs.)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description with smart suggestions */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What did you spend on?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          {/* Smart Category Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
                    Smart Suggestions
                  </div>
                  <button
                    type="button"
                    onClick={dismissSuggestions}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                        <span className="text-xs text-gray-500">
                          {Math.round(suggestion.confidence)}%
                        </span>
                      </div>
                      <Check className="w-4 h-4 text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              suggestions.some(s => s.category === formData.category) 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category.id || category} value={category.name || category}>
                {category.name || category}
              </option>
            ))}
          </select>
          {suggestions.some(s => s.category === formData.category) && (
            <p className="mt-1 text-xs text-blue-600 flex items-center">
              <Brain className="w-3 h-3 mr-1" />
              AI Suggestion Applied
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!formData.amount || !formData.category || !formData.description}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <span>Add Expense</span>
          {isLearning && <Brain className="w-4 h-4 ml-2 animate-spin" />}
        </button>
      </form>

      {/* Learning Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>AI learns from your patterns</span>
          <span>
            {Object.keys(smartCategorization.userPatterns).length} categories learned
          </span>
        </div>
      </div>
    </div>
  );
};

export default SmartExpenseInput;