import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const AIRecommendations = () => {
  const navigate = useNavigate();

  const handleApplyChange = () => {
  
    navigate('/aiBudget#category-recommendations');
    
    setTimeout(() => {
      const element = document.getElementById('category-recommendations');
      if(element) {
        element.scrollIntoView({ behavior: 'smooth'});
      }
    }, 100);
  };

  const handleSuggestAlternatives = () => {
    navigate('/aiBudget#budget-simulator');
    
    // Optional: Scroll to the section after navigation
    setTimeout(() => {
      const element = document.getElementById('budget-simulator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md mt-10">
      <h3 className="text-xl font-bold text-gray-900 mb-4">AI Recommendations</h3>
      
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-medium">Dining Optimization</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
              High Impact
            </span>
          </div>
          <p className="text-gray-600">
            Reduce dining out from <strong>4x</strong> to <strong>2x weekly</strong> to save 
            <span className="font-bold text-green-600"> LKR 1,000/month</span>.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Confidence</div>
          <div className="w-20 bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
          </div>
          <span className="text-xs font-medium">95%</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-3 rounded-lg">
          <div className="text-sm text-gray-500">Current</div>
          <div className="font-bold">LKR 15,000/mo</div>
        </div>
        <div className="border p-3 rounded-lg">
          <div className="text-sm text-gray-500">Projected</div>
          <div className="font-bold text-green-600">LKR 10,000/mo</div>
        </div>
        <div className="border p-3 rounded-lg">
          <div className="text-sm text-gray-500">Annual Savings</div>
          <div className="font-bold">LKR 2,160</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={handleApplyChange}
        >
          Apply This Change
        </button>
        <button 
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          onClick={handleSuggestAlternatives}
        >
          Suggest Alternatives
        </button>
      </div>
    </div>
  );
};

export default AIRecommendations;