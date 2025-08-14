import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  CreditCard, 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51...');

const PaymentForm = ({ plan, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        setProcessing(false);
        return;
      }

      // Create payment intent
      const token = localStorage.getItem('finguard-token');
      const response = await axios.post('/api/payments/create-payment-intent', {
        planId: plan.id,
        paymentMethodId: paymentMethod.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { success, requiresAction, paymentIntent } = response.data;

      if (success) {
        // Payment successful
        onSuccess(paymentIntent);
      } else if (requiresAction) {
        // 3D Secure authentication required
        const { error: confirmError } = await stripe.confirmCardPayment(paymentIntent.client_secret);
        
        if (confirmError) {
          setError(confirmError.message);
        } else {
          // Confirm with backend
          const confirmResponse = await axios.post('/api/payments/confirm-payment', {
            paymentIntentId: paymentIntent.id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (confirmResponse.data.success) {
            onSuccess(confirmResponse.data.paymentIntent);
          } else {
            setError('Payment confirmation failed');
          }
        }
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      onError && onError(err);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        backgroundColor: '#ffffff',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 border">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payment</h3>
          <p className="text-gray-600">
            Subscribe to <span className="font-medium text-blue-600">{plan.name}</span>
          </p>
          <div className="mt-2">
            <span className="text-2xl font-bold text-green-600">LKR {parseFloat(plan.price).toFixed(2)}</span>
            <span className="text-gray-500 ml-1">/{plan.duration}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Element */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Supported Cards */}
          <div className="flex items-center justify-center space-x-4 py-2">
            <span className="text-sm text-gray-500">We accept:</span>
            <div className="flex space-x-2">
              <div className="w-8 h-5 bg-blue-600 text-white text-xs flex items-center justify-center rounded">
                VISA
              </div>
              <div className="w-8 h-5 bg-red-600 text-white text-xs flex items-center justify-center rounded">
                MC
              </div>
              <div className="w-8 h-5 bg-green-600 text-white text-xs flex items-center justify-center rounded">
                AMEX
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Security Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="w-4 h-4 mr-2 text-green-500" />
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Lock className="w-4 h-4 mr-2 text-green-500" />
              <span>Powered by Stripe - PCI DSS compliant</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || processing}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay LKR {parseFloat(plan.price).toFixed(2)}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By completing this payment, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

const StripePaymentForm = ({ plan, onSuccess, onError, onCancel }) => {
  if (!plan) {
    return <div>No plan selected</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        plan={plan}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
};

export default StripePaymentForm;