import React, { useState } from 'react';
import { X, AlertTriangle, ArrowDown, CheckCircle } from 'lucide-react';

const DowngradeConfirmationModal = ({ currentPlan, onConfirm, onCancel }) => {
  const [processing, setProcessing] = useState(false);

  const handleDowngrade = async () => {
    setProcessing(true);
    try {
      // Get token for API call
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Call the subscription downgrade API
      const response = await fetch('http://localhost:5000/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: 'free',
          billingCycle: 'monthly'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Downgrade failed: ${errorData}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update token if provided
        if (result.newToken) {
          localStorage.setItem('finguard-token', result.newToken);
          // Trigger refresh event for subscription context
          window.dispatchEvent(new CustomEvent('finguard-refresh-subscription'));
        }

        // Call success callback
        onConfirm(result);
      } else {
        throw new Error(result.error || 'Downgrade failed');
      }

    } catch (err) {
      console.error('Downgrade error:', err);
      alert('Failed to downgrade: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold">Confirm Downgrade</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={processing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                You're about to downgrade to the Free plan
              </h4>
              <p className="text-sm text-orange-700">
                You will lose access to premium features including:
              </p>
              <ul className="text-sm text-orange-700 mt-2 space-y-1">
                <li>• AI recommendations and advanced analytics</li>
                <li>• Family management (up to 5 members)</li>
                <li>• Investment tracking and smart alerts</li>
                <li>• Export reports and priority support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Plan Transition */}
        <div className="mb-6 flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-900">{currentPlan?.display_name}</div>
            <div className="text-xs text-gray-500">Current</div>
          </div>
          
          <ArrowDown className="w-6 h-6 text-gray-400" />
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-sm font-medium text-gray-900">Regular User</div>
            <div className="text-xs text-gray-500">Free Plan</div>
          </div>
        </div>

        {/* Confirmation Question */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Are you sure you want to downgrade?
          </h3>
          <p className="text-sm text-gray-600">
            This action will take effect immediately. You can always upgrade back to Premium later.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            No, Keep Premium
          </button>
          <button
            onClick={handleDowngrade}
            disabled={processing}
            className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Downgrading...
              </>
            ) : (
              'Yes, Downgrade'
            )}
          </button>
        </div>

        {/* Note */}
        <div className="mt-4 text-center text-xs text-gray-500">
          No charges will be made. Your premium access will end immediately.
        </div>
      </div>
    </div>
  );
};

export default DowngradeConfirmationModal;