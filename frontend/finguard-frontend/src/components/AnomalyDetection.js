import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, TrendingDown, Eye, Brain, Activity, Zap, Clock, DollarSign, MapPin, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AnomalyDetection = () => {
  const { isDarkMode } = useTheme();
  const [anomalies, setAnomalies] = useState([]);
  const [settings, setSettings] = useState({
    sensitivity: 'medium',
    enableAlerts: true,
    alertThreshold: 'medium',
    categories: ['all']
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadAnomaliesData();
  }, [settings, activeFilter]);

  // Load anomalies from API
  const loadAnomaliesData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.log('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/ai/advanced-anomalies?sensitivity=${settings.sensitivity}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const anomaliesData = await response.json();
        // Extract anomalies array from the API response structure
        const anomaliesList = anomaliesData.anomalies || [];
        setAnomalies(anomaliesList);
      } else {
        console.error('Failed to load anomalies');
        setAnomalies([]);
      }
    } catch (error) {
      console.error('Error loading anomalies:', error);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger anomaly detection
  const runAnomalyDetection = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      // Just reload the anomalies data instead of trying to run detection
      // (the AI service runs detection automatically when data is requested)
      await loadAnomaliesData();
      console.log('Anomaly detection refreshed');
    } catch (error) {
      console.error('Error running anomaly detection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update anomaly status
  const updateAnomalyStatus = async (anomalyId, newStatus) => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/anomalies/${anomalyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setAnomalies(prev => prev.map(anomaly => 
          anomaly.id === anomalyId ? { ...anomaly, status: newStatus } : anomaly
        ));
      } else {
        console.error('Failed to update anomaly status');
      }
    } catch (error) {
      console.error('Error updating anomaly status:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return AlertTriangle;
      case 'medium': return Eye;
      case 'low': return Activity;
      default: return Shield;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'spending_spike': return TrendingUp;
      case 'unusual_location': return MapPin;
      case 'time_anomaly': return Clock;
      case 'frequency_anomaly': return Zap;
      case 'category_shift': return Activity;
      default: return AlertTriangle;
    }
  };

  const handleAnomalyAction = async (anomalyId, action) => {
    await updateAnomalyStatus(anomalyId, action);
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const filteredAnomalies = activeFilter === 'all' 
    ? anomalies 
    : anomalies.filter(anomaly => anomaly.severity === activeFilter || anomaly.status === activeFilter);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Anomaly Detection
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-powered unusual spending pattern detection
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={settings.sensitivity}
            onChange={(e) => updateSettings({ sensitivity: e.target.value })}
            className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="low">Low Sensitivity</option>
            <option value="medium">Medium Sensitivity</option>
            <option value="high">High Sensitivity</option>
          </select>
          
          <button
            onClick={runAnomalyDetection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Analyzing...' : 'Run Detection'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Anomalies</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {anomalies.length}
              </p>
            </div>
            <Shield className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>High Risk</p>
              <p className="text-2xl font-bold text-red-600">
                {anomalies.filter(a => a.severity === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unreviewed</p>
              <p className="text-2xl font-bold text-yellow-600">
                {anomalies.filter(a => a.status === 'unreviewed').length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Confidence</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {anomalies.length > 0 
                  ? Math.round(anomalies.reduce((sum, a) => sum + (a.confidence || 0), 0) / anomalies.length)
                  : 0
                }%
              </p>
            </div>
            <Brain className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All', count: anomalies.length },
          { id: 'high', label: 'High Risk', count: anomalies.filter(a => a.severity === 'high').length },
          { id: 'medium', label: 'Medium Risk', count: anomalies.filter(a => a.severity === 'medium').length },
          { id: 'unreviewed', label: 'Unreviewed', count: anomalies.filter(a => a.status === 'unreviewed').length }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === filter.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {filter.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              activeFilter === filter.id
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        {filteredAnomalies.map((anomaly, index) => {
          const SeverityIcon = getSeverityIcon(anomaly.severity || 'unknown');
          const TypeIcon = getTypeIcon(anomaly.type || 'unknown');
          
          return (
            <div key={anomaly.id || index} className={`p-5 rounded-lg border ${getSeverityBg(anomaly.severity || 'unknown')}`}>
              {/* Anomaly Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-4 ${
                    anomaly.severity === 'high' ? 'bg-red-100 dark:bg-red-900/40' :
                    anomaly.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                    'bg-blue-100 dark:bg-blue-900/40'
                  }`}>
                    <TypeIcon className={`w-5 h-5 ${getSeverityColor(anomaly.severity || 'unknown')}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {anomaly.title || `Unusual ${anomaly.category || 'Transaction'} Pattern`}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {anomaly.description || `Detected unusual spending pattern of Rs.${(anomaly.amount || 0).toLocaleString()} - ${anomaly.confidence || 83}% confidence based on your historical data`}
                    </p>
                    <div className="flex items-center mt-2 space-x-4 text-xs">
                      <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {anomaly.date || 'Unknown date'} at {anomaly.time || 'Unknown time'}
                      </span>
                      <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {anomaly.location || 'Unknown location'}
                      </span>
                      <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Brain className="w-3 h-3 mr-1" />
                        {(anomaly.confidence || 0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <SeverityIcon className={`w-4 h-4 ${getSeverityColor(anomaly.severity || 'unknown')}`} />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      anomaly.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                      anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {anomaly.severity || 'unknown'} risk
                    </span>
                  </div>
                  <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rs. {(anomaly.amount || 0).toLocaleString()}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    vs Rs. {(anomaly.normalAmount || 0).toLocaleString()} normal
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Related Transactions:
                </h4>
                <div className="space-y-1">
                  {(anomaly.details?.relatedTransactions || []).map((transaction, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {transaction.description}
                      </span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
                        Rs. {(transaction.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  AI Recommendations:
                </h4>
                <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {(anomaly.recommendations || []).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-current rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              {anomaly.status === 'unreviewed' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAnomalyAction(anomaly.id, 'acknowledged')}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Legitimate
                  </button>
                  <button
                    onClick={() => handleAnomalyAction(anomaly.id, 'flagged')}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Flag as Suspicious
                  </button>
                  <button
                    onClick={() => handleAnomalyAction(anomaly.id, 'dismissed')}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {anomaly.status !== 'unreviewed' && (
                <div className={`text-xs px-3 py-2 rounded-lg ${
                  anomaly.status === 'acknowledged' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                  anomaly.status === 'flagged' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  Status: {(anomaly.status || 'unknown').charAt(0).toUpperCase() + (anomaly.status || 'unknown').slice(1)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAnomalies.length === 0 && (
        <div className="text-center py-12">
          <Shield className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Anomalies Found
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {activeFilter === 'all' 
              ? 'Your spending patterns look normal. We\'ll keep monitoring for any unusual activity.'
              : `No ${activeFilter} anomalies found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AnomalyDetection;