import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report error to monitoring service (if available)
    if (window.errorReporting) {
      window.errorReporting.captureException(error, {
        context: 'ErrorBoundary',
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportBug = () => {
    const errorReport = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy error report to clipboard for user to send
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error report copied to clipboard. Please send this to support.');
  };

  render() {
    if (this.state.hasError) {
      const { componentName = 'Component', fallback } = this.props;
      
      // Use custom fallback if provided
      if (fallback) {
        return fallback(this.state.error, this.handleRetry);
      }

      return (
        <ErrorBoundaryUI
          error={this.state.error}
          componentName={componentName}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onReportBug={this.handleReportBug}
        />
      );
    }

    return this.props.children;
  }
}

// Separate UI component that can use hooks
const ErrorBoundaryUI = ({ error, componentName, retryCount, onRetry, onGoHome, onReportBug }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-64 flex items-center justify-center p-8 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-xl shadow-sm border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="text-center max-w-md">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Something went wrong in {componentName}
          </h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Don't worry, this is just a temporary issue. You can try reloading this component or go back to the dashboard.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={retryCount >= 3}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryCount >= 3 ? 'Max retries reached' : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
          </button>

          <button
            onClick={onGoHome}
            className={`w-full flex items-center justify-center px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </button>

          <button
            onClick={onReportBug}
            className={`w-full flex items-center justify-center px-4 py-2 text-sm transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bug className="w-4 h-4 mr-2" />
            Report Issue
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className={`mt-6 text-left ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Debug Information (Development Only)
            </summary>
            <pre className={`text-xs p-3 rounded overflow-auto max-h-32 ${
              isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;