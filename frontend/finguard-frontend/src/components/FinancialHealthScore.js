import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  Brain,
  Award,
  BarChart3,
  DollarSign,
  CreditCard,
  PiggyBank,
  Calendar,
  Eye
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const FinancialHealthScore = () => {
  const { isDarkMode } = useTheme();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Financial health calculation logic
  const calculateFinancialHealth = (data) => {
    let totalScore = 0;
    const metrics = [];

    // 1. Emergency Fund Score (25 points)
    const monthlyExpenses = data.monthlyExpenses || 1;
    const emergencyFundMonths = data.emergencyFund / monthlyExpenses;
    let emergencyScore = 0;
    if (emergencyFundMonths >= 6) emergencyScore = 25;
    else if (emergencyFundMonths >= 3) emergencyScore = 20;
    else if (emergencyFundMonths >= 1) emergencyScore = 15;
    else if (emergencyFundMonths >= 0.5) emergencyScore = 10;
    else emergencyScore = 0;

    metrics.push({
      name: 'Emergency Fund',
      score: emergencyScore,
      maxScore: 25,
      value: emergencyFundMonths,
      unit: 'months',
      icon: Shield,
      color: emergencyScore >= 20 ? 'green' : emergencyScore >= 10 ? 'yellow' : 'red',
      description: 'Emergency fund coverage for monthly expenses',
      recommendation: emergencyFundMonths < 3 ? 'Build emergency fund to cover 3-6 months of expenses' : 'Great emergency fund coverage!'
    });

    // 2. Savings Rate Score (20 points)
    const savingsRate = data.monthlyIncome > 0 ? (data.monthlySavings / data.monthlyIncome) * 100 : 0;
    let savingsScore = 0;
    if (savingsRate >= 20) savingsScore = 20;
    else if (savingsRate >= 15) savingsScore = 16;
    else if (savingsRate >= 10) savingsScore = 12;
    else if (savingsRate >= 5) savingsScore = 8;
    else savingsScore = 0;

    metrics.push({
      name: 'Savings Rate',
      score: savingsScore,
      maxScore: 20,
      value: savingsRate,
      unit: '%',
      icon: PiggyBank,
      color: savingsScore >= 16 ? 'green' : savingsScore >= 8 ? 'yellow' : 'red',
      description: 'Percentage of income saved monthly',
      recommendation: savingsRate < 10 ? 'Try to save at least 10% of your income' : 'Excellent savings discipline!'
    });

    // 3. Debt-to-Income Ratio Score (20 points)
    const debtToIncomeRatio = data.monthlyIncome > 0 ? (data.monthlyDebtPayments / data.monthlyIncome) * 100 : 0;
    let debtScore = 0;
    if (debtToIncomeRatio <= 10) debtScore = 20;
    else if (debtToIncomeRatio <= 20) debtScore = 16;
    else if (debtToIncomeRatio <= 30) debtScore = 12;
    else if (debtToIncomeRatio <= 40) debtScore = 8;
    else debtScore = 0;

    metrics.push({
      name: 'Debt-to-Income',
      score: debtScore,
      maxScore: 20,
      value: debtToIncomeRatio,
      unit: '%',
      icon: CreditCard,
      color: debtScore >= 16 ? 'green' : debtScore >= 8 ? 'yellow' : 'red',
      description: 'Monthly debt payments vs income',
      recommendation: debtToIncomeRatio > 30 ? 'Focus on reducing debt payments' : 'Healthy debt levels!'
    });

    // 4. Budget Adherence Score (15 points)
    const budgetAdherence = data.budgetItems ? 
      data.budgetItems.reduce((acc, item) => {
        const usage = item.spent / item.budget;
        if (usage <= 1) return acc + 1;
        return acc;
      }, 0) / data.budgetItems.length * 100 : 50;

    let budgetScore = 0;
    if (budgetAdherence >= 90) budgetScore = 15;
    else if (budgetAdherence >= 75) budgetScore = 12;
    else if (budgetAdherence >= 60) budgetScore = 9;
    else if (budgetAdherence >= 40) budgetScore = 6;
    else budgetScore = 0;

    metrics.push({
      name: 'Budget Discipline',
      score: budgetScore,
      maxScore: 15,
      value: budgetAdherence,
      unit: '%',
      icon: Target,
      color: budgetScore >= 12 ? 'green' : budgetScore >= 6 ? 'yellow' : 'red',
      description: 'How well you stick to your budgets',
      recommendation: budgetAdherence < 75 ? 'Improve budget adherence with better tracking' : 'Great budget discipline!'
    });

    // 5. Investment Diversification Score (10 points)
    const investmentTypes = data.investmentTypes || 0;
    let investmentScore = 0;
    if (investmentTypes >= 4) investmentScore = 10;
    else if (investmentTypes >= 3) investmentScore = 8;
    else if (investmentTypes >= 2) investmentScore = 6;
    else if (investmentTypes >= 1) investmentScore = 4;
    else investmentScore = 0;

    metrics.push({
      name: 'Investment Diversity',
      score: investmentScore,
      maxScore: 10,
      value: investmentTypes,
      unit: 'types',
      icon: BarChart3,
      color: investmentScore >= 8 ? 'green' : investmentScore >= 4 ? 'yellow' : 'red',
      description: 'Diversification of investment portfolio',
      recommendation: investmentTypes < 3 ? 'Consider diversifying your investments' : 'Well-diversified portfolio!'
    });

    // 6. Financial Goal Progress Score (10 points)
    const goalProgress = data.financialGoals ? 
      data.financialGoals.reduce((acc, goal) => acc + (goal.progress || 0), 0) / data.financialGoals.length : 0;

    let goalScore = 0;
    if (goalProgress >= 80) goalScore = 10;
    else if (goalProgress >= 60) goalScore = 8;
    else if (goalProgress >= 40) goalScore = 6;
    else if (goalProgress >= 20) goalScore = 4;
    else goalScore = 0;

    metrics.push({
      name: 'Goal Achievement',
      score: goalScore,
      maxScore: 10,
      value: goalProgress,
      unit: '%',
      icon: Award,
      color: goalScore >= 8 ? 'green' : goalScore >= 4 ? 'yellow' : 'red',
      description: 'Progress towards financial goals',
      recommendation: goalProgress < 50 ? 'Set and track specific financial goals' : 'Making great progress on goals!'
    });

    totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0);

    return {
      totalScore,
      maxScore: 100,
      metrics,
      grade: getHealthGrade(totalScore),
      insights: generateInsights(metrics, totalScore)
    };
  };

  const getHealthGrade = (score) => {
    if (score >= 90) return { letter: 'A+', color: 'green', label: 'Excellent' };
    if (score >= 80) return { letter: 'A', color: 'green', label: 'Very Good' };
    if (score >= 70) return { letter: 'B', color: 'blue', label: 'Good' };
    if (score >= 60) return { letter: 'C', color: 'yellow', label: 'Fair' };
    if (score >= 50) return { letter: 'D', color: 'orange', label: 'Poor' };
    return { letter: 'F', color: 'red', label: 'Critical' };
  };

  const generateInsights = (metrics, totalScore) => {
    const insights = [];
    
    // Find weakest areas
    const weakMetrics = metrics.filter(m => (m.score / m.maxScore) < 0.6).sort((a, b) => (a.score/a.maxScore) - (b.score/b.maxScore));
    const strongMetrics = metrics.filter(m => (m.score / m.maxScore) >= 0.8);

    if (weakMetrics.length > 0) {
      insights.push({
        type: 'improvement',
        icon: AlertCircle,
        title: 'Priority Improvements',
        description: `Focus on improving ${weakMetrics[0].name.toLowerCase()} to boost your financial health score.`,
        action: weakMetrics[0].recommendation
      });
    }

    if (strongMetrics.length > 0) {
      insights.push({
        type: 'strength',
        icon: CheckCircle,
        title: 'Financial Strengths',
        description: `You're doing well with ${strongMetrics.map(m => m.name.toLowerCase()).join(', ')}.`,
        action: 'Keep up the good work!'
      });
    }

    // Overall assessment
    if (totalScore >= 80) {
      insights.push({
        type: 'success',
        icon: Award,
        title: 'Excellent Financial Health',
        description: 'Your financial habits are strong across multiple areas.',
        action: 'Continue maintaining these healthy financial practices.'
      });
    } else if (totalScore >= 60) {
      insights.push({
        type: 'warning',
        icon: Info,
        title: 'Room for Improvement',
        description: 'Your financial foundation is solid but could be strengthened.',
        action: 'Focus on the recommended improvements to reach the next level.'
      });
    } else {
      insights.push({
        type: 'critical',
        icon: AlertCircle,
        title: 'Financial Health Needs Attention',
        description: 'Several areas of your finances need immediate attention.',
        action: 'Consider consulting with a financial advisor for personalized guidance.'
      });
    }

    return insights;
  };

  // Load financial health data
  useEffect(() => {
    const loadHealthData = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('finguard-token');
        if (!token) {
          console.log('No auth token found');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/summary/financial-health', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch financial health data');
        }

        const apiData = await response.json();

        const health = calculateFinancialHealth(apiData);
        setHealthData(health);
      } catch (error) {
        console.error('Error loading financial health data:', error);
        // Fallback to empty data structure instead of mock data
        const emptyData = {
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlySavings: 0,
          emergencyFund: 0,
          monthlyDebtPayments: 0,
          investmentTypes: 0,
          budgetItems: [],
          financialGoals: [
            { name: 'Emergency Fund', progress: 0 },
            { name: 'Debt Reduction', progress: 100 },
            { name: 'Savings Rate', progress: 0 }
          ]
        };

        const health = calculateFinancialHealth(emptyData);
        setHealthData(health);
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, []);

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-8 shadow-sm transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl p-6 shadow-sm transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Financial Health Score</h2>
              <p className={`${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>AI-powered analysis of your financial wellness</p>
            </div>
          </div>
          <div className="flex items-center">
            <Brain className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm text-blue-600">AI Analysis</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score */}
        <div className={`rounded-xl p-6 shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${getScoreColor(healthData.totalScore, healthData.maxScore)} transition-all duration-1000 ease-out`}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={`${healthData.totalScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(healthData.totalScore, healthData.maxScore)}`}>
                    {healthData.totalScore}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>out of 100</div>
                </div>
              </div>
            </div>
            
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
              healthData.grade.color === 'green' ? 'bg-green-100 text-green-800' :
              healthData.grade.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              healthData.grade.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              healthData.grade.color === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {healthData.grade.letter} - {healthData.grade.label}
            </div>
            
            <p className={`text-sm mt-3 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Your financial health is {healthData.grade.label.toLowerCase()}. 
              {healthData.totalScore >= 80 ? ' Keep up the excellent work!' :
               healthData.totalScore >= 60 ? ' You\'re on the right track!' :
               ' Focus on the recommended improvements.'}
            </p>
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className={`lg:col-span-2 rounded-xl p-6 shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Health Metrics</h3>
          
          <div className="space-y-4">
            {healthData.metrics.map((metric, index) => {
              const Icon = metric.icon;
              const percentage = (metric.score / metric.maxScore) * 100;
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedMetric === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMetric(selectedMetric === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full bg-${metric.color}-100 mr-3`}>
                        <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{metric.name}</h4>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>{metric.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(metric.score, metric.maxScore)}`}>
                        {metric.value.toFixed(metric.name === 'Investment Diversity' ? 0 : 1)}{metric.unit}
                      </div>
                      <div className="text-sm text-gray-500">
                        {metric.score}/{metric.maxScore} pts
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Score Progress</span>
                      <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${getProgressBarColor(metric.score, metric.maxScore)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {selectedMetric === index && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-start">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                        <p className="text-sm text-gray-700">{metric.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className={`rounded-xl p-6 shadow-sm transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className={`text-lg font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>AI Financial Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthData.insights.map((insight, index) => {
            const Icon = insight.icon;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'success' ? 'border-green-500 bg-green-50' :
                  insight.type === 'strength' ? 'border-blue-500 bg-blue-50' :
                  insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  insight.type === 'improvement' ? 'border-orange-500 bg-orange-50' :
                  'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start">
                  <Icon className={`w-5 h-5 mr-3 mt-0.5 ${
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'strength' ? 'text-blue-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'improvement' ? 'text-orange-600' :
                    'text-red-600'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    <p className="text-xs font-medium text-gray-600">{insight.action}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthScore;