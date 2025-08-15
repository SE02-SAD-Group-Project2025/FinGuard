import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  Zap,
  Star,
  Trophy,
  Gift,
  Home,
  Plane,
  Car,
  GraduationCap,
  Heart,
  X,
  Edit3,
  Trash2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const FamilySavingsGoals = () => {
  const { success, error } = useToast();
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'vacation',
    priority: 'medium',
    isPublic: true
  });

  const [contribution, setContribution] = useState({
    amount: '',
    note: ''
  });

  const goalCategories = {
    vacation: { icon: Plane, color: 'blue', label: 'Vacation' },
    house: { icon: Home, color: 'green', label: 'House' },
    car: { icon: Car, color: 'red', label: 'Vehicle' },
    education: { icon: GraduationCap, color: 'purple', label: 'Education' },
    wedding: { icon: Heart, color: 'pink', label: 'Wedding' },
    emergency: { icon: Zap, color: 'orange', label: 'Emergency Fund' },
    gift: { icon: Gift, color: 'yellow', label: 'Gift' },
    other: { icon: Target, color: 'gray', label: 'Other' }
  };

  // Load savings goals
  useEffect(() => {
    loadSavingsGoals();
  }, []);

  const loadSavingsGoals = async () => {
    setLoading(true);
    const token = localStorage.getItem('finguard-token');
    
    try {
      // Fetch real user data to generate savings goals based on financial behavior
      const [summaryRes, transactionsRes, budgetRes] = await Promise.all([
        fetch('http://localhost:5000/api/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/budgets/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const summaryData = summaryRes.ok ? await summaryRes.json() : { income: 0, expenses: 0, balance: 0 };
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : { transactions: [] };
      const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData.transactions || []);
      const budgetsData = budgetRes.ok ? await budgetRes.json() : [];
      const budgets = Array.isArray(budgetsData) ? budgetsData : [];

      // Generate real savings goals based on user's financial data
      const realSavingsGoals = generateSavingsGoalsFromUserData(summaryData, transactions, budgets);

      // Try to load existing goals from goals API
      const goalsRes = await fetch('http://localhost:5000/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (goalsRes.ok) {
        const existingGoals = await goalsRes.json();
        // Convert existing goals to savings goals format
        const convertedGoals = existingGoals.map(goal => ({
          id: goal.id,
          title: goal.title,
          description: goal.description,
          targetAmount: parseFloat(goal.target_amount) || 0,
          currentAmount: parseFloat(goal.current_amount) || 0,
          targetDate: goal.target_date,
          category: goal.category || 'other',
          priority: goal.priority || 'medium',
          createdBy: 'You (Main User)',
          contributors: [
            { userId: 1, name: 'You (Main User)', amount: parseFloat(goal.current_amount) || 0, lastContribution: goal.updated_at }
          ],
          isPublic: true,
          createdAt: goal.created_at
        }));

        setSavingsGoals([...convertedGoals, ...realSavingsGoals]);
      } else {
        setSavingsGoals(realSavingsGoals);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading savings goals:', err);
      
      // Generate basic goals even on error
      const basicGoals = [
        {
          id: Date.now(),
          title: 'Emergency Fund Goal',
          description: 'Build an emergency fund for unexpected expenses',
          targetAmount: 100000,
          currentAmount: 0,
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months from now
          category: 'emergency',
          priority: 'high',
          createdBy: 'You (Main User)',
          contributors: [],
          isPublic: true,
          createdAt: new Date().toISOString()
        }
      ];
      setSavingsGoals(basicGoals);
      setLoading(false);
    }
  };

  // Generate savings goals based on user's real financial data
  const generateSavingsGoalsFromUserData = (summary, transactions, budgets) => {
    const goals = [];
    const currentBalance = summary.balance || 0;
    const monthlyIncome = summary.income || 0;
    const monthlyExpenses = summary.expenses || 0;
    
    // Ensure transactions is always an array
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    // Emergency Fund Goal (based on monthly expenses)
    if (monthlyExpenses > 0) {
      const emergencyTarget = monthlyExpenses * 6; // 6 months of expenses
      const emergencyProgress = Math.min(currentBalance * 0.3, emergencyTarget); // Assume 30% of balance is emergency fund
      
      goals.push({
        id: 'emergency-fund',
        title: 'Emergency Fund',
        description: `Build an emergency fund covering 6 months of expenses (Rs.${monthlyExpenses.toLocaleString()}/month)`,
        targetAmount: emergencyTarget,
        currentAmount: emergencyProgress,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        category: 'emergency',
        priority: 'high',
        createdBy: 'You (Main User)',
        contributors: [
          { userId: 1, name: 'You (Main User)', amount: emergencyProgress, lastContribution: new Date().toISOString() }
        ],
        isPublic: true,
        createdAt: new Date().toISOString()
      });
    }

    // Vacation/Travel Goal (based on entertainment/leisure spending patterns)
    const entertainmentTransactions = safeTransactions.filter(t => 
      t.category && (t.category.toLowerCase().includes('entertainment') || 
                     t.category.toLowerCase().includes('leisure') ||
                     t.category.toLowerCase().includes('dining'))
    );
    
    if (entertainmentTransactions.length > 0) {
      const monthlyEntertainment = entertainmentTransactions
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) / 3; // Average over 3 months
      const vacationTarget = monthlyEntertainment * 12; // Annual entertainment * 1 for vacation
      
      goals.push({
        id: 'family-vacation',
        title: 'Family Vacation Fund',
        description: 'Save for a memorable family vacation based on your entertainment spending patterns',
        targetAmount: Math.max(vacationTarget, 50000), // Minimum Rs.50,000
        currentAmount: currentBalance * 0.1, // Assume 10% of balance allocated
        targetDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 months from now
        category: 'vacation',
        priority: 'medium',
        createdBy: 'You (Main User)',
        contributors: [
          { userId: 1, name: 'You (Main User)', amount: currentBalance * 0.1, lastContribution: new Date().toISOString() }
        ],
        isPublic: true,
        createdAt: new Date().toISOString()
      });
    }

    // Home/House Goal (based on current savings rate)
    if (monthlyIncome > monthlyExpenses) {
      const monthlySavings = monthlyIncome - monthlyExpenses;
      const houseTarget = monthlyIncome * 24; // 2 years of income as house goal
      const houseProgress = monthlySavings * 6; // 6 months of savings
      
      goals.push({
        id: 'house-fund',
        title: 'Home Purchase Fund',
        description: 'Save for a down payment on your dream home',
        targetAmount: houseTarget,
        currentAmount: Math.min(houseProgress, currentBalance * 0.4), // Max 40% of current balance
        targetDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 years from now
        category: 'house',
        priority: 'medium',
        createdBy: 'You (Main User)',
        contributors: [
          { userId: 1, name: 'You (Main User)', amount: Math.min(houseProgress, currentBalance * 0.4), lastContribution: new Date().toISOString() }
        ],
        isPublic: true,
        createdAt: new Date().toISOString()
      });
    }

    // Education Goal (if there are education-related transactions)
    const educationTransactions = safeTransactions.filter(t => 
      t.category && t.category.toLowerCase().includes('education')
    );
    
    if (educationTransactions.length > 0 || monthlyIncome > 50000) {
      const educationTarget = 200000; // Standard education fund
      
      goals.push({
        id: 'education-fund',
        title: 'Education & Skill Development',
        description: 'Invest in learning and professional development',
        targetAmount: educationTarget,
        currentAmount: currentBalance * 0.05, // 5% of current balance
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        category: 'education',
        priority: 'low',
        createdBy: 'You (Main User)',
        contributors: [
          { userId: 1, name: 'You (Main User)', amount: currentBalance * 0.05, lastContribution: new Date().toISOString() }
        ],
        isPublic: true,
        createdAt: new Date().toISOString()
      });
    }

    return goals.filter(goal => goal.targetAmount > 0);
  };

  const createSavingsGoal = async () => {
    const token = localStorage.getItem('finguard-token');
    
    try {
      // Simulate API call
      const newGoalData = {
        id: Date.now(),
        ...newGoal,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        createdBy: 'Current User',
        contributors: [],
        createdAt: new Date().toISOString()
      };

      setSavingsGoals(prev => [newGoalData, ...prev]);
      setNewGoal({
        title: '',
        description: '',
        targetAmount: '',
        targetDate: '',
        category: 'vacation',
        priority: 'medium',
        isPublic: true
      });
      setShowCreateModal(false);

      // Show success message
      success('Savings goal created successfully!');
    } catch (err) {
      console.error('Error creating savings goal:', err);
      error('Failed to create savings goal');
    }
  };

  const contributeToGoal = async () => {
    if (!selectedGoal || !contribution.amount) return;

    try {
      // Simulate API call
      const updatedGoals = savingsGoals.map(goal => {
        if (goal.id === selectedGoal.id) {
          const contributionAmount = parseFloat(contribution.amount);
          return {
            ...goal,
            currentAmount: goal.currentAmount + contributionAmount,
            contributors: [
              ...goal.contributors.filter(c => c.userId !== 'current-user'),
              {
                userId: 'current-user',
                name: 'You',
                amount: (goal.contributors.find(c => c.userId === 'current-user')?.amount || 0) + contributionAmount,
                lastContribution: new Date().toISOString()
              }
            ]
          };
        }
        return goal;
      });

      setSavingsGoals(updatedGoals);
      setContribution({ amount: '', note: '' });
      setShowContributeModal(false);
      setSelectedGoal(null);

      success(`Rs.${parseFloat(contribution.amount).toLocaleString()} contributed successfully!`);
    } catch (err) {
      console.error('Error contributing to goal:', err);
      error('Failed to contribute to goal');
    }
  };


  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTimeRemaining = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day left';
    if (diffDays < 30) return `${diffDays} days left`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months left`;
    return `${Math.ceil(diffDays / 365)} years left`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Family Savings Goals</h2>
              <p className="text-gray-600">Work together to achieve your family's dreams</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Active Goals</p>
                <p className="text-2xl font-bold text-purple-900">{savingsGoals.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Saved</p>
                <p className="text-2xl font-bold text-green-900">
                  Rs.{savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Target Amount</p>
                <p className="text-2xl font-bold text-blue-900">
                  Rs.{savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg Progress</p>
                <p className="text-2xl font-bold text-orange-900">
                  {savingsGoals.length > 0 ? Math.round(
                    savingsGoals.reduce((sum, goal) => sum + getProgressPercentage(goal.currentAmount, goal.targetAmount), 0) / savingsGoals.length
                  ) : 0}%
                </p>
              </div>
              <Trophy className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Savings Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {savingsGoals.map(goal => {
          const CategoryIcon = goalCategories[goal.category]?.icon || Target;
          const categoryColor = goalCategories[goal.category]?.color || 'gray';
          const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
          const isCompleted = progressPercentage >= 100;
          
          return (
            <div key={goal.id} className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
              isCompleted ? 'border-green-500' : `border-${categoryColor}-500`
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full bg-${categoryColor}-100 mr-4`}>
                    <CategoryIcon className={`w-6 h-6 text-${categoryColor}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      {goal.title}
                      {isCompleted && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
                    </h3>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Rs.{goal.currentAmount.toLocaleString()} / Rs.{goal.targetAmount.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      isCompleted ? 'bg-green-500' : `bg-${categoryColor}-500`
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Contributors */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Contributors ({goal.contributors.length})
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {getTimeRemaining(goal.targetDate)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {goal.contributors.slice(0, 3).map((contributor, index) => (
                    <div key={index} className="flex items-center bg-gray-50 rounded-full px-3 py-1">
                      <div className={`w-3 h-3 rounded-full bg-${categoryColor}-500 mr-2`}></div>
                      <span className="text-xs text-gray-700">
                        {contributor.name}: Rs.{contributor.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {goal.contributors.length > 3 && (
                    <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-xs text-gray-500">
                        +{goal.contributors.length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowContributeModal(true);
                  }}
                  disabled={isCompleted}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : `bg-${categoryColor}-600 text-white hover:bg-${categoryColor}-700`
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Contribute
                    </>
                  )}
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Savings Goal</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {e.preventDefault(); createSavingsGoal();}} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Family Vacation to Bali"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Describe your savings goal..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                    placeholder="100000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(goalCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Contribute to Goal</h3>
              <button
                onClick={() => {
                  setShowContributeModal(false);
                  setSelectedGoal(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedGoal.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Rs.{selectedGoal.currentAmount.toLocaleString()} / Rs.{selectedGoal.targetAmount.toLocaleString()} 
                ({Math.round(getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount))}%)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Remaining: Rs.{(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}
              </p>
            </div>
            
            <form onSubmit={(e) => {e.preventDefault(); contributeToGoal();}} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Amount (Rs.)
                </label>
                <input
                  type="number"
                  value={contribution.amount}
                  onChange={(e) => setContribution({...contribution, amount: e.target.value})}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={contribution.note}
                  onChange={(e) => setContribution({...contribution, note: e.target.value})}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeModal(false);
                    setSelectedGoal(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Contribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilySavingsGoals;