import React, { useState, useEffect } from 'react';
import {
  Trophy, Target, Star, Award, TrendingDown, Calendar, Users,
  Zap, Gift, Crown, Medal, Flame, CheckCircle, XCircle,
  Plus, Edit3, Trash2, Play, Pause, RotateCcw, ChevronRight, Tag
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const SpendingChallenges = () => {
  const { isPremium, user } = useSubscription();
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'spending_limit',
    target: '',
    duration: 30,
    category: 'all',
    difficulty: 'medium',
    reward: ''
  });

  // Challenge types
  const challengeTypes = [
    { value: 'spending_limit', label: 'Spending Limit', icon: Target, description: 'Stay under a spending limit' },
    { value: 'save_amount', label: 'Save Money', icon: Trophy, description: 'Save a specific amount' },
    { value: 'no_spend', label: 'No-Spend Days', icon: XCircle, description: 'Complete days without spending' },
    { value: 'category_limit', label: 'Category Limit', icon: Tag, description: 'Limit spending in a category' },
    { value: 'streak', label: 'Streak Challenge', icon: Flame, description: 'Maintain a habit streak' }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'green', points: 50 },
    { value: 'medium', label: 'Medium', color: 'yellow', points: 100 },
    { value: 'hard', label: 'Hard', color: 'red', points: 200 }
  ];

  // Categories for challenges
  const categories = [
    'all', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel'
  ];

  // Load data on component mount
  useEffect(() => {
    loadChallengeData();
  }, []);

  // Load all challenge data
  const loadChallengeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadActiveChallenges(),
        loadCompletedChallenges(),
        loadAvailableChallenges(),
        loadUserStats(),
        loadAchievements()
      ]);
    } catch (error) {
      console.error('Error loading challenge data:', error);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  // Load active challenges
  const loadActiveChallenges = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/challenges/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const challenges = await response.json();
        setActiveChallenges(challenges);
      } else {
        console.error('Failed to load active challenges');
        setActiveChallenges([]);
      }
    } catch (error) {
      console.error('Error loading active challenges:', error);
      setActiveChallenges([]);
    }
  };

  // Load completed challenges
  const loadCompletedChallenges = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/challenges/completed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const challenges = await response.json();
        setCompletedChallenges(challenges);
      } else {
        console.error('Failed to load completed challenges');
        setCompletedChallenges([]);
      }
    } catch (error) {
      console.error('Error loading completed challenges:', error);
      setCompletedChallenges([]);
    }
  };

  // Load available challenges
  const loadAvailableChallenges = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/challenges/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const challenges = await response.json();
        setAvailableChallenges(challenges);
      } else {
        console.error('Failed to load available challenges');
        setAvailableChallenges([]);
      }
    } catch (error) {
      console.error('Error loading available challenges:', error);
      setAvailableChallenges([]);
    }
  };

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/challenges/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      } else {
        console.error('Failed to load user stats');
        setUserStats({});
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({});
    }
  };

  // Load achievements/badges
  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/challenges/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const achievements = await response.json();
        // Map icon names to actual icons
        const mappedAchievements = achievements.map(ach => ({
          ...ach,
          icon: ach.icon === 'Star' ? Star :
                ach.icon === 'Flame' ? Flame :
                ach.icon === 'Trophy' ? Trophy :
                ach.icon === 'Award' ? Award :
                ach.icon === 'Plus' ? Plus : Star
        }));
        setAchievements(mappedAchievements);
      } else {
        console.error('Failed to load achievements');
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      setAchievements([]);
    }
  };

  // Start a challenge
  const startChallenge = async (challengeId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('http://localhost:5000/api/challenges/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengeId,
          isTemplate: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Challenge started successfully!');
        // Reload data to reflect changes
        await Promise.all([
          loadActiveChallenges(),
          loadUserStats()
        ]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start challenge');
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      setError('Failed to start challenge');
    } finally {
      setLoading(false);
      // Clear messages after 3 seconds
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
    }
  };

  // Create custom challenge
  const createChallenge = async () => {
    if (!newChallenge.title || !newChallenge.target) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('http://localhost:5000/api/challenges/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newChallenge)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Custom challenge created and started!');
        setShowCreateModal(false);
        resetForm();
        // Reload data to reflect changes
        await Promise.all([
          loadActiveChallenges(),
          loadUserStats()
        ]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError('Failed to create challenge');
    } finally {
      setLoading(false);
      // Clear messages after 3 seconds
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewChallenge({
      title: '',
      description: '',
      type: 'spending_limit',
      target: '',
      duration: 30,
      category: 'all',
      difficulty: 'medium',
      reward: ''
    });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    const level = difficultyLevels.find(d => d.value === difficulty);
    switch (level?.color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get challenge type icon
  const getChallengeIcon = (type) => {
    const challengeType = challengeTypes.find(t => t.value === type);
    return challengeType?.icon || Target;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate level progress
  const getLevelProgress = () => {
    const pointsInCurrentLevel = userStats.totalPoints % 100;
    const progressPercent = (pointsInCurrentLevel / 100) * 100;
    return Math.min(progressPercent, 100);
  };

  if (!isPremium()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Premium Feature</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Spending challenges and gamification are available for Premium users only.
          </p>
          <button
            onClick={() => window.location.href = '/subscription/plans'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  if (loading && activeChallenges.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with User Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Spending Challenges</h2>
              <p className="opacity-90">Level {userStats.level} - {userStats.rank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{userStats.totalPoints}</p>
            <p className="opacity-90">Total Points</p>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Level Progress</span>
            <span>{userStats.totalPoints}/{userStats.nextLevelPoints}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${getLevelProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Saved</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(userStats.totalSaved)}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{userStats.challengesCompleted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600">{userStats.currentStreak}</p>
            </div>
            <Flame className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-purple-600">{activeChallenges.length}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'active', label: 'Active', count: activeChallenges.length },
              { id: 'available', label: 'Available', count: availableChallenges.length },
              { id: 'completed', label: 'Completed', count: completedChallenges.length },
              { id: 'achievements', label: 'Achievements', count: achievements.filter(a => a.earned).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Challenge</span>
          </button>
        </div>

        {/* Active Challenges */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeChallenges.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No active challenges</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Start a challenge to begin saving money and earning points
                </p>
              </div>
            ) : (
              activeChallenges.map((challenge) => {
                const Icon = getChallengeIcon(challenge.type);
                return (
                  <div key={challenge.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{challenge.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{challenge.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                              {challenge.difficulty}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {challenge.daysLeft} days left
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {challenge.points} points
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {challenge.current}/{challenge.target}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-gray-900 dark:text-white font-medium">{Math.round(challenge.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(challenge.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Challenge Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Category</p>
                        <p className="font-medium text-gray-900 dark:text-white">{challenge.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Streak</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center">
                          <Flame className="w-4 h-4 text-orange-500 mr-1" />
                          {challenge.streak} days
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Reward</p>
                        <p className="font-medium text-gray-900 dark:text-white">{challenge.reward}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Available Challenges */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableChallenges.map((challenge) => {
              const Icon = getChallengeIcon(challenge.type);
              return (
                <div key={challenge.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex space-x-4">
                      <span className="text-gray-500 dark:text-gray-400">{challenge.duration} days</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{challenge.points} points</span>
                    </div>
                    {challenge.estimatedSavings && (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Save ~{formatCurrency(challenge.estimatedSavings)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => startChallenge(challenge.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Challenge</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Challenges */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedChallenges.map((challenge) => {
              const Icon = getChallengeIcon(challenge.type);
              return (
                <div key={challenge.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Completed on {new Date(challenge.completedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="font-medium">+{challenge.points} points</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.reward}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div key={achievement.id} className={`rounded-lg p-4 border ${
                  achievement.earned 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      achievement.earned 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        achievement.earned 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        achievement.earned 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {achievement.name}
                      </h3>
                      {achievement.earned && achievement.earnedDate && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {achievement.earned && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Custom Challenge</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Challenge Title *
                  </label>
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Coffee Budget Challenge"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Describe your challenge..."
                  />
                </div>

                {/* Type and Target */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Challenge Type *
                    </label>
                    <select
                      value={newChallenge.type}
                      onChange={(e) => setNewChallenge({ ...newChallenge, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {challengeTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Amount/Days *
                    </label>
                    <input
                      type="number"
                      value={newChallenge.target}
                      onChange={(e) => setNewChallenge({ ...newChallenge, target: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="50"
                      required
                    />
                  </div>
                </div>

                {/* Duration and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={newChallenge.duration}
                      onChange={(e) => setNewChallenge({ ...newChallenge, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      max="365"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={newChallenge.difficulty}
                      onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {difficultyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label} ({level.points} points)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newChallenge.category}
                    onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reward */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reward (Optional)
                  </label>
                  <input
                    type="text"
                    value={newChallenge.reward}
                    onChange={(e) => setNewChallenge({ ...newChallenge, reward: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Movie night, $10 gift card"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createChallenge}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create & Start'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingChallenges;