import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import './auth.css';
import finguardLogo from '../assets/finguard.jpg';
import loginBg from '../assets/loginbg.jpg';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Get token from URL parameters
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Validate token format (basic check)
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    
    return strength;
  };

  // Real-time validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'newPassword':
        if (!value) {
          newErrors.newPassword = 'Password is required';
        } else if (value.length < 6) {
          newErrors.newPassword = 'Password must be at least 6 characters';
        } else {
          delete newErrors.newPassword;
        }
        setPasswordStrength(calculatePasswordStrength(value));
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.newPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    validateField('newPassword', formData.newPassword);
    validateField('confirmPassword', formData.confirmPassword);
    
    if (Object.keys(errors).length > 0 || !formData.newPassword || !formData.confirmPassword) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Password reset failed:', err);
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return texts[passwordStrength] || 'Very Weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#44cc00', '#00aa00'];
    return colors[passwordStrength] || '#ff4444';
  };

  // Invalid token page
  if (tokenValid === false) {
    return (
      <div 
        className="auth-page"
        style={{
          backgroundImage: `url(${loginBg})`
        }}
      >
        <div className="auth-overlay">
          <div className="auth-container">
            <div className="auth-header">
              <img src={finguardLogo} alt="FinGuard Logo" className="auth-logo" />
              <h2 className="auth-title">Invalid Reset Link</h2>
              <p className="auth-subtitle">This password reset link is invalid or has expired</p>
            </div>

            <div className="error-content">
              <div className="error-icon-large">
                <XMarkIcon className="w-16 h-16 text-red-500" />
              </div>
              <p className="error-text-large">
                The password reset link you clicked is either invalid or has expired.
              </p>
              <p className="error-note">
                Please request a new password reset link from the login page.
              </p>
            </div>

            <div className="auth-footer">
              <Link to="/forgot-password" className="auth-button primary">
                Request New Reset Link
              </Link>
              <Link to="/login" className="auth-link" style={{ marginTop: '16px', display: 'block' }}>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success page
  if (success) {
    return (
      <div 
        className="auth-page"
        style={{
          backgroundImage: `url(${loginBg})`
        }}
      >
        <div className="auth-overlay">
          <div className="auth-container">
            <div className="auth-header">
              <img src={finguardLogo} alt="FinGuard Logo" className="auth-logo" />
              <h2 className="auth-title">Password Reset Successful!</h2>
              <p className="auth-subtitle">Your password has been updated successfully</p>
            </div>

            <div className="success-content">
              <div className="success-icon-large">
                <CheckIcon className="w-16 h-16 text-green-500" />
              </div>
              <p className="success-text-large">
                Your password has been reset successfully!
              </p>
              <p className="success-note">
                You can now log in with your new password. You will be redirected to the login page automatically.
              </p>
            </div>

            <div className="auth-footer">
              <Link to="/login" className="auth-button primary">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div 
      className="auth-page"
      style={{
        backgroundImage: `url(${loginBg})`
      }}
    >
      <div className="auth-overlay">
        <div className="auth-container">
          <div className="auth-header">
            <img src={finguardLogo} alt="FinGuard Logo" className="auth-logo" />
            <h2 className="auth-title">Reset Your Password</h2>
            <p className="auth-subtitle">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <div className="input-wrapper">
                <LockClosedIcon className="input-icon" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.newPassword ? 'error' : ''}`}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${(passwordStrength / 6) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <div className="input-wrapper">
                <LockClosedIcon className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0 || !formData.newPassword || !formData.confirmPassword}
              className="auth-button primary"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;