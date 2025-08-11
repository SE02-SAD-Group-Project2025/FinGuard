import React, { useState } from 'react';
import Navbar from '../Navbar';
import PremiumCards from './PremiumCards';
import AICard from './AICard';
import PremiumCharts from './PremiumCharts';
import Family from './Family';
import AnimatedPage from '../AnimatedPage';
import { useTheme } from '../../contexts/ThemeContext';
import FinancialHealthScore from '../FinancialHealthScore';
import QuickExpenseButton from '../QuickExpenseButton';
import AutoCategorizationManager from '../AutoCategorizationManager';
import SpendingChallenges from '../SpendingChallenges';
import PredictiveCashFlow from '../PredictiveCashFlow';
import SpendingPatternAnalysis from '../SpendingPatternAnalysis';
import BudgetVarianceReports from '../BudgetVarianceReports';
import AnomalyDetection from '../AnomalyDetection';
import BillReminders from '../BillReminders';
import AdvancedParentalControls from '../AdvancedParentalControls';
import FamilyMeetingScheduler from '../FamilyMeetingScheduler';
import FamilyAchievementBadges from '../FamilyAchievementBadges';
import DashboardCustomization from '../DashboardCustomization';
import CustomBudgetPeriods from '../CustomBudgetPeriods';
import PremiumAnalyticsDashboard from '../PremiumAnalyticsDashboard';
import { useSubscription } from '../../hooks/useSubscription';
import { 
  CheckCircle, 
  PlusCircle,
  MinusCircle,
  Crown,
  BarChart3,
  Brain,
  Users,
  Settings,
  Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { subscription, user, isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');

  const handleAddIncome = () => {
    navigate('/income');
  };
  
  const handleAddExpense = () => {
    navigate('/expense');
  };

  // Redirect if not premium user
  if (!isPremium()) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-md mx-auto text-center`}>
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Premium Access Required</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            Upgrade to Premium to access the advanced dashboard with AI insights, detailed analytics, and family features.
          </p>
          <button
            onClick={() => navigate('/subscription/plans')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: Home,
      content: (
        <div className="space-y-8">
          <PremiumCards />
          <AICard />
          <FinancialHealthScore />
        </div>
      )
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      content: (
        <div className="space-y-8">
          <PremiumCharts />
          <PremiumAnalyticsDashboard />
          <SpendingPatternAnalysis />
          <BudgetVarianceReports />
        </div>
      )
    },
    {
      id: 'ai-insights',
      name: 'AI & Insights',
      icon: Brain,
      content: (
        <div className="space-y-8">
          <PredictiveCashFlow />
          <AnomalyDetection />
          <AutoCategorizationManager />
          <SpendingChallenges />
        </div>
      )
    },
    {
      id: 'family',
      name: 'Family',
      icon: Users,
      content: (
        <div className="space-y-8">
          <Family />
          <AdvancedParentalControls />
          <FamilyMeetingScheduler />
          <FamilyAchievementBadges />
        </div>
      )
    },
    {
      id: 'tools',
      name: 'Tools & Settings',
      icon: Settings,
      content: (
        <div className="space-y-8">
          <BillReminders />
          <DashboardCustomization />
          <CustomBudgetPeriods />
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        
        {/* Premium Dashboard Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-yellow-500 mr-2" />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Premium Dashboard</h1>
          </div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Advanced features and insights for premium users
          </p>
          
          {/* Subscription Status */}
          <div className={`mt-3 inline-flex items-center ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm`}>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {subscription?.display_name || 'Premium Plan'} Active
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-1 mb-8`}>
          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                      : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  } rounded-lg px-3 py-2 text-sm font-medium flex items-center transition-colors`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
        
        {/* Quick Expense Entry Button */}
        <QuickExpenseButton />
        
        {/* Simple Action Bar */}
        <div className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-3 shadow-lg z-40`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
    </AnimatedPage>
  );
};

export default PremiumDashboard;