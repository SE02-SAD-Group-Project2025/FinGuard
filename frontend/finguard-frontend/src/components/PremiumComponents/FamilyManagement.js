import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import Navbar from '../Navbar';
import AnimatedPage from '../AnimatedPage';
import ErrorBoundary from '../ErrorBoundary';
import FamilyBudgetTracker from '../FamilyBudgetTracker';
import FamilySavingsGoals from '../FamilySavingsGoals';
import FamilyTransactionCategories from '../FamilyTransactionCategories';
import MonthlyFamilyReports from '../MonthlyFamilyReports';
import AllowanceManagement from '../AllowanceManagement';
import ExpenseApprovalWorkflow from '../ExpenseApprovalWorkflow';
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Heart,
  Baby,
  User,
  Clock,
  Trash2,
  Edit,
  PieChart,
  Send,
  Copy,
  Activity,
  Target,
  Tags,
  FileText
} from 'lucide-react';

const FamilyManagement = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isPremium, hasFamilyAccess } = useSubscription();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [showRealTimeTracker, setShowRealTimeTracker] = useState(false);
  const [showSavingsGoals, setShowSavingsGoals] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showAllowances, setShowAllowances] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    financialSummary: false,
    realTimeTracker: false,
    savingsGoals: false,
    categories: false,
    reports: false,
    allowances: false,
    approvals: false
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Wife',
    monthlyBudget: 15000
  });
  const [familyName, setFamilyName] = useState('');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const roleIcons = {
    'Wife': { icon: Heart, color: 'text-pink-500', bgColor: isDarkMode ? 'bg-pink-900' : 'bg-pink-100' },
    'Husband': { icon: User, color: 'text-blue-500', bgColor: isDarkMode ? 'bg-blue-900' : 'bg-blue-100' },
    'Mother': { icon: Heart, color: 'text-purple-500', bgColor: isDarkMode ? 'bg-purple-900' : 'bg-purple-100' },
    'Father': { icon: User, color: 'text-indigo-500', bgColor: isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100' },
    'Son': { icon: Baby, color: 'text-green-500', bgColor: isDarkMode ? 'bg-green-900' : 'bg-green-100' },
    'Daughter': { icon: Baby, color: 'text-pink-500', bgColor: isDarkMode ? 'bg-pink-900' : 'bg-pink-100' },
    'Other': { icon: User, color: 'text-gray-500', bgColor: isDarkMode ? 'bg-gray-700' : 'bg-gray-100' }
  };

  // Fetch family data
  const fetchFamilyData = async () => {
    const token = localStorage.getItem('finguard-token');
    try {
      const response = await fetch('http://localhost:5000/api/family/family-group', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFamilyData(data);
        if (data.isHead || data.isMember) {
          fetchFinancialSummary();
        }
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch financial summary
  const fetchFinancialSummary = async () => {
    const token = localStorage.getItem('finguard-token');
    setLoadingStates(prev => ({ ...prev, financialSummary: true }));
    
    try {
      const response = await fetch('http://localhost:5000/api/family/financial-summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinancialSummary(data);
      } else {
        toast.error('Failed to load financial summary');
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      toast.error('Unable to load financial data. Please check your connection.');
    } finally {
      setLoadingStates(prev => ({ ...prev, financialSummary: false }));
    }
  };

  // Create family group
  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const token = localStorage.getItem('finguard-token');
    try {
      const response = await fetch('http://localhost:5000/api/family/family-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: familyName })
      });

      if (response.ok) {
        setShowCreateFamilyModal(false);
        setFamilyName('');
        fetchFamilyData();
        toast.success('Family group created successfully!', 5000, [
          { label: 'Add Members', onClick: () => setShowInviteModal(true) }
        ]);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create family group');
      }
    } catch (error) {
      console.error('Error creating family:', error);
      toast.error('Failed to create family group. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Send invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const token = localStorage.getItem('finguard-token');
    try {
      const response = await fetch('http://localhost:5000/api/family/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteForm)
      });

      if (response.ok) {
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'Wife', monthlyBudget: 15000 });
        fetchFamilyData();
        toast.success('Invitation sent successfully! The member will receive an email with instructions.', 6000, [
          { label: 'Send Another', onClick: () => setShowInviteModal(true) }
        ]);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove family member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this family member?')) return;
    
    const token = localStorage.getItem('finguard-token');
    try {
      const response = await fetch(`http://localhost:5000/api/family/member/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchFamilyData();
        toast.success('Family member removed successfully', 5000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to remove family member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove family member. Please try again.');
    }
  };

  // Update member budget
  const handleUpdateBudget = async (memberId, newBudget) => {
    const token = localStorage.getItem('finguard-token');
    try {
      const response = await fetch(`http://localhost:5000/api/family/member/${memberId}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ monthlyBudget: newBudget })
      });

      if (response.ok) {
        fetchFamilyData();
        toast.success('Budget updated successfully', 5000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update budget');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget. Please try again.');
    }
  };

  useEffect(() => {
    if (hasFamilyAccess()) {
      fetchFamilyData();
    }
  }, []);

  // Family access check
  if (!hasFamilyAccess()) {
    return (
      <AnimatedPage>
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-md mx-auto text-center`}>
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Premium Feature</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Family Account Management is available for Premium users only. Manage up to 4 family members with individual budgets and shared financial tracking.
                </p>
                <button
                  onClick={() => navigate('/subscription/plans')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (loading) {
    return (
      <AnimatedPage>
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3 mb-4`}></div>
              <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 mb-8`}></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl h-32`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <div className="flex items-center mb-2">
                  <Users className="w-6 h-6 text-blue-600 mr-2" />
                  <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Family Account Management</h1>
                </div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage family members, budgets, and track shared finances</p>
              </div>
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                  Premium Feature
                </span>
              </div>
            </div>
          </div>

          {/* No Family Group - Show Create Option */}
          {!familyData?.isHead && !familyData?.isMember && (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-sm text-center`}>
              <Users className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Create Your Family Group</h2>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Start managing your family's finances together. Add up to 4 family members with individual budgets and roles.
              </p>
              <button
                onClick={() => setShowCreateFamilyModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Users className="w-5 h-5 mr-2" />
                Create Family Group
              </button>
            </div>
          )}

          {/* Family Dashboard */}
          {(familyData?.isHead || familyData?.isMember) && (
            <>
              {/* Family Header */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm mb-8`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {familyData.familyGroup.name}
                    </h2>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {familyData.isHead ? 'Family Head' : `Role: ${familyData.familyGroup.role}`} • 
                      {familyData.familyGroup.members?.length || 0} Members
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {familyData.isHead && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        disabled={familyData.familyGroup.members?.length >= 4}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Add Member</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowFinancialSummary(!showFinancialSummary)}
                      className={`border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} px-3 py-2 rounded-lg transition-colors flex items-center text-sm`}
                    >
                      <PieChart className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden md:inline">Financial Summary</span>
                      <span className="md:hidden">Summary</span>
                    </button>
                    
                    <button
                      onClick={() => setShowRealTimeTracker(!showRealTimeTracker)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        showRealTimeTracker 
                          ? 'bg-blue-600 text-white' 
                          : 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Activity className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden lg:inline">Live Budget Tracking</span>
                      <span className="lg:hidden">Live Budget</span>
                      {showRealTimeTracker && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1 sm:ml-2"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowSavingsGoals(!showSavingsGoals)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        showSavingsGoals 
                          ? 'bg-purple-600 text-white' 
                          : 'border border-purple-300 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <Target className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden md:inline">Family Goals</span>
                      <span className="md:hidden">Goals</span>
                    </button>
                    
                    <button
                      onClick={() => setShowCategories(!showCategories)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        showCategories 
                          ? 'bg-green-600 text-white' 
                          : 'border border-green-300 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <Tags className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden lg:inline">Manage Categories</span>
                      <span className="lg:hidden">Categories</span>
                    </button>
                    
                    <button
                      onClick={() => setShowAllowances(!showAllowances)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        showAllowances 
                          ? 'bg-orange-600 text-white' 
                          : 'border border-orange-300 text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      <Users className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden lg:inline">Allowance Management</span>
                      <span className="lg:hidden">Allowances</span>
                    </button>
                    
                    <button
                      onClick={() => setShowApprovals(!showApprovals)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        showApprovals 
                          ? 'bg-indigo-600 text-white' 
                          : 'border border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <Users className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden lg:inline">Expense Approvals</span>
                      <span className="lg:hidden">Approvals</span>
                    </button>
                    
                    <button
                      onClick={() => setShowReports(!showReports)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm ${
                        showReports 
                          ? 'bg-indigo-600 text-white' 
                          : 'border border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden md:inline">Monthly Reports</span>
                      <span className="md:hidden">Reports</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              {showFinancialSummary && (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm mb-8`}>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Family Financial Overview</h3>
                  
                  {loadingStates.financialSummary ? (
                    <div className="animate-pulse">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} p-4 rounded-lg h-20`}></div>
                        ))}
                      </div>
                    </div>
                  ) : financialSummary ? (
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className={`${isDarkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'} p-4 rounded-lg`}>
                      <div className="text-sm text-blue-600 font-medium">Total Budget</div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                        Rs.{financialSummary.summary.totalBudget.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className={`${isDarkMode ? 'bg-green-900 bg-opacity-50' : 'bg-green-50'} p-4 rounded-lg`}>
                      <div className="text-sm text-green-600 font-medium">Total Income</div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>
                        Rs.{financialSummary.summary.totalIncome.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className={`${isDarkMode ? 'bg-red-900 bg-opacity-50' : 'bg-red-50'} p-4 rounded-lg`}>
                      <div className="text-sm text-red-600 font-medium">Total Expenses</div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>
                        Rs.{financialSummary.summary.totalExpenses.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className={`${isDarkMode ? 'bg-purple-900 bg-opacity-50' : 'bg-purple-50'} p-4 rounded-lg`}>
                      <div className="text-sm text-purple-600 font-medium">Family Savings</div>
                      <div className={`text-2xl font-bold ${financialSummary.summary.totalSavings >= 0 ? (isDarkMode ? 'text-purple-300' : 'text-purple-900') : 'text-red-900'}`}>
                        Rs.{financialSummary.summary.totalSavings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p>Unable to load financial data. Please try refreshing.</p>
                      <button
                        onClick={fetchFinancialSummary}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Budget Tracker */}
              {showRealTimeTracker && (
                <div className="mb-8">
                  {loadingStates.realTimeTracker ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ErrorBoundary componentName="Family Budget Tracker">
                      <FamilyBudgetTracker />
                    </ErrorBoundary>
                  )}
                </div>
              )}

              {/* Family Savings Goals */}
              {showSavingsGoals && (
                <div className="mb-8">
                  {loadingStates.savingsGoals ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ErrorBoundary componentName="Family Savings Goals">
                      <FamilySavingsGoals />
                    </ErrorBoundary>
                  )}
                </div>
              )}

              {/* Family Transaction Categories */}
              {showCategories && (
                <div className="mb-8">
                  {loadingStates.categories ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ErrorBoundary componentName="Family Transaction Categories">
                      <FamilyTransactionCategories />
                    </ErrorBoundary>
                  )}
                </div>
              )}

              {/* Monthly Family Reports */}
              {showReports && (
                <div className="mb-8">
                  {loadingStates.reports ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ErrorBoundary componentName="Monthly Family Reports">
                      <MonthlyFamilyReports />
                    </ErrorBoundary>
                  )}
                </div>
              )}

              {/* Allowance Management */}
              {showAllowances && (
                <div className="mb-8">
                  {loadingStates.allowances ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ErrorBoundary componentName="Allowance Management">
                      <AllowanceManagement />
                    </ErrorBoundary>
                  )}
                </div>
              )}

              {/* Expense Approval Workflow */}
              {showApprovals && (
                <div className="mb-8">
                  {loadingStates.approvals ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ErrorBoundary componentName="Expense Approval Workflow">
                      <ExpenseApprovalWorkflow />
                    </ErrorBoundary>
                  )}
                </div>
              )}

              {/* Family Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {familyData.familyGroup.members?.map((member) => {
                  const displayRole = member.display_role || member.role;
                  const roleConfig = roleIcons[displayRole] || roleIcons['Other'];
                  const Icon = roleConfig.icon;
                  const finData = financialSummary?.members.find(m => m.userId === member.user_id);
                  
                  return (
                    <div key={member.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-full ${roleConfig.bgColor}`}>
                            <Icon className={`w-6 h-6 ${roleConfig.color}`} />
                          </div>
                          <div className="ml-3">
                            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{displayRole}</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{member.username}</p>
                          </div>
                        </div>
                        
                        {familyData.isHead && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const newBudget = window.prompt('Enter new monthly budget:', member.monthly_budget);
                                if (newBudget && !isNaN(newBudget)) {
                                  handleUpdateBudget(member.id, parseFloat(newBudget));
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Budget:</span>
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rs.{parseFloat(member.monthly_budget || 0).toLocaleString()}/month</span>
                        </div>
                        
                        {finData && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Income:</span>
                              <span className="font-medium text-green-600">Rs.{finData.monthlyIncome.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Expenses:</span>
                              <span className="font-medium text-red-600">Rs.{finData.monthlyExpenses.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Balance:</span>
                              <span className={`font-medium ${finData.monthlyBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                Rs.{finData.monthlyBalance.toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500">Budget Usage:</span>
                                <span className="text-xs text-gray-500">{finData.budgetUtilization}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    finData.budgetUtilization <= 80 ? 'bg-green-500' : 
                                    finData.budgetUtilization <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(finData.budgetUtilization, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pending Invitations */}
              {familyData.isHead && familyData.familyGroup.pendingInvitations?.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                    Pending Invitations
                  </h3>
                  
                  <div className="space-y-3">
                    {familyData.familyGroup.pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-yellow-600 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{invitation.invited_email}</p>
                            <p className="text-sm text-gray-600">
                              Role: {invitation.invited_role} • Budget: Rs.{parseFloat(invitation.monthly_budget || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/family/accept-invitation/${invitation.invitation_token}`;
                              navigator.clipboard.writeText(link);
                              toast.success('Invitation link copied to clipboard!', 3000);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Copy invitation link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Create Family Modal */}
          {showCreateFamilyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full mx-4`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Create Family Group</h3>
                
                <form onSubmit={handleCreateFamily} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="e.g., The Smiths, Johnson Family"
                      className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateFamilyModal(false)}
                      className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Family'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Invite Member Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full mx-4`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Invite Family Member</h3>
                
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      placeholder="member@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      They must have a FinGuard account to accept the invitation
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Budget (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={inviteForm.monthlyBudget}
                      onChange={(e) => setInviteForm({...inviteForm, monthlyBudget: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default FamilyManagement;