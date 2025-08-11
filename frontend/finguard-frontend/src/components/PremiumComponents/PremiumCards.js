import React, { useState, useEffect } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import {
  Wallet,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  Target,
  PiggyBank,
  CreditCard,
  TrendingDown
} from 'lucide-react';

const PremiumCards = () => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousMonthData, setPreviousMonthData] = useState(null);

  const fetchFinancialData = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    try {
      const [currentResponse, previousResponse, transactionResponse, liabilitiesResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/summary?month=${previousMonth}&year=${previousYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/liabilities', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (currentResponse.ok && previousResponse.ok && transactionResponse.ok) {
        const currentData = await currentResponse.json();
        const previousData = await previousResponse.json();
        const transactions = await transactionResponse.json();
        
        let liabilities = 0;
        if (liabilitiesResponse.ok) {
          const liabilitiesData = await liabilitiesResponse.json();
          liabilities = liabilitiesData.reduce((sum, liability) => sum + parseFloat(liability.current_balance || 0), 0);
        }

        // Calculate additional premium metrics
        const totalAssets = currentData.balance + (transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0));
        const netWorth = totalAssets - liabilities;

        setFinancialData({
          ...currentData,
          totalAssets,
          netWorth,
          liabilities
        });
        setPreviousMonthData(previousData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const formatCurrency = (amount) => {
    return `Rs.${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-40 rounded-2xl bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const cardData = [
    {
      icon: <PiggyBank className="w-5 h-5" />,
      title: 'Net Worth',
      amount: formatCurrency(financialData?.netWorth || 0),
      change: `${calculateChange(financialData?.netWorth || 0, (previousMonthData?.balance || 0) - (financialData?.liabilities || 0))}% from last month`,
      gradient: 'bg-gradient-to-br from-purple-400 to-purple-600',
      premium: true
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: 'Current Balance',
      amount: formatCurrency(financialData?.balance || 0),
      change: `${calculateChange(financialData?.balance || 0, previousMonthData?.balance || 0)}% from last month`,
      gradient: 'bg-gradient-to-br from-green-400 to-green-600'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Month's Income",
      amount: formatCurrency(financialData?.income || 0),
      change: `${calculateChange(financialData?.income || 0, previousMonthData?.income || 0)}% from last month`,
      gradient: 'bg-gradient-to-br from-blue-400 to-blue-600'
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "Month's Expense",
      amount: formatCurrency(financialData?.expenses || 0),
      change: `${calculateChange(financialData?.expenses || 0, previousMonthData?.expenses || 0)}% from last month`,
      gradient: 'bg-gradient-to-br from-orange-400 to-orange-600'
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Total Liabilities',
      amount: formatCurrency(financialData?.liabilities || 0),
      change: 'Debt tracking',
      gradient: 'bg-gradient-to-br from-red-400 to-red-600'
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Savings Rate',
      amount: `${financialData?.income > 0 ? ((financialData.income - financialData.expenses) / financialData.income * 100).toFixed(1) : 0}%`,
      change: 'Premium Analytics',
      gradient: 'bg-gradient-to-br from-teal-400 to-teal-600',
      premium: true
    }
  ];

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {cardData.map((card, index) => (
            <div
              key={index}
              className={`w-full h-40 rounded-2xl p-6 text-white relative overflow-hidden 
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.gradient}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{card.icon}</span>
                  <h3 className="text-base font-medium opacity-90">{card.title}</h3>
                </div>
                {card.premium && (
                  <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full font-medium">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold mb-2">{card.amount}</p>
              <p className="text-sm font-medium opacity-80">{card.change}</p>
              
              {/* Premium indicator glow effect */}
              {card.premium && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-300 bg-opacity-30 rounded-bl-2xl"></div>
              )}
            </div>
          ))}
        </div>
      </div>
  );
};

export default PremiumCards;