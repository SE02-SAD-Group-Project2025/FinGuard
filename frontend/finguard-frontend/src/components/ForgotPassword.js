import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';
import finguardLogo from '../assets/finguard.jpg';
import loginBg from '../assets/loginbg.jpg';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div 
        className="auth-page"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh'
        }}
      >
        <div className="auth-overlay">
          <div className="auth-container">
            <div className="auth-header">
              <img src={finguardLogo} alt="FinGuard Logo" className="auth-logo" />
              <h2 className="auth-title">Check Your Email</h2>
              <p className="auth-subtitle">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>

            <div className="success-content">
              <div className="success-icon">📧</div>
              <p className="success-text">
                If an account with that email exists, you'll receive a password reset link shortly.
              </p>
              <p className="success-note">
                Didn't receive the email? Check your spam folder or try again with a different email address.
              </p>
            </div>

            <div className="auth-footer">
              <Link to="/login" className="auth-button secondary">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="auth-page"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      <div className="auth-overlay">
        <div className="auth-container">
          <div className="auth-header">
            <img src={finguardLogo} alt="FinGuard Logo" className="auth-logo" />
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <EnvelopeIcon className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`form-input ${error ? 'error' : ''}`}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-button primary"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              <ArrowLeftIcon className="w-4 h-4 inline mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;