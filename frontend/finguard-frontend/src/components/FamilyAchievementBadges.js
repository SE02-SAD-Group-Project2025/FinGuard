import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Award, Crown, Target, TrendingUp, Calendar, Users, Zap, Gift, Lock, CheckCircle, RotateCcw } from 'lucide-react';
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
      // Make actual API call
      const token = localStorage.getItem('finguard-token');
      if (token) {
        try {
          const response = await fetch('/api/family/achievements', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setAchievements(data.achievements || []);
            setFamilyMembers(data.members || []);
            return;
          }
        } catch (apiError) {
          console.error('API call failed, using fallback data:', apiError);
        }
      }
      
      // Fallback to mock data if API fails
      
      const mockFamilyMembers = [
        {
          id: 1,
          name: 'You (Parent)',
          role: 'parent',
          level: 15,
          totalPoints: 2450,
          badgesEarned: 12
        },
        {
          id: 2,
          name: 'Sarah (Spouse)',
          role: 'parent',
          level: 12,
          totalPoints: 1890,
          badgesEarned: 9
        },
        {
          id: 3,
          name: 'Alice (Daughter)',
          role: 'child',
          level: 8,
          totalPoints: 1120,
          badgesEarned: 7
        },
        {
          id: 4,
          name: 'Bob (Son)',
          role: 'child',
          level: 6,
          totalPoints: 680,
          badgesEarned: 4
        }
      ];

      const mockAchievements = [
        // Earned Badges
        {
          id: 1,
          name: 'Budget Master',
          description: 'Stay within budget for 3 consecutive months',
          icon: Target,
          category: 'budgeting',
          difficulty: 'hard',
          points: 500,
          earnedBy: [1, 2],
          earnedDate: {
            1: new Date(2025, 6, 15),
            2: new Date(2025, 6, 20)
          },
          requirements: 'Stay within monthly budget for 3 months',
          progress: {
            1: { current: 3, target: 3, completed: true },
            2: { current: 3, target: 3, completed: true },
            3: { current: 2, target: 3, completed: false },
            4: { current: 1, target: 3, completed: false }
          }
        },
        {
          id: 2,
          name: 'Savings Star',
          description: 'Save Rs. 50,000 in a single month',
          icon: Star,
          category: 'savings',
          difficulty: 'medium',
          points: 300,
          earnedBy: [1, 3],
          earnedDate: {
            1: new Date(2025, 7, 1),
            3: new Date(2025, 7, 10)
          },
          requirements: 'Accumulate Rs. 50,000 in savings',
          progress: {
            1: { current: 75000, target: 50000, completed: true },
            2: { current: 35000, target: 50000, completed: false },
            3: { current: 52000, target: 50000, completed: true },
            4: { current: 25000, target: 50000, completed: false }
          }
        },
        {
          id: 3,
          name: 'Expense Tracker',
          description: 'Log expenses for 30 consecutive days',
          icon: CheckCircle,
          category: 'tracking',
          difficulty: 'easy',
          points: 150,
          earnedBy: [1, 2, 3, 4],
          earnedDate: {
            1: new Date(2025, 5, 30),
            2: new Date(2025, 6, 5),
            3: new Date(2025, 6, 12),
            4: new Date(2025, 6, 18)
          },
          requirements: 'Track expenses daily for 30 days',
          progress: {
            1: { current: 30, target: 30, completed: true },
            2: { current: 30, target: 30, completed: true },
            3: { current: 30, target: 30, completed: true },
            4: { current: 30, target: 30, completed: true }
          }
        },
        {
          id: 4,
          name: 'Goal Achiever',
          description: 'Complete 5 financial goals',
          icon: Trophy,
          category: 'goals',
          difficulty: 'hard',
          points: 400,
          earnedBy: [1],
          earnedDate: {
            1: new Date(2025, 7, 5)
          },
          requirements: 'Successfully complete 5 financial goals',
          progress: {
            1: { current: 5, target: 5, completed: true },
            2: { current: 3, target: 5, completed: false },
            3: { current: 2, target: 5, completed: false },
            4: { current: 1, target: 5, completed: false }
          }
        },
        {
          id: 5,
          name: 'Smart Spender',
          description: 'Use auto-categorization for 100 transactions',
          icon: Zap,
          category: 'technology',
          difficulty: 'medium',
          points: 250,
          earnedBy: [1, 2, 3],
          earnedDate: {
            1: new Date(2025, 6, 25),
            2: new Date(2025, 7, 2),
            3: new Date(2025, 7, 8)
          },
          requirements: 'Use smart categorization 100 times',
          progress: {
            1: { current: 156, target: 100, completed: true },
            2: { current: 123, target: 100, completed: true },
            3: { current: 104, target: 100, completed: true },
            4: { current: 67, target: 100, completed: false }
          }
        },
        // Available Badges
        {
          id: 6,
          name: 'Family Planner',
          description: 'Attend 5 family financial meetings',
          icon: Users,
          category: 'collaboration',
          difficulty: 'medium',
          points: 200,
          earnedBy: [],
          earnedDate: {},
          requirements: 'Participate in family meetings',
          progress: {
            1: { current: 3, target: 5, completed: false },
            2: { current: 4, target: 5, completed: false },
            3: { current: 2, target: 5, completed: false },
            4: { current: 1, target: 5, completed: false }
          }
        },
        {
          id: 7,
          name: 'Investment Guru',
          description: 'Maintain positive investment returns for 6 months',
          icon: TrendingUp,
          category: 'investments',
          difficulty: 'legendary',
          points: 1000,
          earnedBy: [],
          earnedDate: {},
          requirements: 'Positive investment performance',
          progress: {
            1: { current: 2, target: 6, completed: false },
            2: { current: 1, target: 6, completed: false },
            3: { current: 0, target: 6, completed: false },
            4: { current: 0, target: 6, completed: false }
          }
        },
        {
          id: 8,
          name: 'Debt Destroyer',
          description: 'Pay off a major debt completely',
          icon: Award,
          category: 'debt',
          difficulty: 'hard',
          points: 600,
          earnedBy: [],
          earnedDate: {},
          requirements: 'Eliminate a significant debt',
          progress: {
            1: { current: 85, target: 100, completed: false },
            2: { current: 45, target: 100, completed: false },
            3: { current: 0, target: 100, completed: false },
            4: { current: 0, target: 100, completed: false }
          }
        },
        {
          id: 9,
          name: 'Challenge Champion',
          description: 'Complete 10 spending challenges',
          icon: Medal,
          category: 'challenges',
          difficulty: 'medium',
          points: 350,
          earnedBy: [],
          earnedDate: {},
          requirements: 'Win financial challenges',
          progress: {
            1: { current: 7, target: 10, completed: false },
            2: { current: 5, target: 10, completed: false },
            3: { current: 8, target: 10, completed: false },
            4: { current: 3, target: 10, completed: false }
          }
        },
        {
          id: 10,
          name: 'Emergency Fund Builder',
          description: 'Build an emergency fund worth 6 months expenses',
          icon: Crown,
          category: 'emergency',
          difficulty: 'legendary',
          points: 800,
          earnedBy: [],
          earnedDate: {},
          requirements: 'Save 6 months of expenses',
          progress: {
            1: { current: 4.2, target: 6, completed: false },
            2: { current: 2.8, target: 6, completed: false },
            3: { current: 1.5, target: 6, completed: false },
            4: { current: 0.8, target: 6, completed: false }
          }
        }
      ];
      
      setFamilyMembers(mockFamilyMembers);
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error loading achievement data:', error);
    } finally {
      setLoading(false);
    }
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
      (activeTab === 'earned' ? achievement.earnedBy.includes(parseInt(selectedMember)) :
       achievement.progress[selectedMember] !== undefined);
    
    const statusFilter = activeTab === 'earned' ? achievement.earnedBy.length > 0 : achievement.earnedBy.length === 0;
    
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
          { id: 'earned', label: 'Earned Badges', count: achievements.filter(a => a.earnedBy.length > 0).length },
          { id: 'available', label: 'Available Badges', count: achievements.filter(a => a.earnedBy.length === 0).length }
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
          const isEarned = achievement.earnedBy.length > 0;
          const memberProgress = selectedMember === 'all' ? null : achievement.progress[selectedMember];
          
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
              {isEarned && achievement.earnedBy.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Earned by:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {achievement.earnedBy.map(memberId => {
                      const member = familyMembers.find(m => m.id === memberId);
                      const earnedDate = achievement.earnedDate[memberId];
                      return (
                        <span key={memberId} className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
                        }`} title={earnedDate ? earnedDate.toLocaleDateString() : ''}>
                          {member?.name || 'Unknown'}
                        </span>
                      );
                    })}
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