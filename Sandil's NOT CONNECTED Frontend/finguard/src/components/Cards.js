import React from 'react';

const Cards = () => {
  const cardData = [
    {
      icon: '💰',
      title: 'Current Balance',
      amount: 'Rs.108,000.00',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      icon: '😟',
      title: 'Liabilities',
      amount: 'Rs.4,000',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
    {
      icon: '💸',
      title: "Month's Income",
      amount: 'Rs.49,000',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      icon: '🛒',
      title: "Month's Expense",
      amount: 'Rs.21,000',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
  ];

  return (
    <div className="bg-white-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardData.map((card, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-md ${card.bgColor} text-center`}
            >
              <div className={`text-2xl mb-2 ${card.textColor}`}>{card.icon}</div>
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <p className="text-lg font-bold">{card.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cards;