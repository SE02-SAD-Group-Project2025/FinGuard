import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import finguardLogo from '../assets/finguard.jpg';
import loginBg from '../assets/loginbg.jpg';
import { jwtDecode } from 'jwt-decode';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const navigate = useNavigate();

  // Auto-focus first input
  useEffect(() => {
    document.getElementById('email-input')?.focus();
  }, []);

  // Real-time validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Real-time validation
    if (name !== 'rememberMe') {
      validateField(name, fieldValue);
    }
  };

  const handleKeyPress = (e, nextFieldId) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault();
      document.getElementById(nextFieldId)?.focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    validateField('email', formData.email);
    validateField('password', formData.password);
    
    if (Object.keys(errors).length > 0 || !formData.email || !formData.password) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if 2FA is required (only for users who have it enabled)
      if (data.requires2FA) {
        setRequires2FA(true);
        return;
      }

      // Normal login flow continues as before
      // Store token
      localStorage.setItem('finguard-token', data.token);
      
      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem('finguard-remember', 'true');
      }

      const decoded = jwtDecode(data.token);
      const role = decoded.role;

      // Navigate based on role (kept exactly as before)
      if (role === 'Admin') {
        navigate('/admin/AdminDashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err.message);
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification (only for users with 2FA enabled)
  const handle2FAVerification = async (e) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setErrors({ twoFactor: 'Please enter a 6-digit verification code' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/complete-2fa-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          token: useBackupCode ? undefined : twoFactorCode,
          backup_code: useBackupCode ? twoFactorCode : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '2FA verification failed');
      }

      // Complete login with token - same flow as normal login
      localStorage.setItem('finguard-token', data.token);
      
      if (formData.rememberMe) {
        localStorage.setItem('finguard-remember', 'true');
      }

      const decoded = jwtDecode(data.token);
      const role = decoded.role;

      // Navigate based on role (same as normal login)
      if (role === 'Admin') {
        navigate('/admin/AdminDashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('2FA verification failed:', err.message);
      setErrors({ twoFactor: err.message });
    } finally {
      setLoading(false);
    }
  };

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
            <img
              src={finguardLogo}
              alt="FinGuard Logo"
              className="auth-logo"
            />
            <h2 className="auth-title">
              {requires2FA ? 'Security Verification' : 'Welcome Back'}
            </h2>
            <p className="auth-subtitle">
              {requires2FA ? 'Complete your secure login' : 'Sign in to your FinGuard account'}
            </p>
          </div>

          {!requires2FA ? (
            // Regular Login Form
            <form onSubmit={handleLogin} className="auth-form">
              {errors.general && (
                <div className="error-banner">
                  <span className="error-icon">⚠️</span>
                  {errors.general}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email-input" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <EnvelopeIcon className="input-icon" />
                  <input
                    id="email-input"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    onKeyPress={(e) => handleKeyPress(e, 'password-input')}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password-input" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <LockClosedIcon className="input-icon" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    autoComplete="current-password"
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
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Remember me</span>
                </label>
                
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="auth-button primary"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            // 2FA Verification Form
            <form onSubmit={handle2FAVerification} className="auth-form">
              <div style={{textAlign: 'center', marginBottom: '24px'}}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>🔐</div>
                <h2 style={{fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px'}}>
                  Two-Factor Authentication
                </h2>
                <p style={{color: '#6b7280', fontSize: '14px'}}>
                  Enter the 6-digit code from your authenticator app
                </p>
                <div style={{color: '#6b7280', fontSize: '12px', marginTop: '8px'}}>
                  Signing in as: <strong>{formData.email}</strong>
                </div>
              </div>

              {errors.twoFactor && (
                <div className="error-banner">
                  <span className="error-icon">⚠️</span>
                  {errors.twoFactor}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {useBackupCode ? 'Backup Code' : 'Verification Code'}
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, useBackupCode ? 8 : 6))}
                  placeholder={useBackupCode ? 'Enter backup code' : '000000'}
                  className="form-input"
                  style={{textAlign: 'center', fontSize: '18px', letterSpacing: '4px', fontFamily: 'monospace'}}
                  maxLength={useBackupCode ? 8 : 6}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div style={{textAlign: 'center', marginBottom: '16px'}}>
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                    setErrors({});
                  }}
                  style={{color: '#2563eb', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px'}}
                >
                  {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !twoFactorCode}
                className="auth-button primary"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <div style={{textAlign: 'center', marginTop: '16px'}}>
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode('');
                    setUseBackupCode(false);
                    setErrors({});
                  }}
                  style={{color: '#6b7280', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px'}}
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}


          <div className="auth-footer">
            <p className="auth-link-text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="demo-accounts">
            <p className="demo-title">Demo Accounts:</p>
            <div className="demo-buttons">
              <button
                onClick={() => setFormData({
                  ...formData,
                  email: 'onzy@gmail.com',
                  password: 'onzy123'
                })}
                className="demo-button admin"
              >
                Admin Demo
              </button>
              <button
                onClick={() => setFormData({
                  ...formData,
                  email: 'normaluser@gmail.com', 
                  password: 'user123'
                })}
                className="demo-button user"
              >
                User Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;