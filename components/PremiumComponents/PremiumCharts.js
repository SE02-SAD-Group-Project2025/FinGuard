import React from 'react'
import { BarChart, PieChart } from 'lucide-react'; // Example icons
import { callback } from 'chart.js/helpers';


const PremiumCharts = () => {
  // Sample data for the graphs
  const incomeData = [
    { month: 'Jan', amount: 20000 },
    { month: 'Feb', amount: 22000 },
    { month: 'Mar', amount: 25000 }
  ];

  const expenseData = [
    { category: 'Food', amount: 5000 },
    { category: 'Transport', amount: 3000 },
    { category: 'Entertainment', amount: 2000 }
  ];


  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Monthly Income Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">Monthly Income Trend</h3>
        </div>
        <div className="h-64">
          <div className="flex items-end h-full space-x-2">
            {incomeData.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 rounded-t-sm"
                  style={{ height: `${(item.amount / 30000) * 100}%` }}
                ></div>
                <span className="text-xs mt-1">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Expense Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-green-500" />
          <h3 className="font-medium">Expense Breakdown</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40">
            {expenseData.map((item, index, array) => {
              const total = array.reduce((sum, i) => sum + i.amount, 0);
              const percentage = (item.amount / total) * 100;
              const rotation = array.slice(0, index).reduce((sum, i) => sum + (i.amount / total) * 360, 0);
              
              return (
                <div
                  key={index}
                  className="absolute top-0 left-0 w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(
                      from ${rotation}deg,
                      ${['#4ade80', '#60a5fa', '#f472b6'][index]} ${percentage}%,
                      transparent 0
                    )`
                  }}
                ></div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4">
            {expenseData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: ['#4ade80', '#60a5fa', '#f472b6'][index] }}
                ></div>
                <span className="text-xs">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumCharts