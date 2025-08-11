import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, Mail, Crown, Clock } from 'lucide-react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { buildApiUrl, getApiConfig } from '../config/api';
import { useToast } from '../contexts/ToastContext';

const AcceptFamilyInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [responding, setResponding] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      // For now, we'll validate the invitation when accepting/declining
      // In a full implementation, you might want to validate the token first
      setLoading(false);
    } catch (err) {
      setErrorState('Invalid or expired invitation link');
      setLoading(false);
    }
  };

  const handleResponse = async (action) => {
    const authToken = localStorage.getItem('finguard-token');
    if (!authToken) {
      error('Please login to respond to this invitation');
      navigate('/login');
      return;
    }

    setResponding(true);
    
    try {
      const response = await fetch(buildApiUrl(`${getApiConfig().ENDPOINTS.FAMILY.BASE}/${action}-invitation/${token}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        if (action === 'accept') {
          success(data.message);
          navigate('/family-dashboard');
        } else {
          success('Invitation declined successfully');
          navigate('/dashboard');
        }
      } else {
        setErrorState(data.message);
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setErrorState('Failed to respond to invitation. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (errorState) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
              <p className="text-gray-600 mb-6">{errorState}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Invitation</h1>
              <p className="text-gray-600">You've been invited to join a family account on FinGuard</p>
            </div>

            {/* Invitation Details */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Family Account Invitation</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Status:</span>
                  <span className="font-medium text-blue-900">Pending Response</span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">As a family member, you'll get:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Personal budget tracking within family plan
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Access to family financial overview
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Premium family features and analytics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Collaborative budget planning
                </li>
              </ul>
            </div>

            {/* Premium Badge */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-purple-900">
                  Premium Family Feature - No additional cost to you!
                </span>
              </div>
            </div>

            {/* Warning about login */}
            {!localStorage.getItem('finguard-token') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Please <button 
                      onClick={() => navigate('/login')}
                      className="font-medium underline hover:no-underline"
                    >
                      login to your FinGuard account
                    </button> to respond to this invitation.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleResponse('accept')}
                disabled={responding || !localStorage.getItem('finguard-token')}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {responding ? 'Accepting...' : 'Accept Invitation'}
              </button>
              
              <button
                onClick={() => handleResponse('decline')}
                disabled={responding || !localStorage.getItem('finguard-token')}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 mr-2" />
                {responding ? 'Declining...' : 'Decline'}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                This invitation will expire in 7 days. If you don't want to join, you can safely ignore this invitation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AcceptFamilyInvitation;