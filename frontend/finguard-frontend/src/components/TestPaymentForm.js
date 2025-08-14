import React, { useState } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const TestPaymentForm = ({ plan, billingCycle, onSuccess, onError, onCancel }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleTestPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Get token for API call
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call the subscription upgrade API
      const response = await fetch('http://localhost:5000/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: plan.name,
          billingCycle: billingCycle
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upgrade failed: ${errorData}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Simulate successful payment
        onSuccess({
          id: 'test_payment_' + Date.now(),
          status: 'succeeded',
          amount: billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
        });
      } else {
        throw new Error(result.error || 'Upgrade failed');
      }

    } catch (err) {
      console.error('Test payment error:', err);
      setError(err.message);
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const currency = 'LKR';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Complete Payment</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{plan.display_name}</h3>
          <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {currency} {price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              /{billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          {billingCycle === 'yearly' && (
            <div className="mt-2 text-sm text-green-600">
              ✅ Save 17% with yearly billing
            </div>
          )}
        </div>

        {/* Test Payment Notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Test Mode</h4>
              <p className="text-xs text-yellow-700 mt-1">
                This is a test payment system. No real charges will be made.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Payment Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTestPayment}
            disabled={processing}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Complete Test Payment
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          <Lock className="w-3 h-3 mr-1" />
          <span>Secure test payment processing</span>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentForm;