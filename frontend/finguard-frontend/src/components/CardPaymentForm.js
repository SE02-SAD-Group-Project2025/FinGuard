import React, { useState } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const CardPaymentForm = ({ plan, onSuccess, onError, onCancel }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showCVV, setShowCVV] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    email: '',
    country: 'LK'
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Card number formatting
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Card validation functions
  const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiry = (month, year) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    return true;
  };

  const getCardType = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.match(/^4/)) return 'Visa';
    if (cleanNumber.match(/^5[1-5]/)) return 'MasterCard';
    if (cleanNumber.match(/^3[47]/)) return 'American Express';
    if (cleanNumber.match(/^6/)) return 'Discover';
    return 'Unknown';
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'expiryMonth') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
    } else if (field === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Card number validation
    if (!formData.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Expiry validation
    if (!formData.expiryMonth || !formData.expiryYear) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!validateExpiry(formData.expiryMonth, formData.expiryYear)) {
      newErrors.expiry = 'Card has expired or invalid date';
    }

    // CVV validation
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = 'CVV must be 3-4 digits';
    }

    // Cardholder name validation
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get token for API call
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Simulate card processing (2 second delay)
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
          billingCycle: plan.billing_cycle,
          paymentDetails: {
            cardType: getCardType(formData.cardNumber),
            last4: formData.cardNumber.slice(-4),
            email: formData.email
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Payment failed: ${errorData}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update token if provided
        if (result.newToken) {
          localStorage.setItem('finguard-token', result.newToken);
          // Trigger refresh event for subscription context
          window.dispatchEvent(new CustomEvent('finguard-refresh-subscription'));
        }

        // Trigger success callback
        onSuccess({
          id: 'payment_' + Date.now(),
          status: 'succeeded',
          amount: plan.price,
          cardType: getCardType(formData.cardNumber),
          last4: formData.cardNumber.slice(-4)
        });
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  const price = plan.price;
  const currency = 'LKR';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Payment Details</h2>
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
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {currency} {price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              /{plan.billing_cycle === 'yearly' ? 'year' : plan.billing_cycle}
            </span>
          </div>
          {plan.billing_cycle === 'yearly' && (
            <div className="mt-2 text-sm text-green-600">
              ✅ Save 17% with yearly billing
            </div>
          )}
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

        {/* Payment Form */}
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className={`w-full p-3 border rounded-lg ${errors.cardNumber ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <div className="absolute right-3 top-3 text-sm text-gray-500">
                {getCardType(formData.cardNumber)}
              </div>
            </div>
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>

          {/* Expiry and CVV Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <input
                type="text"
                value={formData.expiryMonth}
                onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                placeholder="MM"
                maxLength="2"
                className={`w-full p-3 border rounded-lg ${errors.expiry ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="text"
                value={formData.expiryYear}
                onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                placeholder="YY"
                maxLength="2"
                className={`w-full p-3 border rounded-lg ${errors.expiry ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <div className="relative">
                <input
                  type={showCVV ? "text" : "password"}
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  placeholder="123"
                  maxLength="4"
                  className={`w-full p-3 border rounded-lg ${errors.cvv ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowCVV(!showCVV)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          {errors.expiry && (
            <p className="text-sm text-red-600">{errors.expiry}</p>
          )}
          {errors.cvv && (
            <p className="text-sm text-red-600">{errors.cvv}</p>
          )}

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              placeholder="John Doe"
              className={`w-full p-3 border rounded-lg ${errors.cardholderName ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.cardholderName && (
              <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
              className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
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
                Pay {currency} {price.toLocaleString()}
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          <Lock className="w-3 h-3 mr-1" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default CardPaymentForm;