import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Award, Crown, Target, TrendingUp, Calendar, Users, Zap, Gift, Lock, CheckCircle, RotateCcw, Activity, PiggyBank, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const FamilyAchievementBadges = () => {
  const { isDarkMode } = useTheme();
  const [achievements, setAchievements] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [activeTab, setActiveTab] = useState('earned');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievementData();
  }, []);

  const loadAchievementData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch real user data and generate achievements based on actual financial behavior
      const [transactionsRes, budgetsRes, summaryRes, familyRes] = await Promise.all([
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/budgets/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/family/members', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })) // Family might not exist
      ]);

      const transactions = transactionsRes.ok ? await transactionsRes.json() : [];
      const budgets = budgetsRes.ok ? await budgetsRes.json() : [];
      const summary = summaryRes.ok ? await summaryRes.json() : { income: 0, expenses: 0, balance: 0 };
      const familyData = familyRes.ok ? await familyRes.json() : { members: [] };

      // Generate real achievements based on user's actual financial data
      const realAchievements = generateUserAchievements(transactions, budgets, summary);
      
      // Get current user info for family members
      const currentUser = {
        id: 1,
        name: 'You (Main User)',
        role: 'parent',
        level: calculateUserLevel(transactions.length, summary.balance),
        totalPoints: calculateUserPoints(realAchievements),
        badgesEarned: realAchievements.filter(a => a.earned).length
      };

      // Add family members if they exist
      const realMembers = familyData.members.length > 0 ? 
        [currentUser, ...familyData.members] : [currentUser];

      setAchievements(realAchievements);
      setFamilyMembers(realMembers);
      
    } catch (error) {
      console.error('Error loading achievement data:', error);
      // Set basic user data even on error
      const basicUser = {
        id: 1,
        name: 'You (Main User)', 
        role: 'parent',
        level: 1,
        totalPoints: 0,
        badgesEarned: 0
      };
      setFamilyMembers([basicUser]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate achievements based on real user financial data
  const generateUserAchievements = (transactions, budgets, summary) => {
    const achievements = [];
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const savingsRate = summary.income > 0 ? (summary.balance / summary.income) * 100 : 0;
    
    // Budget Master Achievement - Based on real budget adherence
    const budgetAdherence = budgets.length > 0 ? 
      budgets.filter(b => (parseFloat(b.spent) || 0) <= (parseFloat(b.budget_limit) || 0)).length / budgets.length * 100 : 0;
    
    achievements.push({
      id: 1,
      name: 'Budget Master',
      description: 'Stay within all budgets for current month',
      icon: Target,
      category: 'budgeting',
      difficulty: budgetAdherence >= 100 ? 'hard' : 'medium',
      points: 500,
      earned: budgetAdherence >= 100,
      earnedDate: budgetAdherence >= 100 ? new Date() : null,
      progress: budgetAdherence,
      requirements: 'Keep all categories within budget limits'
    });

    // Transaction Tracker Achievement - Based on real transaction count
    achievements.push({
      id: 2,
      name: 'Transaction Tracker',
      description: 'Record 50+ transactions',
      icon: Activity,
      category: 'tracking',
      difficulty: 'easy',
      points: 200,
      earned: transactions.length >= 50,
      earnedDate: transactions.length >= 50 ? new Date() : null,
      progress: Math.min((transactions.length / 50) * 100, 100),
      requirements: 'Add 50 transactions to your account'
    });

    // Savings Champion Achievement - Based on real savings rate
    achievements.push({
      id: 3,
      name: 'Savings Champion',
      description: 'Maintain 20%+ savings rate',
      icon: PiggyBank,
      category: 'savings',
      difficulty: 'hard',
      points: 600,
      earned: savingsRate >= 20,
      earnedDate: savingsRate >= 20 ? new Date() : null,
      progress: Math.min(savingsRate * 5, 100), // Convert to percentage
      requirements: 'Save at least 20% of your income'
    });

    // Category Diversification - Based on real spending categories
    const uniqueCategories = [...new Set(expenseTransactions.map(t => t.category))].length;
    achievements.push({
      id: 4,
      name: 'Category Master',
      description: 'Use 10+ different expense categories',
      icon: BarChart3,
      category: 'tracking',
      difficulty: 'medium',
      points: 300,
      earned: uniqueCategories >= 10,
      earnedDate: uniqueCategories >= 10 ? new Date() : null,
      progress: Math.min((uniqueCategories / 10) * 100, 100),
      requirements: 'Track expenses across 10+ categories'
    });

    // Regular User Achievement - Based on account age/activity
    const daysSinceFirstTransaction = transactions.length > 0 ? 
      Math.floor((new Date() - new Date(transactions[0].date)) / (1000 * 60 * 60 * 24)) : 0;
    
    achievements.push({
      id: 5,
      name: 'Consistency King',
      description: 'Use FinGuard for 30+ days',
      icon: Calendar,
      category: 'engagement',
      difficulty: 'easy',
      points: 250,
      earned: daysSinceFirstTransaction >= 30,
      earnedDate: daysSinceFirstTransaction >= 30 ? new Date() : null,
      progress: Math.min((daysSinceFirstTransaction / 30) * 100, 100),
      requirements: 'Stay active for 30 consecutive days'
    });

    return achievements;
  };

  // Calculate user level based on real activity
  const calculateUserLevel = (transactionCount, balance) => {
    let level = 1;
    level += Math.floor(transactionCount / 10); // +1 level per 10 transactions
    level += Math.floor(balance / 50000); // +1 level per Rs. 50,000 balance
    return Math.min(level, 50); // Max level 50
  };

  // Calculate user points based on earned achievements
  const calculateUserPoints = (achievements) => {
    return achievements
      .filter(a => a.earned)
      .reduce((total, a) => total + (a.points || 0), 0);
  };

  const difficultyColors = {
    easy: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    hard: 'text-red-600 dark:text-red-400',
    legendary: 'text-purple-600 dark:text-purple-400'
  };

  const categoryColors = {
    budgeting: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    savings: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    tracking: 'bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300',
    goals: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    technology: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300',
    collaboration: 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300',
    investments: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
    debt: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    challenges: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
    emergency: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300'
  };

  const getProgressPercentage = (progress) => {
    return Math.min((progress.current / progress.target) * 100, 100);
  };

  const filteredAchievements = achievements.filter(achievement => {
    const memberFilter = selectedMember === 'all' ? true : 
      (activeTab === 'earned' ? achievement.earned : true);
    
    const statusFilter = activeTab === 'earned' ? achievement.earned : !achievement.earned;
    
    return memberFilter && statusFilter;
  });

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Trophy className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Family Achievement Badges
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Celebrate your financial milestones and progress
            </p>
          </div>
        </div>
        
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">All Members</option>
          {familyMembers.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {/* Family Leaderboard */}
      <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Family Leaderboard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {familyMembers
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((member, index) => (
              <div key={member.id} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold mr-2 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {member.name}
                    </span>
                  </div>
                  {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Level:</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{member.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Points:</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{member.totalPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Badges:</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{member.badgesEarned}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'earned', label: 'Earned Badges', count: achievements.filter(a => a.earned).length },
          { id: 'available', label: 'Available Badges', count: achievements.filter(a => !a.earned).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const BadgeIcon = achievement.icon;
          const isEarned = achievement.earned;
          const memberProgress = selectedMember === 'all' ? null : { current: achievement.progress, target: 100, completed: achievement.earned };
          
          return (
            <div key={achievement.id} className={`p-5 rounded-lg border transition-all duration-300 hover:shadow-lg ${
              isEarned 
                ? isDarkMode ? 'bg-yellow-900/20 border-yellow-800 shadow-yellow-900/20' : 'bg-yellow-50 border-yellow-200 shadow-yellow-100'
                : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg ${
                  isEarned 
                    ? 'bg-yellow-100 dark:bg-yellow-900/40' 
                    : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                }`}>
                  <BadgeIcon className={`w-6 h-6 ${
                    isEarned 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[achievement.category]}`}>
                    {achievement.category}
                  </span>
                  {isEarned ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
              
              <h3 className={`font-bold text-lg mb-2 ${
                isEarned 
                  ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {achievement.name}
              </h3>
              
              <p className={`text-sm mb-3 ${
                isEarned 
                  ? isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                  : isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {achievement.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    achievement.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                    achievement.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                    achievement.difficulty === 'hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                  }`}>
                    {achievement.difficulty}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {achievement.points}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar for specific member */}
              {memberProgress && selectedMember !== 'all' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Progress: {memberProgress.current} / {memberProgress.target}
                    </span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {getProgressPercentage(memberProgress).toFixed(0)}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        memberProgress.completed ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getProgressPercentage(memberProgress)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Earned by members */}
              {isEarned && (
                <div>
                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Earned by:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
                    }`} title={achievement.earnedDate ? achievement.earnedDate.toLocaleDateString() : ''}>
                      You (Main User)
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <strong>Requirements:</strong> {achievement.requirements}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Badges Found
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {activeTab === 'earned' 
              ? 'Start completing financial goals to earn your first badge!'
              : 'All available badges have been earned. Great job!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FamilyAchievementBadges;