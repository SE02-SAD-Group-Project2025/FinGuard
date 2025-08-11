// Comprehensive form validation utilities with accessibility support
export const ValidationRules = {
  // Email validation
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
    ariaLabel: 'Email address is required and must be in proper format like user@example.com'
  },

  // Password validation
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    ariaLabel: 'Password must contain at least 8 characters including uppercase letter, lowercase letter, number, and special character'
  },

  // Confirm password validation
  confirmPassword: {
    required: true,
    match: 'password',
    message: 'Passwords must match',
    ariaLabel: 'Please confirm your password by typing it again'
  },

  // Amount validation (for financial inputs)
  amount: {
    required: true,
    min: 0.01,
    max: 1000000,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Please enter a valid amount between 0.01 and 1,000,000',
    ariaLabel: 'Amount must be a positive number with up to 2 decimal places'
  },

  // Category validation
  category: {
    required: true,
    message: 'Please select a category',
    ariaLabel: 'Category selection is required'
  },

  // Date validation
  date: {
    required: true,
    message: 'Please select a date',
    ariaLabel: 'Date is required and must be in valid format'
  },

  // Description validation
  description: {
    maxLength: 500,
    message: 'Description must be less than 500 characters',
    ariaLabel: 'Optional description, maximum 500 characters'
  },

  // Name validation
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must be 2-50 characters and contain only letters and spaces',
    ariaLabel: 'Full name is required, 2-50 characters, letters and spaces only'
  },

  // Phone validation
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    minLength: 10,
    maxLength: 15,
    message: 'Please enter a valid phone number',
    ariaLabel: 'Phone number with country code, 10-15 digits including spaces and dashes'
  },

  // Required field
  required: {
    required: true,
    message: 'This field is required',
    ariaLabel: 'This field is required'
  }
};

// Field validation function
export const validateField = (value, rules, formData = {}) => {
  const errors = [];
  
  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(rules.message || 'This field is required');
    return { isValid: false, errors, ariaLabel: rules.ariaLabel };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return { isValid: true, errors: [], ariaLabel: rules.ariaLabel };
  }

  const stringValue = value.toString().trim();

  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`Must be less than ${rules.maxLength} characters`);
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(rules.message || 'Invalid format');
  }

  // Numeric validations
  if (rules.min !== undefined || rules.max !== undefined) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push('Must be a valid number');
    } else {
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`Must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`Must be no more than ${rules.max}`);
      }
    }
  }

  // Match validation (for confirm password)
  if (rules.match && formData[rules.match] && stringValue !== formData[rules.match]) {
    errors.push(rules.message || 'Values must match');
  }

  return {
    isValid: errors.length === 0,
    errors,
    ariaLabel: rules.ariaLabel
  };
};

// Form validation function
export const validateForm = (formData, validationRules) => {
  const fieldErrors = {};
  let isFormValid = true;
  const ariaLabels = {};

  Object.keys(validationRules).forEach(fieldName => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];
    
    const validation = validateField(value, rules, formData);
    
    if (!validation.isValid) {
      fieldErrors[fieldName] = validation.errors;
      isFormValid = false;
    }

    if (validation.ariaLabel) {
      ariaLabels[fieldName] = validation.ariaLabel;
    }
  });

  return {
    isValid: isFormValid,
    errors: fieldErrors,
    ariaLabels
  };
};

// Real-time validation hook
import { useState, useCallback } from 'react';

export const useFormValidation = (initialData, validationRules) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate single field
  const validateFieldReal = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return { isValid: true, errors: [] };

    return validateField(value, rules, { ...formData, [fieldName]: value });
  }, [formData, validationRules]);

  // Update field value with validation
  const updateField = useCallback((fieldName, value) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);

    // Validate if field has been touched
    if (touched[fieldName]) {
      const validation = validateFieldReal(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: validation.isValid ? undefined : validation.errors
      }));
    }
  }, [formData, touched, validateFieldReal]);

  // Mark field as touched
  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate when touched
    const validation = validateFieldReal(fieldName, formData[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? undefined : validation.errors
    }));
  }, [formData, validateFieldReal]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const validation = validateForm(formData, validationRules);
    setErrors(validation.errors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    return validation;
  }, [formData, validationRules]);

  // Submit handler
  const handleSubmit = useCallback(async (submitFn) => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      // Focus on first error field for accessibility
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.focus();
        // Announce error to screen readers
        element.setAttribute('aria-describedby', `${firstErrorField}-error`);
      }
      return { success: false, errors: validation.errors };
    }

    setIsSubmitting(true);
    try {
      const result = await submitFn(formData);
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  // Get field props for easy integration
  const getFieldProps = useCallback((fieldName) => {
    const rules = validationRules[fieldName];
    const hasError = errors[fieldName] && touched[fieldName];
    
    return {
      name: fieldName,
      value: formData[fieldName] || '',
      onChange: (e) => updateField(fieldName, e.target.value),
      onBlur: () => touchField(fieldName),
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': hasError ? `${fieldName}-error` : undefined,
      'aria-label': rules?.ariaLabel,
      required: rules?.required || false,
      className: hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 
                 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    };
  }, [formData, errors, touched, validationRules, updateField, touchField]);

  // Get error message props
  const getErrorProps = useCallback((fieldName) => {
    const hasError = errors[fieldName] && touched[fieldName];
    
    if (!hasError) return null;

    return {
      id: `${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite',
      className: 'text-red-600 text-sm mt-1'
    };
  }, [errors, touched]);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    updateField,
    touchField,
    validateForm,
    handleSubmit,
    resetForm,
    getFieldProps,
    getErrorProps,
    isValid: Object.keys(errors).length === 0
  };
};

// Accessibility helpers
export const announceError = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Error: ${message}`;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const announceSuccess = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Success: ${message}`;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export default {
  ValidationRules,
  validateField,
  validateForm,
  useFormValidation,
  announceError,
  announceSuccess
};