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

      // Store token
      localStorage.setItem('finguard-token', data.token);
      
      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem('finguard-remember', 'true');
      }

      const decoded = jwtDecode(data.token);
      const role = decoded.role;

      // Navigate based on role
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
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your FinGuard account</p>
          </div>

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