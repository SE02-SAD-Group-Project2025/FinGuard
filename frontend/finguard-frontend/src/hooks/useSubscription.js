import { useState, useEffect, useContext, createContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// Create subscription context
const SubscriptionContext = createContext();

// Subscription provider component
export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [familyMember, setFamilyMember] = useState(false);
  const [user, setUser] = useState(null);

  // Get token helper
  const getToken = () => localStorage.getItem('finguard-token');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    if (!token) return null;

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
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return null;
    }
  };

  // Fetch subscription data
  const fetchSubscription = async () => {
    try {
      const response = await apiCall('/api/subscriptions/current');
      if (response && response.success) {
        setSubscription(response.subscription);
      } else {
        // Check if user has premium role but no subscription record
        const userData = getUserFromToken();
        if (userData && userData.role === 'Premium User') {
          // Create virtual premium subscription for legacy premium users
          setSubscription({
            plan_name: 'premium',
            display_name: 'Premium Plan (Legacy)',
            status: 'active',
            max_family_members: 1,
            features: ['All Premium features', 'AI recommendations', 'Advanced analytics'],
            is_legacy: true
          });
        } else if (userData && userData.role === 'Admin') {
          // Create virtual admin subscription
          setSubscription({
            plan_name: 'family',
            display_name: 'Admin Access',
            status: 'active',
            max_family_members: 999,
            features: ['All features'],
            is_legacy: true
          });
        } else {
          // Set default free subscription if no active subscription
          setSubscription({
            plan_name: 'free',
            display_name: 'Free Plan',
            status: 'active',
            max_family_members: 1,
            features: ['Basic expense tracking', 'Simple budgets', 'Basic reports']
          });
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Fallback to free plan on error
      setSubscription({
        plan_name: 'free',
        display_name: 'Free Plan',
        status: 'active',
        max_family_members: 1,
        features: ['Basic expense tracking', 'Simple budgets', 'Basic reports']
      });
    }
    
    // Check if user is a family member after setting subscription
    checkFamilyMembership();
  };
  
  // Check family membership
  const checkFamilyMembership = async () => {
    try {
      const familyResponse = await apiCall('/api/family/family-group');
      if (familyResponse.isMember) {
        setFamilyMember(true);
      }
    } catch (error) {
      console.log('Not a family member or error checking family status');
    }
  };

  // Get user info from token
  const getUserFromToken = () => {
    const token = getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      const userData = getUserFromToken();
      setUser(userData);
      
      if (userData) {
        await fetchSubscription();
      } else {
        // Reset state when no user is logged in
        setSubscription(null);
        setFamilyMember(false);
      }
      
      setLoading(false);
    };

    initializeData();

    // Listen for storage changes (when token is added/removed in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'finguard-token') {
        initializeData();
      }
    };

    // Listen for custom refresh events (for same-tab token changes)
    const handleRefreshEvent = () => {
      initializeData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('finguard-refresh-subscription', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('finguard-refresh-subscription', handleRefreshEvent);
    };
  }, []);

  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  // Full refresh (for login scenarios)
  const refreshAll = async () => {
    setLoading(true);
    const userData = getUserFromToken();
    setUser(userData);
    
    if (userData) {
      await fetchSubscription();
    } else {
      setSubscription(null);
      setFamilyMember(false);
    }
    
    setLoading(false);
  };

  // Reset all state (for logout)
  const resetSubscriptionState = () => {
    setSubscription(null);
    setFamilyMember(false);
    setUser(null);
    setLoading(false);
  };

  const value = {
    subscription,
    user,
    loading,
    familyMember,
    refreshSubscription,
    refreshAll,
    resetSubscriptionState,
    // Helper functions
    isPremium: () => {
      // Check subscription-based premium access
      const hasSubscription = subscription && ['premium', 'family'].includes(subscription.plan_name);
      // Check role-based premium access (legacy/admin) - ONLY for exact role match
      const hasLegacyRole = user && user.role === 'Premium User';
      const isAdmin = user && user.role === 'Admin';
      return hasSubscription || hasLegacyRole || isAdmin;
    },
    hasFamilyAccess: () => {
      return value.isPremium() || familyMember;
    },
    isFamily: () => {
      // Check subscription-based family access
      const hasSubscription = subscription && subscription.plan_name === 'family';
      // Admin can access family features
      const isAdmin = user && user.role === 'Admin';
      return hasSubscription || isAdmin;
    },
    isFree: () => {
      const hasSubscription = subscription && ['premium', 'family'].includes(subscription.plan_name);
      const hasLegacyRole = user && user.role === 'Premium User';
      const isAdmin = user && user.role === 'Admin';
      return !hasSubscription && !hasLegacyRole && !isAdmin;
    },
    hasFeature: (feature) => {
      if (!subscription || !subscription.features) return false;
      return subscription.features.some(f => 
        f.toLowerCase().includes(feature.toLowerCase())
      );
    },
    canAccessFeature: (feature) => {
      const features = {
        'ai_recommendations': ['premium', 'family'],
        'advanced_analytics': ['premium', 'family'],
        'export_reports': ['premium', 'family'],
        'investment_tracking': ['premium', 'family'],
        'smart_alerts': ['premium', 'family'],
        'priority_support': ['premium', 'family'],
        'family_management': ['family'],
        'unlimited_categories': ['premium', 'family'],
        'goal_setting': ['premium', 'family'],
        'multi_account': ['premium', 'family']
      };
      
      // Check role-based access (legacy/admin) - EXACT role match only
      if (user && user.role === 'Premium User') {
        return true; // Legacy premium users have access to all features
      }
      if (user && user.role === 'Admin') {
        return true; // Admin has access to all features
      }
      
      // Check subscription-based access
      if (!subscription) {
        return false;
      }
      
      const requiredPlans = features[feature];
      // Default to false for unknown features - security by default
      const hasAccess = requiredPlans ? requiredPlans.includes(subscription.plan_name) : false;
      
      // Log access control for debugging (can be removed in production)
      if (!hasAccess && requiredPlans) {
        console.log(`🔒 Access denied to "${feature}": requires ${requiredPlans.join(' or ')} but user has "${subscription.plan_name}"`);
      }
      
      return hasAccess;
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook to use subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Higher-order component for subscription-based access control
export const withSubscriptionAccess = (Component, requiredFeature) => {
  return (props) => {
    const { canAccessFeature, subscription, loading } = useSubscription();

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      );
    }

    if (requiredFeature && !canAccessFeature(requiredFeature)) {
      return (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Premium Feature
            </h3>
            <p className="text-gray-600 mb-4">
              This feature requires a {requiredFeature === 'family_management' ? 'Family' : 'Premium'} subscription.
            </p>
            <div className="space-y-2">
              <a
                href="/subscription/plans"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </a>
              <div>
                <span className="text-sm text-gray-500">
                  Current: {subscription?.display_name || 'Free Plan'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Component to show subscription-based content
export const SubscriptionGate = ({ 
  feature, 
  children, 
  fallback = null,
  showUpgrade = true 
}) => {
  const { canAccessFeature, subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
    );
  }

  if (!canAccessFeature(feature)) {
    if (showUpgrade) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <div className="text-yellow-600 mb-2">🔒</div>
              <div className="text-sm font-medium text-gray-700 mb-2">Premium Feature</div>
              <a
                href="/subscription/plans"
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Upgrade
              </a>
            </div>
          </div>
          {fallback || <div className="blur-sm">{children}</div>}
        </div>
      );
    }
    return fallback;
  }

  return children;
};

export default useSubscription;