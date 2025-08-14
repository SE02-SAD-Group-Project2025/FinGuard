import React from 'react';
import PremiumNavbar from './PremiumNavbar';
import PremiumCards from './PremiumCards';
import AICard from './AICard';
import PremiumCharts from './PremiumCharts';
import Family from './Family';
import { 
CheckCircle, 
PlusCircle,
MinusCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumDashboard = () => {
  const navigate = useNavigate();

  const handleAddIncome = () => {

    navigate('/income');
  };
  const handleAddExpense = () => {

    navigate('/expense');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PremiumNavbar/>
      <PremiumCards />
      <AICard />
      <PremiumCharts/>
      <Family/>
      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-600">
              Quick Actions
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button 
              className="flex items-center px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-green-200"
              onClick={handleAddIncome}
            >
              <PlusCircle size={18} className="mr-2" />
              Add Income
            </button>
            <button 
              className="flex items-center px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md hover:shadow-red-200"
              onClick={handleAddExpense}
            >
              <MinusCircle size={18} className="mr-2" />
              Add Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumDashboard;