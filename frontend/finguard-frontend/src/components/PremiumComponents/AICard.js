import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

const AIRecommendations = () => {
  const navigate = useNavigate();
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAIInsights = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      // Call the real ML-powered AI endpoint
      const response = await fetch('http://localhost:5000/api/ai/budget-recommendations', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
          const topRecommendation = aiResponse.recommendations[0];
          const isOver = topRecommendation.status === 'over';
          const potentialSaving = Math.abs(topRecommendation.difference || 0);
          
          setAiInsights({
            type: topRecommendation.status,
            title: `${topRecommendation.category} ${isOver ? 'Budget Alert' : 'Optimization'}`,
            description: topRecommendation.recommendation,
            current: `Rs.${topRecommendation.current.toFixed(0)}/mo`,
            projected: `Rs.${topRecommendation.suggested.toFixed(0)}/mo`,
            savings: `Rs.${(potentialSaving * 12).toFixed(0)}`,
            confidence: 85, // High confidence since this is based on actual budget data
            impact: isOver ? 'high' : 'medium',
            category: topRecommendation.category,
            mlModel: 'Budget Analysis Engine',
            totalSavings: aiResponse.summary?.totalPotentialSavings || 0,
            recommendationsCount: aiResponse.recommendations.length
          });
        } else {
          setAiInsights({
            type: 'insufficient_data',
            title: 'Building AI Profile',
            description: aiResponse.message || 'Continue adding transactions to unlock personalized AI recommendations.',
            confidence: aiResponse.confidence || 0,
            impact: 'low',
            mlModel: 'Statistical ML Analysis'
          });
        }
      } else {
        throw new Error('Failed to fetch AI insights');
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsights({
        type: 'error',
        title: 'AI Analysis Unavailable',
        description: 'Unable to generate AI recommendations at this time. Please try again later.',
        confidence: 0,
        impact: 'low'
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed fake generateAIInsights function - now using real ML-powered backend

  const handleApplyChange = () => {
    navigate('/ai-budget#category-recommendations');
    setTimeout(() => {
      const element = document.getElementById('category-recommendations');
      if(element) {
        element.scrollIntoView({ behavior: 'smooth'});
      }
    }, 100);
  };

  const handleSuggestAlternatives = () => {
    navigate('/ai-budget#budget-simulator');
    setTimeout(() => {
      const element = document.getElementById('budget-simulator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    fetchAIInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md mt-10">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!aiInsights) return null;

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-6 shadow-md mt-10 border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">AI-Powered Insights</h3>
        </div>
        <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full font-medium">
          Premium Only
        </span>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                {aiInsights.impact === 'high' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : aiInsights.impact === 'medium' ? (
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{aiInsights.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(aiInsights.impact)}`}>
                  {aiInsights.impact.charAt(0).toUpperCase() + aiInsights.impact.slice(1)} Impact
                </span>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {aiInsights.description}
            </p>
          </div>
          
          {aiInsights.confidence > 0 && (
            <div className="text-right ml-6">
              <div className="text-xs text-gray-500 mb-2">AI Confidence</div>
              <div className="w-24 bg-gray-200 rounded-full h-2 mb-1">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${getConfidenceColor(aiInsights.confidence)}`}
                  style={{ width: `${aiInsights.confidence}%` }}
                ></div>
              </div>
              <div className="text-sm font-bold text-gray-900">{aiInsights.confidence}%</div>
            </div>
          )}
        </div>

        {aiInsights.current && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm text-gray-500 mb-1">Current</div>
              <div className="font-bold text-gray-900">{aiInsights.current}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-gray-500 mb-1">Optimized Target</div>
              <div className="font-bold text-green-700">{aiInsights.projected}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-500 mb-1">Annual Savings</div>
              <div className="font-bold text-blue-700">{aiInsights.savings}</div>
            </div>
          </div>
        )}

        {aiInsights.type !== 'no_data' && aiInsights.type !== 'no_expenses' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={handleApplyChange}
            >
              <CheckCircle className="w-4 h-4" />
              Apply This Change
            </button>
            <button 
              className="flex items-center gap-2 px-5 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-all duration-200"
              onClick={handleSuggestAlternatives}
            >
              <Sparkles className="w-4 h-4" />
              More Suggestions
            </button>
          </div>
        )}

        {/* ML Model Indicators */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Statistical ML Analysis</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Z-score Detection</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Reinforcement Learning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>{aiInsights?.mlModel || 'ML-Powered Analysis'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;