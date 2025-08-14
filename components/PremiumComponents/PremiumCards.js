import React from 'react';
import {
  Wallet,
  AlertCircle,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';

const PremiumCards = () => {
  const cardData = [
    {
      icon: <Wallet className="w-5 h-5" /> ,
      title: 'Current Balance',
      amount: 'Rs.108,000.00',
      change: '+8.5% from last month',
      gradient: 'bg-gradient-to-br from-green-400 to-green-600'
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Liabilities',
      amount: 'Rs.4,000',
      change: '-2.3% from last month',
      gradient: 'bg-gradient-to-br from-red-400 to-red-600'
    },
    {
      icon:  <TrendingUp className="w-5 h-5" />,
      title: "Month's Income",
      amount: 'Rs.49,000',
      change: '+15.2% from last month',
      gradient: 'bg-gradient-to-br from-blue-400 to-blue-600'
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "Month's Expense",
      amount: 'Rs.21,000',
      change: '-4.1% from last month',
      gradient: 'bg-gradient-to-br from-orange-400 to-orange-600'
    }
  ];

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardData.map((card, index) => (
            <div
              key={index}
              className={`w-full h-40 rounded-2xl p-6 text-white relative overflow-hidden 
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.gradient}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-base font-medium opacity-90">{card.title}</h3>
              </div>
              <p className="text-3xl font-bold mb-2">{card.amount}</p>
              <p className="text-sm font-medium opacity-80">{card.change}</p>
            </div>
          ))}
        </div>
      </div>
  );
};

export default PremiumCards;