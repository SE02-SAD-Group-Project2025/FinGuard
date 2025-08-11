import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import {
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  StarIcon,
  ArrowRightIcon,
  SparklesIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  BellAlertIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Crown } from 'lucide-react';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Get token for API calls
  const getToken = () => localStorage.getItem('finguard-token');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    if (!token) {
      setError('Please login to continue');
      return null;
    }

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch subscription plans and current subscription
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch available plans
      const plansResponse = await fetch('http://localhost:5000/api/subscriptions/plans');
      const plansData = await plansResponse.json();
      
      if (plansData.success) {
        setPlans(plansData.plans);
      }

      // Fetch current subscription
      try {
        const currentResponse = await apiCall('/api/subscriptions/current');
        if (currentResponse.success) {
          setCurrentSubscription(currentResponse.subscription);
        }
      } catch (err) {
        // User might not have an active subscription
        console.log('No active subscription found');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  // Handle plan upgrade
  const handleUpgrade = async (planName) => {
    if (!planName) return;
    
    setUpgrading(true);
    setError('');
    
    try {
      const response = await apiCall('/api/subscriptions/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          planName: planName,
          billingCycle: billingCycle
        })
      });

      if (response.success) {
        setSuccess(response.message);
        // Refresh current subscription data
        await fetchData();
        
        // Redirect to appropriate dashboard after a delay
        setTimeout(() => {
          if (planName === 'premium') {
            navigate('/premium-dashboard');
          } else if (planName === 'family') {
            navigate('/family-dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      }
    } catch (error) {
      setError(`Failed to upgrade: ${error.message}`);
    } finally {
      setUpgrading(false);
    }
  };

  // Get plan features with icons
  const getPlanFeatures = (planName) => {
    const baseFeatures = [
      { icon: ChartBarIcon, text: 'Basic expense tracking', included: true },
      { icon: BanknotesIcon, text: 'Simple budgets', included: true },
      { icon: DocumentChartBarIcon, text: 'Basic reports', included: true },
    ];

    const premiumFeatures = [
      ...baseFeatures,
      { icon: SparklesIcon, text: 'AI recommendations', included: true },
      { icon: ChartBarIcon, text: 'Advanced analytics', included: true },
      { icon: DocumentChartBarIcon, text: 'Export reports', included: true },
      { icon: StarIcon, text: 'Investment tracking', included: true },
      { icon: BellAlertIcon, text: 'Smart alerts', included: true },
      { icon: ShieldCheckIcon, text: 'Priority support', included: true },
    ];

    const familyFeatures = [
      ...premiumFeatures,
      { icon: UsersIcon, text: 'Up to 5 family members', included: true },
      { icon: Crown, text: 'Parent controls', included: true },
      { icon: UsersIcon, text: 'Family dashboard', included: true },
      { icon: ChartBarIcon, text: 'Combined reporting', included: true },
    ];

    switch (planName) {
      case 'free':
        return [
          ...baseFeatures,
          { icon: XMarkIcon, text: 'AI recommendations', included: false },
          { icon: XMarkIcon, text: 'Advanced analytics', included: false },
          { icon: XMarkIcon, text: 'Family features', included: false },
        ];
      case 'premium':
        return [
          ...premiumFeatures,
          { icon: XMarkIcon, text: 'Family features', included: false },
        ];
      case 'family':
        return familyFeatures;
      default:
        return baseFeatures;
    }
  };

  // Get plan styling
  const getPlanStyling = (planName, isCurrentPlan) => {
    const baseClasses = "relative rounded-2xl border p-8 shadow-sm";
    
    if (isCurrentPlan) {
      return `${baseClasses} border-green-500 bg-green-50 ring-2 ring-green-500`;
    }
    
    switch (planName) {
      case 'premium':
        return `${baseClasses} border-purple-200 hover:border-purple-300`;
      case 'family':
        return `${baseClasses} border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50`;
      default:
        return `${baseClasses} border-gray-200 hover:border-gray-300`;
    }
  };

  // Get plan badge
  const getPlanBadge = (planName, isCurrentPlan) => {
    if (isCurrentPlan) {
      return (
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Current Plan
        </span>
      );
    }
    
    if (planName === 'family') {
      return (
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </span>
      );
    }
    
    if (planName === 'premium') {
      return (
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Recommended
        </span>
      );
    }
    
    return null;
  };

  const formatPrice = (monthly, yearly) => {
    const price = billingCycle === 'yearly' ? yearly : monthly;
    return price === 0 ? 'Free' : `LKR ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar />
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription plans...</p>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        
        {/* Header */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your FinGuard Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock powerful financial management tools and take control of your money with the right plan for you.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border border-red-200">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-800 border border-green-200">
            <span className="font-medium">Success:</span> {success}
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  Current: {currentSubscription.display_name}
                </h3>
                <p className="text-sm text-blue-700">
                  {currentSubscription.is_expired ? 'Expired' : 
                   `Active until ${new Date(currentSubscription.current_period_end).toLocaleDateString()}`}
                </p>
              </div>
              {currentSubscription.plan_name !== 'free' && (
                <button
                  onClick={() => navigate('/subscription/manage')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Subscription →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_name === plan.name;
            const features = getPlanFeatures(plan.name);
            
            return (
              <div key={plan.id} className={getPlanStyling(plan.name, isCurrentPlan)}>
                {getPlanBadge(plan.name, isCurrentPlan)}
                
                {/* Plan Header */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price_monthly, plan.price_yearly)}
                    </span>
                    {plan.price_monthly > 0 && (
                      <span className="text-gray-600">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <feature.icon 
                        className={`w-5 h-5 mt-0.5 mr-3 ${
                          feature.included ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                      <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <div className="mt-auto">
                  {isCurrentPlan ? (
                    <button className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={upgrading}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                        plan.name === 'family'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                          : plan.name === 'premium'
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {upgrading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Upgrading...
                        </>
                      ) : (
                        <>
                          {plan.name === 'free' ? 'Downgrade' : 'Upgrade'}
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Free
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premium
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Family
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  'Basic expense tracking',
                  'Simple budgets',
                  'Basic reports',
                  'AI recommendations',
                  'Advanced analytics',
                  'Export reports',
                  'Investment tracking',
                  'Smart alerts',
                  'Priority support',
                  'Family members',
                  'Parent controls',
                  'Family dashboard'
                ].map((feature, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {feature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {index < 3 ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {index < 9 ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">
                Can I change my plan at any time?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">
                How does the family plan work?
              </h3>
              <p className="text-gray-600">
                Family plans support up to 5 members with role-based access. Parents can set budgets 
                and view all family finances, while children can only add expenses within their allocated budgets.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">
                Is my financial data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use bank-level encryption and security measures to protect your data. 
                We never share your information with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default SubscriptionPlans;