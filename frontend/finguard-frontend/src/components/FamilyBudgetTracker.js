import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Activity,
  Zap,
  Bell,
  Eye
} from 'lucide-react';
const FamilyBudgetTracker = () => {
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [familySummary, setFamilySummary] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealBudgetData();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(loadRealBudgetData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRealBudgetData = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      // Fetch real user data
      const [summaryRes, budgetsRes, transactionsRes] = await Promise.all([
        fetch('http://localhost:5000/api/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/budgets/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const summaryData = summaryRes.ok ? await summaryRes.json() : { income: 0, expenses: 0, balance: 0 };
      const budgetsData = budgetsRes.ok ? await budgetsRes.json() : [];
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : [];

      // Create family summary based on real data
      const realFamilySummary = {
        totalBudget: budgetsData.reduce((sum, b) => sum + (parseFloat(b.budget_limit) || 0), 0),
        totalSpent: budgetsData.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0),
        totalMembers: 1, // Currently just the main user
        averageUsage: budgetsData.length > 0 ? 
          budgetsData.reduce((sum, b) => {
            const limit = parseFloat(b.budget_limit) || 1;
            const spent = parseFloat(b.spent) || 0;
            return sum + ((spent / limit) * 100);
          }, 0) / budgetsData.length : 0,
        activeAlerts: budgetsData.filter(b => 
          (parseFloat(b.spent) || 0) > (parseFloat(b.budget_limit) || 0) * 0.9
        ).length
      };

      // Generate budget status for main user
      const userBudgetStatus = [{
        userId: 1,
        memberName: 'You (Main User)',
        role: 'parent',
        monthlyBudget: realFamilySummary.totalBudget,
        currentSpent: realFamilySummary.totalSpent,
        usagePercentage: realFamilySummary.totalBudget > 0 ? 
          (realFamilySummary.totalSpent / realFamilySummary.totalBudget) * 100 : 0,
        isOverBudget: realFamilySummary.totalSpent > realFamilySummary.totalBudget,
        categories: budgetsData.map(b => ({
          name: b.category,
          spent: parseFloat(b.spent) || 0,
          limit: parseFloat(b.budget_limit) || 0,
          percentage: (parseFloat(b.budget_limit) || 0) > 0 ? 
            ((parseFloat(b.spent) || 0) / (parseFloat(b.budget_limit) || 0)) * 100 : 0
        }))
      }];

      // Generate alerts based on budget status
      const alerts = budgetsData
        .filter(b => {
          const spent = parseFloat(b.spent) || 0;
          const limit = parseFloat(b.budget_limit) || 0;
          return spent > limit * 0.9; // Alert when 90% or more is spent
        })
        .map(b => ({
          id: `alert-${b.category}`,
          type: (parseFloat(b.spent) || 0) > (parseFloat(b.budget_limit) || 0) ? 'over_budget' : 'approaching_limit',
          memberName: 'You (Main User)',
          category: b.category,
          message: (parseFloat(b.spent) || 0) > (parseFloat(b.budget_limit) || 0) ? 
            `${b.category} budget exceeded by Rs.${((parseFloat(b.spent) || 0) - (parseFloat(b.budget_limit) || 0)).toLocaleString()}` :
            `${b.category} budget is 90% used`,
          timestamp: new Date(),
          severity: (parseFloat(b.spent) || 0) > (parseFloat(b.budget_limit) || 0) ? 'high' : 'medium'
        }));

      // Generate recent updates from transactions
      const recentUpdates = transactionsData
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          type: 'expense',
          memberName: 'You (Main User)',
          category: t.category,
          amount: parseFloat(t.amount) || 0,
          description: t.description,
          timestamp: new Date(t.date),
          impact: 'normal'
        }));

      setFamilySummary(realFamilySummary);
      setBudgetStatus(userBudgetStatus);
      setRecentAlerts(alerts);
      setLiveUpdates(recentUpdates);
      setLoading(false);

    } catch (error) {
      console.error('Error loading real budget data:', error);
      
      // Fallback to basic data structure
      setFamilySummary({
        totalBudget: 0,
        totalSpent: 0,
        totalMembers: 1,
        averageUsage: 0,
        activeAlerts: 0
      });
      setBudgetStatus([{
        userId: 1,
        memberName: 'You (Main User)',
        role: 'parent',
        monthlyBudget: 0,
        currentSpent: 0,
        usagePercentage: 0,
        isOverBudget: false,
        categories: []
      }]);
      setRecentAlerts([]);
      setLiveUpdates([]);
      setLoading(false);
    }
  };

  const getBudgetStatusColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 90) return 'text-orange-600 bg-orange-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getBudgetProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Mode Toggle */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Real-time Family Budget Tracking</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <button
                onClick={() => setIsLiveMode(!isLiveMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isLiveMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isLiveMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-gray-700">Live Mode</span>
            </div>
            {isLiveMode && (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Family Overview */}
        {familySummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Budget</p>
                  <p className="text-2xl font-bold text-blue-900">
                    Rs.{familySummary.totalBudget?.toLocaleString() || '0'}
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Income</p>
                  <p className="text-2xl font-bold text-green-900">
                    Rs.{familySummary.totalIncome?.toLocaleString() || '0'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-900">
                    Rs.{familySummary.totalExpenses?.toLocaleString() || '0'}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Family Savings</p>
                  <p className={`text-2xl font-bold ${
                    (familySummary.totalSavings || 0) >= 0 ? 'text-purple-900' : 'text-red-900'
                  }`}>
                    Rs.{familySummary.totalSavings?.toLocaleString() || '0'}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Member Budget Status */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Member Budget Status</h3>
            <div className="text-sm text-gray-500">
              {budgetStatus.length} members
            </div>
          </div>

          <div className="space-y-4">
            {budgetStatus.map((member) => (
              <div
                key={member.userId}
                className={`border rounded-lg p-4 transition-all ${
                  member.isOverBudget 
                    ? 'border-red-200 bg-red-50' 
                    : member.usagePercentage >= 90 
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      member.isOverBudget 
                        ? 'bg-red-500 animate-pulse' 
                        : member.usagePercentage >= 90 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.memberName}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getBudgetStatusColor(member.usagePercentage)
                    }`}>
                      {member.isOverBudget ? (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      ) : member.usagePercentage >= 90 ? (
                        <Clock className="w-3 h-3 mr-1" />
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {Math.round(member.usagePercentage)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Rs.{member.currentSpent?.toLocaleString() || '0'} / 
                      Rs.{member.monthlyBudget?.toLocaleString() || '0'}
                    </span>
                    <span className={member.isOverBudget ? 'text-red-600' : 'text-gray-600'}>
                      {member.isOverBudget 
                        ? `Over by Rs.${Math.abs(member.monthlyBudget - member.currentSpent).toLocaleString()}`
                        : `Rs.${(member.monthlyBudget - member.currentSpent).toLocaleString()} left`
                      }
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        getBudgetProgressColor(member.usagePercentage)
                      }`}
                      style={{ width: `${Math.min(member.usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Updates & Alerts */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          {recentAlerts.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-red-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Recent Alerts</h3>
              </div>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={alert.id || index}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'budget-exceeded' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-orange-500 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.memberName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.type === 'budget-exceeded' ? 'Budget Exceeded' : 'Budget Warning'}
                        </p>
                        {alert.category && (
                          <p className="text-xs text-gray-500 mt-1">
                            Category: {alert.category}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Activity Feed */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Live Activity</h3>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Eye className="w-4 h-4 mr-1" />
                Tracking
              </div>
            </div>
            
            {liveUpdates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Live updates will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {liveUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {update.memberName}
                        </p>
                        <span className="text-sm font-medium text-blue-600">
                          -Rs.{update.amount?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {update.category}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(update.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyBudgetTracker;