import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import loginBg from '../assets/loginbg.jpg';
import finguardLogo from '../assets/finguard.jpg';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    dob: '',
    phone: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();

  // FIXED Password strength calculation
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
      case 'username':
        if (!value) {
          newErrors.username = 'Username is required';
        } else if (value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'Username can only contain letters, numbers, and underscores';
        } else {
          delete newErrors.username;
        }
        break;

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
        setPasswordStrength(calculatePasswordStrength(value));
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      case 'full_name':
        if (!value) {
          newErrors.full_name = 'Full name is required';
        } else if (value.length < 2) {
          newErrors.full_name = 'Full name must be at least 2 characters';
        } else {
          delete newErrors.full_name;
        }
        break;

      case 'dob':
        if (!value) {
          newErrors.dob = 'Date of birth is required';
        } else {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 13) {
            newErrors.dob = 'You must be at least 13 years old';
          } else {
            delete newErrors.dob;
          }
        }
        break;

      case 'phone':
        if (value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        } else {
          delete newErrors.phone;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      console.error('Username check failed:', err);
      setUsernameAvailable(true); // Default to true if check fails
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setEmailAvailable(data.available);
    } catch (err) {
      console.error('Email check failed:', err);
      setEmailAvailable(true); // Default to true if check fails
    }
  };

  // Debounced availability checks
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue = type === 'checkbox' ? checked : value;
    
    // Format phone number
    if (name === 'phone') {
      fieldValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Real-time validation
    if (name !== 'acceptTerms') {
      validateField(name, fieldValue);
    }
  };

  // FIXED: Simplified next step validation
  const nextStep = () => {
    const step1Fields = ['username', 'email', 'password', 'confirmPassword'];
    
    // Check basic validation
    step1Fields.forEach(field => {
      validateField(field, formData[field]);
    });

    // Simple check: all fields filled, no errors, passwords match
    const canProceed = (
      formData.username.length >= 3 &&
      formData.email.includes('@') &&
      formData.password.length >= 6 &&
      formData.confirmPassword === formData.password &&
      !errors.username &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );

    if (canProceed) {
      setCurrentStep(2);
    } else {
      console.log('Validation failed');
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      if (field !== 'acceptTerms' && field !== 'phone') {
        validateField(field, formData[field]);
      }
    });

    if (!formData.acceptTerms) {
      setErrors(prev => ({ ...prev, acceptTerms: 'You must accept the terms and conditions' }));
      return;
    }

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          dob: formData.dob,
          phone: formData.phone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token for immediate login
      localStorage.setItem('finguard-token', data.token);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Password strength text and colors
  const getPasswordStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return texts[passwordStrength] || 'Very Weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#44cc00', '#00aa00'];
    return colors[passwordStrength] || '#ff4444';
  };

  return (
    <div 
      className="auth-page"
      style={{
        backgroundImage: `url(${loginBg})`
      }}
    >
      <div className="auth-overlay">
        <div className="auth-container register">
          <div className="auth-header">
            <img src={finguardLogo} alt="FinGuard Logo" className="auth-logo" />
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join FinGuard and take control of your finances</p>
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Account</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Personal</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}

            {currentStep === 1 && (
              <div className="form-step">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div className="input-wrapper">
                    <UserIcon className="input-icon" />
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`form-input ${errors.username ? 'error' : ''}`}
                    />
                    {formData.username && (
                      <div className="availability-indicator">
                        {usernameAvailable === true && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                        {usernameAvailable === false && <XCircleIcon className="w-5 h-5 text-red-500" />}
                      </div>
                    )}
                  </div>
                  {errors.username && <span className="error-text">{errors.username}</span>}
                  {usernameAvailable === false && <span className="error-text">Username is already taken</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <EnvelopeIcon className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                    />
                    {formData.email && (
                      <div className="availability-indicator">
                        {emailAvailable === true && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                        {emailAvailable === false && <XCircleIcon className="w-5 h-5 text-red-500" />}
                      </div>
                    )}
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                  {emailAvailable === false && <span className="error-text">Email is already registered</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <LockClosedIcon className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input ${errors.password ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
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
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <LockClosedIcon className="input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                {/* FIXED: Simplified Next Step Button */}
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    !formData.username || 
                    !formData.email || 
                    !formData.password || 
                    !formData.confirmPassword ||
                    formData.username.length < 3 ||
                    !formData.email.includes('@') ||
                    formData.password.length < 6 ||
                    formData.password !== formData.confirmPassword ||
                    errors.username ||
                    errors.email ||
                    errors.password ||
                    errors.confirmPassword
                  }
                  className="auth-button primary"
                >
                  Next Step
                </button>

                {/* Debug info - shows actual validation state */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '12px', marginTop: '10px', padding: '10px', background: '#f0f0f0' }}>
                    <strong>Debug:</strong><br/>
                    Username: {formData.username} (length: {formData.username.length})<br/>
                    Email: {formData.email} (valid: {formData.email.includes('@') ? 'Yes' : 'No'})<br/>
                    Password: {formData.password.length} chars (strength: {passwordStrength}/6)<br/>
                    Password Match: {formData.password === formData.confirmPassword ? 'Yes' : 'No'}<br/>
                    Errors: {Object.keys(errors).length}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <UserIcon className="input-icon" />
                    <input
                      type="text"
                      name="full_name"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={`form-input ${errors.full_name ? 'error' : ''}`}
                    />
                  </div>
                  {errors.full_name && <span className="error-text">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <div className="input-wrapper">
                    <CalendarIcon className="input-icon" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className={`form-input ${errors.dob ? 'error' : ''}`}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                    />
                  </div>
                  {errors.dob && <span className="error-text">{errors.dob}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Optional)</label>
                  <div className="input-wrapper">
                    <PhoneIcon className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                    />
                  </div>
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">
                      I agree to the{' '}
                      <Link to="/terms" className="terms-link">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                    </span>
                  </label>
                  {errors.acceptTerms && <span className="error-text">{errors.acceptTerms}</span>}
                </div>

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="auth-button secondary"
                  >
                    Previous
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || !formData.acceptTerms || Object.keys(errors).length > 0}
                    className="auth-button primary"
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="auth-footer">
            <p className="auth-link-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;