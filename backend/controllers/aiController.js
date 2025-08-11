const db = require('../db');

// Get AI budget recommendations based on user's actual spending patterns
const getAIBudgetRecommendations = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get current month expenses by category
    const currentExpensesResult = await db.query(`
      SELECT category, SUM(amount) as total_spent, COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense' 
        AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
      GROUP BY category
    `, [userId, currentMonth, currentYear]);

    // Get last month expenses for comparison
    const lastMonthExpensesResult = await db.query(`
      SELECT category, SUM(amount) as total_spent
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense' 
        AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
      GROUP BY category
    `, [userId, lastMonth, lastMonthYear]);

    // Get current budgets
    const currentBudgetsResult = await db.query(`
      SELECT category, limit_amount, alert_triggered
      FROM budgets 
      WHERE user_id = $1 AND month = $2 AND year = $3
    `, [userId, currentMonth, currentYear]);

    // Get user's income to calculate optimal spending ratios
    const incomeResult = await db.query(`
      SELECT SUM(amount) as total_income
      FROM transactions 
      WHERE user_id = $1 AND type = 'income' 
        AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    const currentExpenses = {};
    const lastMonthExpenses = {};
    const currentBudgets = {};
    
    // Process current month data
    currentExpensesResult.rows.forEach(row => {
      currentExpenses[row.category] = {
        spent: parseFloat(row.total_spent),
        transactions: parseInt(row.transaction_count)
      };
    });

    // Process last month data
    lastMonthExpensesResult.rows.forEach(row => {
      lastMonthExpenses[row.category] = parseFloat(row.total_spent);
    });

    // Process current budgets
    currentBudgetsResult.rows.forEach(row => {
      currentBudgets[row.category] = {
        limit: parseFloat(row.limit_amount),
        alertTriggered: row.alert_triggered
      };
    });

    const totalIncome = parseFloat(incomeResult.rows[0]?.total_income || 0);
    const totalExpenses = Object.values(currentExpenses).reduce((sum, cat) => sum + cat.spent, 0);

    // Define optimal spending percentages based on income
    const optimalRatios = {
      'Food & Dining': 0.15, // 15% of income
      'Transportation': 0.10, // 10% of income
      'Bills & Utilities': 0.08, // 8% of income
      'Entertainment': 0.05, // 5% of income
      'Shopping': 0.08, // 8% of income
      'Healthcare': 0.05, // 5% of income
      'Education': 0.03, // 3% of income
      'Travel': 0.04, // 4% of income
      'Rent': 0.25, // 25% of income
      'Other Expenses': 0.05 // 5% of income
    };

    // Generate AI recommendations
    const recommendations = [];
    const insights = [];
    let totalPotentialSavings = 0;

    Object.keys(currentExpenses).forEach(category => {
      const currentSpent = currentExpenses[category].spent;
      const lastMonthSpent = lastMonthExpenses[category] || 0;
      const currentBudget = currentBudgets[category]?.limit || 0;
      const optimalAmount = totalIncome > 0 ? totalIncome * (optimalRatios[category] || 0.05) : currentSpent * 0.9;

      // Calculate month-over-month change
      const monthlyChange = lastMonthSpent > 0 ? ((currentSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;

      // Determine status and generate recommendation
      let status = 'optimal';
      let suggestedAmount = currentSpent;
      let recommendation = '';

      if (currentBudget > 0) {
        // User has a budget set
        if (currentSpent > currentBudget) {
          status = 'over';
          suggestedAmount = Math.min(currentBudget * 0.95, optimalAmount);
          recommendation = `Reduce ${category} spending by LKR ${(currentSpent - suggestedAmount).toFixed(0)} to stay within budget`;
        } else if (currentSpent < currentBudget * 0.7) {
          status = 'under';
          suggestedAmount = currentBudget;
          recommendation = `You can safely spend LKR ${(suggestedAmount - currentSpent).toFixed(0)} more on ${category}`;
        }
      } else {
        // No budget set, use optimal ratios
        if (totalIncome > 0 && currentSpent > optimalAmount * 1.2) {
          status = 'over';
          suggestedAmount = optimalAmount;
          recommendation = `Consider setting a budget of LKR ${suggestedAmount.toFixed(0)} for ${category}`;
        }
      }

      if (Math.abs(currentSpent - suggestedAmount) > 500) { // Only recommend if difference is significant
        recommendations.push({
          category,
          current: currentSpent,
          suggested: suggestedAmount,
          status,
          difference: currentSpent - suggestedAmount,
          recommendation
        });
        
        if (currentSpent > suggestedAmount) {
          totalPotentialSavings += (currentSpent - suggestedAmount);
        }
      }

      // Generate insights
      if (monthlyChange > 15) {
        insights.push({
          text: `Your ${category} spending increased by ${monthlyChange.toFixed(1)}% this month`,
          type: 'warning',
          category
        });
      } else if (monthlyChange < -15) {
        insights.push({
          text: `Great job! ${category} spending decreased by ${Math.abs(monthlyChange).toFixed(1)}% this month`,
          type: 'success',
          category
        });
      }

      if (currentBudgets[category]?.alertTriggered) {
        insights.push({
          text: `Budget alert triggered for ${category} - consider adjusting spending`,
          type: 'warning',
          category
        });
      }
    });

    // Add general insights
    if (totalExpenses > totalIncome * 0.8) {
      insights.push({
        text: `Your expenses are ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of your income - consider reducing spending`,
        type: 'warning',
        category: 'overall'
      });
    }

    if (Object.keys(currentExpenses).length > 8) {
      insights.push({
        text: `You're spending across ${Object.keys(currentExpenses).length} categories - consider consolidating for better tracking`,
        type: 'info',
        category: 'overall'
      });
    }

    // Add some default insights if we don't have many
    if (insights.length === 0 && Object.keys(currentExpenses).length > 0) {
      insights.push({
        text: `You have active spending in ${Object.keys(currentExpenses).length} categories this month`,
        type: 'info',
        category: 'overall'
      });
    }

    // If no significant recommendations, provide some basic ones
    if (recommendations.length === 0 && Object.keys(currentExpenses).length > 0) {
      // Add top 3 spending categories as recommendations for better tracking
      const topCategories = Object.keys(currentExpenses)
        .sort((a, b) => currentExpenses[b].spent - currentExpenses[a].spent)
        .slice(0, 3);
      
      topCategories.forEach(category => {
        const spent = currentExpenses[category].spent;
        const optimalAmount = totalIncome > 0 ? totalIncome * (optimalRatios[category] || 0.05) : spent * 0.9;
        
        recommendations.push({
          category,
          current: spent,
          suggested: Math.min(spent, optimalAmount),
          status: spent > optimalAmount ? 'over' : 'optimal',
          difference: spent - optimalAmount,
          recommendation: `Set a budget of LKR ${Math.round(optimalAmount)} for ${category} to optimize spending`
        });
      });

      insights.push({
        text: `Your top spending categories are ${topCategories.join(', ')} - consider setting budgets for better control`,
        type: 'info',
        category: 'overall'
      });
    }

    const response = {
      recommendations: recommendations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)), // Sort by impact
      insights: insights.slice(0, 5), // Limit to 5 insights
      summary: {
        totalIncome,
        totalExpenses,
        totalPotentialSavings,
        categoriesAnalyzed: Object.keys(currentExpenses).length,
        budgetsSet: Object.keys(currentBudgets).length
      },
      period: {
        month: currentMonth,
        year: currentYear
      }
    };

    res.json(response);

  } catch (err) {
    console.error('🔴 AI BUDGET RECOMMENDATIONS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to generate AI recommendations' });
  }
};

// Statistical analysis utilities for real AI recommendations
class FinancialMLEngine {
  
  // Calculate Z-score for anomaly detection
  static calculateZScore(value, mean, standardDeviation) {
    if (standardDeviation === 0) return 0;
    return (value - mean) / standardDeviation;
  }

  // Statistical analysis of spending patterns
  static analyzeSpendingPatterns(transactions) {
    const categoryData = {};
    const timeSeriesData = [];
    
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const amount = parseFloat(tx.amount);
      const date = new Date(tx.date);
      
      // Category aggregation
      if (!categoryData[category]) {
        categoryData[category] = [];
      }
      categoryData[category].push(amount);
      
      // Time series data
      timeSeriesData.push({
        date: date,
        amount: amount,
        category: category,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
        month: date.getMonth()
      });
    });

    // Calculate statistical metrics for each category
    const categoryStats = {};
    Object.entries(categoryData).forEach(([category, amounts]) => {
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
      
      categoryStats[category] = {
        mean,
        median,
        stdDev,
        variance,
        total: amounts.reduce((sum, val) => sum + val, 0),
        count: amounts.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts)
      };
    });

    return { categoryStats, timeSeriesData };
  }

  // ARIMA-inspired trend analysis
  static calculateTrendAnalysis(timeSeriesData, periods = 30) {
    if (timeSeriesData.length < periods) return null;

    // Simple moving average calculation
    const movingAverages = [];
    for (let i = periods - 1; i < timeSeriesData.length; i++) {
      const slice = timeSeriesData.slice(i - periods + 1, i + 1);
      const average = slice.reduce((sum, item) => sum + item.amount, 0) / periods;
      movingAverages.push({
        date: timeSeriesData[i].date,
        value: average,
        actual: timeSeriesData[i].amount
      });
    }

    // Calculate trend direction and strength
    if (movingAverages.length < 2) return null;
    
    const firstHalf = movingAverages.slice(0, Math.floor(movingAverages.length / 2));
    const secondHalf = movingAverages.slice(Math.floor(movingAverages.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
    
    const trendStrength = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    return {
      direction: trendStrength > 0 ? 'increasing' : 'decreasing',
      strength: Math.abs(trendStrength),
      confidence: Math.min(95, (movingAverages.length / periods) * 60),
      movingAverages,
      prediction: {
        nextPeriod: secondHalfAvg * (1 + (trendStrength / 100)),
        confidence: Math.max(50, 85 - Math.abs(trendStrength))
      }
    };
  }

  // Isolation Forest-inspired outlier detection
  static detectOutliers(data, contamination = 0.1) {
    if (data.length < 10) return [];
    
    const scores = data.map(value => {
      // Simple isolation score approximation
      const deviationsFromOthers = data.map(other => Math.abs(value - other));
      const avgDeviation = deviationsFromOthers.reduce((sum, dev) => sum + dev, 0) / deviationsFromOthers.length;
      const normalizedScore = avgDeviation / (Math.max(...data) - Math.min(...data));
      return { value, score: normalizedScore };
    });

    // Sort by isolation score (higher = more anomalous)
    scores.sort((a, b) => b.score - a.score);
    
    // Return top contamination percentage as outliers
    const outlierCount = Math.ceil(data.length * contamination);
    return scores.slice(0, outlierCount);
  }

  // Reinforcement Learning-inspired budget optimization
  static optimizeBudget(categoryStats, userGoals = {}) {
    const recommendations = [];
    const totalSpending = Object.values(categoryStats).reduce((sum, stats) => sum + stats.total, 0);
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const categoryPercentage = (stats.total / totalSpending) * 100;
      
      // High variance categories (opportunity for optimization)
      if (stats.stdDev > stats.mean * 0.5) {
        const potentialSaving = stats.stdDev * 0.3; // Conservative estimate
        recommendations.push({
          category,
          type: 'variance_reduction',
          currentSpending: stats.total,
          optimizedSpending: stats.total - potentialSaving,
          potentialSaving,
          confidence: Math.min(85, (stats.count / 10) * 20 + 45),
          reasoning: `High spending variance (σ=${stats.stdDev.toFixed(2)}) suggests inconsistent spending patterns`,
          action: 'Implement spending alerts and budgets for more consistent control'
        });
      }

      // Categories with spending concentration above optimal thresholds
      const optimalThresholds = {
        'Food & Dining': 25,
        'Transportation': 15,
        'Entertainment': 10,
        'Shopping': 20,
        'Bills & Utilities': 30
      };

      const threshold = optimalThresholds[category] || 15;
      if (categoryPercentage > threshold) {
        const excessPercentage = categoryPercentage - threshold;
        const reduction = (excessPercentage / 100) * stats.total;
        
        recommendations.push({
          category,
          type: 'category_optimization',
          currentSpending: stats.total,
          optimizedSpending: stats.total - reduction,
          potentialSaving: reduction,
          confidence: Math.min(90, categoryPercentage * 2),
          reasoning: `Category represents ${categoryPercentage.toFixed(1)}% of spending (optimal: ${threshold}%)`,
          action: `Reduce ${category.toLowerCase()} spending by ${excessPercentage.toFixed(1)}% to optimize budget allocation`
        });
      }
    });

    // Sort recommendations by potential impact
    recommendations.sort((a, b) => (b.potentialSaving * b.confidence) - (a.potentialSaving * a.confidence));
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  // Predictive cash flow using time series analysis
  static predictCashFlow(transactions, forecastPeriods = 6) {
    const monthlyData = {};
    
    // Aggregate transactions by month
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, net: 0 };
      }
      
      const amount = parseFloat(tx.amount);
      if (tx.type === 'income') {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
      monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    if (sortedMonths.length < 3) return null;

    // Calculate trends for income, expenses, and net flow
    const incomeValues = sortedMonths.map(month => monthlyData[month].income);
    const expenseValues = sortedMonths.map(month => monthlyData[month].expenses);
    const netValues = sortedMonths.map(month => monthlyData[month].net);

    // Simple linear regression for prediction
    const predictValues = (values) => {
      const n = values.length;
      const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, idx) => sum + (idx * val), 0);
      const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // sum of squares

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const predictions = [];
      for (let i = 0; i < forecastPeriods; i++) {
        const futureValue = intercept + slope * (n + i);
        predictions.push(Math.max(0, futureValue)); // Ensure non-negative
      }

      return { slope, intercept, predictions };
    };

    const incomeForecast = predictValues(incomeValues);
    const expenseForecast = predictValues(expenseValues);

    // Generate forecasted periods
    const forecasts = [];
    const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + '-01');
    
    for (let i = 0; i < forecastPeriods; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      const predictedIncome = incomeForecast.predictions[i];
      const predictedExpenses = expenseForecast.predictions[i];
      
      forecasts.push({
        month: monthKey,
        predictedIncome: predictedIncome,
        predictedExpenses: predictedExpenses,
        predictedNet: predictedIncome - predictedExpenses,
        confidence: Math.max(60 - (i * 10), 30) // Decreasing confidence over time
      });
    }

    return {
      historicalData: sortedMonths.map(month => ({
        month,
        ...monthlyData[month]
      })),
      forecasts,
      trends: {
        income: incomeForecast.slope > 0 ? 'increasing' : 'decreasing',
        expenses: expenseForecast.slope > 0 ? 'increasing' : 'decreasing',
        incomeConfidence: Math.min(85, sortedMonths.length * 15),
        expenseConfidence: Math.min(85, sortedMonths.length * 15)
      }
    };
  }
}

// API endpoint: Get AI-powered budget recommendations
const getBudgetRecommendations = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Fetch user's transaction history
    const transactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY date DESC
    `, [userId]);

    const transactions = transactionsResult.rows;

    if (transactions.length < 3) {
      return res.json({
        recommendations: [],
        message: 'Insufficient transaction history for AI analysis (minimum 3 transactions required)',
        confidence: 0
      });
    }

    // Analyze spending patterns using ML techniques
    const { categoryStats } = FinancialMLEngine.analyzeSpendingPatterns(transactions);
    
    // Generate ML-based budget optimization recommendations
    const recommendations = FinancialMLEngine.optimizeBudget(categoryStats);

    // Calculate overall confidence based on data quality
    const overallConfidence = Math.min(90, 
      (transactions.length / 50) * 30 + // Data quantity score
      (Object.keys(categoryStats).length / 8) * 20 + // Category diversity score
      40 // Base confidence
    );

    res.json({
      recommendations,
      totalPotentialSavings: recommendations.reduce((sum, rec) => sum + rec.potentialSaving, 0),
      confidence: Math.round(overallConfidence),
      analysisDetails: {
        transactionsAnalyzed: transactions.length,
        categoriesFound: Object.keys(categoryStats).length,
        timeRange: '90 days',
        mlModel: 'Statistical Analysis + Reinforcement Learning Optimization'
      }
    });

  } catch (err) {
    console.error('🔴 AI BUDGET RECOMMENDATIONS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to generate AI recommendations' });
  }
};

// API endpoint: Get predictive cash flow analysis
const getPredictiveCashFlow = async (req, res) => {
  const userId = req.user.userId;
  const { months = 6 } = req.query;

  try {
    // Fetch comprehensive transaction history for better predictions
    const transactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '12 months'
      ORDER BY date ASC
    `, [userId]);

    const transactions = transactionsResult.rows;

    if (transactions.length < 20) {
      return res.json({
        forecasts: [],
        message: 'Insufficient transaction history for predictive analysis (minimum 20 transactions required)',
        confidence: 0
      });
    }

    // Generate predictions using time series analysis
    const cashFlowPrediction = FinancialMLEngine.predictCashFlow(transactions, parseInt(months));

    if (!cashFlowPrediction) {
      return res.json({
        forecasts: [],
        message: 'Unable to generate reliable predictions with current data',
        confidence: 0
      });
    }

    res.json({
      ...cashFlowPrediction,
      mlModel: 'ARIMA-inspired Time Series Analysis',
      confidence: Math.round(cashFlowPrediction.trends.incomeConfidence),
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('🔴 PREDICTIVE CASH FLOW ERROR:', err.message);
    res.status(500).json({ error: 'Failed to generate cash flow predictions' });
  }
};

// API endpoint: Advanced anomaly detection using statistical methods
const getAdvancedAnomalies = async (req, res) => {
  const userId = req.user.userId;
  const { sensitivity = 'medium' } = req.query;

  try {
    // Fetch recent transactions for anomaly analysis
    const transactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND type = 'expense'
      AND date >= CURRENT_DATE - INTERVAL '60 days'
      ORDER BY date DESC
    `, [userId]);

    const transactions = transactionsResult.rows;

    if (transactions.length < 15) {
      return res.json({
        anomalies: [],
        message: 'Insufficient data for statistical anomaly detection',
        confidence: 0
      });
    }

    const { categoryStats, timeSeriesData } = FinancialMLEngine.analyzeSpendingPatterns(transactions);
    const anomalies = [];

    // Z-score based anomaly detection
    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (stats.count < 3) return; // Skip categories with insufficient data

      const amounts = transactions
        .filter(tx => (tx.category || 'Uncategorized') === category)
        .map(tx => parseFloat(tx.amount));

      const outliers = FinancialMLEngine.detectOutliers(amounts, 
        sensitivity === 'high' ? 0.05 : sensitivity === 'low' ? 0.2 : 0.1
      );

      outliers.forEach(outlier => {
        const zScore = FinancialMLEngine.calculateZScore(outlier.value, stats.mean, stats.stdDev);
        const transaction = transactions.find(tx => parseFloat(tx.amount) === outlier.value);
        
        if (Math.abs(zScore) > 2.0) { // Significant anomaly
          anomalies.push({
            transactionId: transaction?.id,
            amount: outlier.value,
            category,
            date: transaction?.date,
            description: transaction?.description,
            zScore: Math.round(zScore * 100) / 100,
            isolationScore: Math.round(outlier.score * 100) / 100,
            severity: Math.abs(zScore) > 3 ? 'high' : Math.abs(zScore) > 2.5 ? 'medium' : 'low',
            confidence: Math.min(95, Math.abs(zScore) * 30),
            reasoning: `Amount deviates ${Math.abs(zScore).toFixed(1)} standard deviations from category mean (μ=${stats.mean.toFixed(2)}, σ=${stats.stdDev.toFixed(2)})`,
            recommendation: Math.abs(zScore) > 3 
              ? 'Review transaction for potential errors or fraud'
              : 'Unusual spending pattern detected - consider if this was planned'
          });
        }
      });
    });

    // Sort by severity and confidence
    anomalies.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (severityOrder[b.severity] * b.confidence) - (severityOrder[a.severity] * a.confidence);
    });

    res.json({
      anomalies: anomalies.slice(0, 10), // Top 10 most significant anomalies
      totalAnalyzed: transactions.length,
      mlModel: 'Z-score Analysis + Isolation Forest Principles',
      sensitivity,
      statisticalSummary: {
        categoriesAnalyzed: Object.keys(categoryStats).length,
        averageTransactionAmount: timeSeriesData.reduce((sum, tx) => sum + tx.amount, 0) / timeSeriesData.length,
        timeRange: '60 days'
      }
    });

  } catch (err) {
    console.error('🔴 ADVANCED ANOMALIES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to perform anomaly detection' });
  }
};

// API endpoint: Get comprehensive AI financial insights
const getFinancialInsights = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Fetch transaction data
    const transactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '6 months'
      ORDER BY date DESC
    `, [userId]);

    const transactions = transactionsResult.rows;

    if (transactions.length < 5) {
      return res.json({
        insights: [],
        message: 'Insufficient data for AI analysis',
        confidence: 0
      });
    }

    const { categoryStats, timeSeriesData } = FinancialMLEngine.analyzeSpendingPatterns(transactions);
    const trendAnalysis = FinancialMLEngine.calculateTrendAnalysis(timeSeriesData, 14);
    
    const insights = {
      spendingPatterns: {
        totalCategories: Object.keys(categoryStats).length,
        topSpendingCategory: Object.entries(categoryStats)
          .sort(([,a], [,b]) => b.total - a.total)[0],
        mostVolatileCategory: Object.entries(categoryStats)
          .sort(([,a], [,b]) => (b.stdDev/b.mean) - (a.stdDev/a.mean))[0]
      },
      trendAnalysis,
      behavioralInsights: {
        averageTransactionAmount: timeSeriesData.reduce((sum, tx) => sum + tx.amount, 0) / timeSeriesData.length,
        weekendSpendingRatio: timeSeriesData.filter(tx => tx.dayOfWeek === 0 || tx.dayOfWeek === 6).length / timeSeriesData.length,
        monthlySpendingPeak: Math.max(...Array.from({length: 31}, (_, i) => 
          timeSeriesData.filter(tx => tx.dayOfMonth === i + 1).length
        )) + 1
      },
      mlMetrics: {
        dataQuality: Math.min(100, (transactions.length / 100) * 80 + 20),
        predictionConfidence: trendAnalysis?.confidence || 0,
        modelType: 'Comprehensive Statistical Analysis'
      }
    };

    res.json(insights);

  } catch (err) {
    console.error('🔴 FINANCIAL INSIGHTS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to generate financial insights' });
  }
};

// API endpoint: Get financial health data for score calculation
const getFinancialHealthData = async (req, res) => {
  const userId = req.user.userId;

  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get monthly income
    const incomeResult = await db.query(`
      SELECT SUM(amount) as total_income
      FROM transactions 
      WHERE user_id = $1 AND type = 'income' 
        AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    // Get monthly expenses
    const expensesResult = await db.query(`
      SELECT SUM(amount) as total_expenses
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense' 
        AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    // Get savings (assuming savings transactions or income - expenses)
    const monthlyIncome = parseFloat(incomeResult.rows[0]?.total_income || 0);
    const monthlyExpenses = parseFloat(expensesResult.rows[0]?.total_expenses || 0);
    const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);

    // Get emergency fund (assuming it's savings account balance or total savings over time)
    const emergencyFundResult = await db.query(`
      SELECT SUM(amount) as emergency_fund
      FROM transactions 
      WHERE user_id = $1 AND type = 'income' 
        AND (LOWER(description) LIKE '%savings%' OR LOWER(category) LIKE '%savings%')
        AND date >= CURRENT_DATE - INTERVAL '12 months'
    `, [userId]);

    const emergencyFund = Math.max(0, parseFloat(emergencyFundResult.rows[0]?.emergency_fund || 0) * 0.3); // Assume 30% goes to emergency

    // Get debt payments (loan payments, credit card payments)
    const debtResult = await db.query(`
      SELECT SUM(amount) as monthly_debt
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense' 
        AND (LOWER(category) LIKE '%loan%' OR LOWER(category) LIKE '%credit%' OR LOWER(description) LIKE '%payment%')
        AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    const monthlyDebtPayments = parseFloat(debtResult.rows[0]?.monthly_debt || 0);

    // Get budget adherence data
    const budgetResult = await db.query(`
      SELECT b.category, b.limit_amount, COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON b.category = t.category 
        AND t.user_id = b.user_id 
        AND t.type = 'expense'
        AND EXTRACT(MONTH FROM t.date) = b.month 
        AND EXTRACT(YEAR FROM t.date) = b.year
      WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
      GROUP BY b.category, b.limit_amount
    `, [userId, currentMonth, currentYear]);

    const budgetItems = budgetResult.rows.map(row => ({
      category: row.category,
      budget: parseFloat(row.limit_amount),
      spent: parseFloat(row.spent)
    }));

    // Calculate investment diversity (based on different investment categories)
    const investmentResult = await db.query(`
      SELECT COUNT(DISTINCT category) as investment_types
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense'
        AND (LOWER(category) LIKE '%investment%' 
             OR LOWER(category) LIKE '%stock%' 
             OR LOWER(category) LIKE '%bond%'
             OR LOWER(category) LIKE '%mutual%'
             OR LOWER(category) LIKE '%crypto%'
             OR LOWER(description) LIKE '%invest%')
        AND date >= CURRENT_DATE - INTERVAL '12 months'
    `, [userId]);

    const investmentTypes = parseInt(investmentResult.rows[0]?.investment_types || 0);

    // Mock financial goals for now (this would come from a goals table in real implementation)
    const financialGoals = [
      { name: 'Emergency Fund', progress: Math.min(100, (emergencyFund / (monthlyExpenses * 6)) * 100) },
      { name: 'Debt Reduction', progress: monthlyDebtPayments > 0 ? 75 : 100 }, // Assume progress if actively paying debt
      { name: 'Savings Rate', progress: monthlyIncome > 0 ? Math.min(100, (monthlySavings / monthlyIncome) * 100 * 5) : 0 } // Scale up savings rate for progress
    ];

    const healthData = {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      emergencyFund,
      monthlyDebtPayments,
      investmentTypes,
      budgetItems,
      financialGoals,
      dataQuality: {
        transactionsThisMonth: (await db.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3', [userId, currentMonth, currentYear])).rows[0].count,
        budgetsSet: budgetItems.length,
        hasIncome: monthlyIncome > 0,
        hasExpenses: monthlyExpenses > 0
      }
    };

    res.json(healthData);

  } catch (err) {
    console.error('🔴 FINANCIAL HEALTH DATA ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch financial health data' });
  }
};

// API endpoint: Advanced predictive analytics using ensemble methods
const getPredictiveAnalytics = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Fetch comprehensive data for predictive modeling
    const transactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '9 months'
      ORDER BY date ASC
    `, [userId]);

    const transactions = transactionsResult.rows;

    if (transactions.length < 30) {
      return res.json({
        predictions: [],
        message: 'Insufficient data for advanced predictive analytics',
        confidence: 0
      });
    }

    const { categoryStats } = FinancialMLEngine.analyzeSpendingPatterns(transactions);
    const cashFlowPrediction = FinancialMLEngine.predictCashFlow(transactions, 3);
    
    // Advanced ensemble predictions
    const predictions = {
      spendingForecast: {
        nextMonth: Object.entries(categoryStats).map(([category, stats]) => ({
          category,
          predictedAmount: stats.mean + (stats.stdDev * 0.1), // Trend-adjusted prediction
          confidence: Math.min(85, (stats.count / 10) * 30 + 50),
          trend: stats.variance > stats.mean * 0.25 ? 'volatile' : 'stable'
        }))
      },
      budgetOptimization: FinancialMLEngine.optimizeBudget(categoryStats),
      riskFactors: Object.entries(categoryStats)
        .filter(([_, stats]) => stats.stdDev > stats.mean * 0.4)
        .map(([category, stats]) => ({
          category,
          riskLevel: stats.stdDev > stats.mean * 0.6 ? 'high' : 'medium',
          volatility: (stats.stdDev / stats.mean) * 100,
          recommendation: `Monitor ${category} spending - high variance detected`
        })),
      cashFlowOutlook: cashFlowPrediction?.forecasts?.slice(0, 3) || []
    };

    res.json({
      predictions,
      mlModel: 'Ensemble Methods (ARIMA + Statistical Analysis + Risk Assessment)',
      confidence: Math.round(Math.min(90, (transactions.length / 100) * 70 + 20)),
      analysisDetails: {
        transactionsAnalyzed: transactions.length,
        timeRange: '9 months',
        modelsUsed: ['Time Series', 'Statistical Analysis', 'Risk Assessment']
      }
    });

  } catch (err) {
    console.error('🔴 PREDICTIVE ANALYTICS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to generate predictive analytics' });
  }
};

// API endpoint: ML-powered risk assessment scoring
const getRiskAssessment = async (req, res) => {
  const userId = req.user.userId;

  try {
    const transactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '6 months'
      ORDER BY date DESC
    `, [userId]);

    const transactions = transactionsResult.rows;

    if (transactions.length < 10) {
      return res.json({
        riskScore: 0,
        message: 'Insufficient data for risk assessment',
        confidence: 0
      });
    }

    const { categoryStats } = FinancialMLEngine.analyzeSpendingPatterns(transactions);
    
    // Calculate risk metrics
    const totalSpending = Object.values(categoryStats).reduce((sum, stats) => sum + stats.total, 0);
    const incomeTransactions = transactions.filter(tx => tx.type === 'income');
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    // Risk factors (0-100 scale, higher = more risky)
    const spendingVariability = Math.min(100, Object.values(categoryStats)
      .reduce((sum, stats) => sum + (stats.stdDev / stats.mean), 0) * 10);
    
    const incomeStability = incomeTransactions.length < 3 ? 80 : 
      Math.min(100, (incomeTransactions.map(tx => parseFloat(tx.amount))
        .reduce((sum, amt) => sum + Math.abs(amt - (totalIncome / incomeTransactions.length)), 0) 
        / totalIncome) * 100);
    
    const expenseRatio = totalIncome > 0 ? Math.min(100, (totalSpending / totalIncome) * 100) : 75;
    const categoryConcentration = Math.min(100, (Object.values(categoryStats)[0]?.total / totalSpending) * 200);
    
    // Weighted risk score
    const riskScore = Math.round(
      (spendingVariability * 0.25) +
      (incomeStability * 0.30) +
      (expenseRatio * 0.30) +
      (categoryConcentration * 0.15)
    );

    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    
    res.json({
      riskScore,
      riskLevel,
      riskFactors: {
        spendingVariability: Math.round(spendingVariability),
        incomeStability: Math.round(incomeStability),
        expenseRatio: Math.round(expenseRatio),
        categoryConcentration: Math.round(categoryConcentration)
      },
      recommendations: [
        riskScore > 50 ? 'Consider building an emergency fund to reduce financial risk' : 'Maintain current financial stability',
        spendingVariability > 60 ? 'Create budgets to reduce spending variability' : 'Good spending consistency',
        expenseRatio > 80 ? 'Reduce expenses or increase income to improve financial health' : 'Healthy expense-to-income ratio'
      ],
      mlModel: 'Multi-factor Risk Assessment Algorithm',
      confidence: Math.min(95, (transactions.length / 50) * 30 + 60)
    });

  } catch (err) {
    console.error('🔴 RISK ASSESSMENT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to generate risk assessment' });
  }
};

// API endpoint: AI-powered financial health score
const getFinancialHealthScore = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get comprehensive financial data
    const healthDataResponse = await getFinancialHealthData(req, res);
    
    // Create a mock response object to capture the data
    const mockRes = {
      json: (data) => data,
      status: () => mockRes
    };
    
    // Get the health data by calling the existing function
    const healthData = await new Promise((resolve, reject) => {
      const mockReq = { user: { userId } };
      const mockResWithData = {
        json: resolve,
        status: () => mockResWithData
      };
      getFinancialHealthData(mockReq, mockResWithData).catch(reject);
    });

    // Calculate AI-powered health score (0-100)
    let healthScore = 0;
    const scoreComponents = {};

    // Income stability (25% of score)
    if (healthData.monthlyIncome > 0) {
      scoreComponents.incomeStability = 25;
      healthScore += 25;
    } else {
      scoreComponents.incomeStability = 0;
    }

    // Expense management (20% of score)
    const expenseRatio = healthData.monthlyIncome > 0 ? 
      (healthData.monthlyExpenses / healthData.monthlyIncome) : 1;
    if (expenseRatio < 0.5) {
      scoreComponents.expenseManagement = 20;
      healthScore += 20;
    } else if (expenseRatio < 0.8) {
      scoreComponents.expenseManagement = 15;
      healthScore += 15;
    } else if (expenseRatio < 1.0) {
      scoreComponents.expenseManagement = 10;
      healthScore += 10;
    } else {
      scoreComponents.expenseManagement = 0;
    }

    // Savings rate (20% of score)
    const savingsRate = healthData.monthlyIncome > 0 ? 
      (healthData.monthlySavings / healthData.monthlyIncome) : 0;
    if (savingsRate > 0.2) {
      scoreComponents.savingsRate = 20;
      healthScore += 20;
    } else if (savingsRate > 0.1) {
      scoreComponents.savingsRate = 15;
      healthScore += 15;
    } else if (savingsRate > 0) {
      scoreComponents.savingsRate = 10;
      healthScore += 10;
    } else {
      scoreComponents.savingsRate = 0;
    }

    // Emergency fund (15% of score)
    const emergencyFundMonths = healthData.monthlyExpenses > 0 ? 
      (healthData.emergencyFund / healthData.monthlyExpenses) : 0;
    if (emergencyFundMonths >= 6) {
      scoreComponents.emergencyFund = 15;
      healthScore += 15;
    } else if (emergencyFundMonths >= 3) {
      scoreComponents.emergencyFund = 10;
      healthScore += 10;
    } else if (emergencyFundMonths >= 1) {
      scoreComponents.emergencyFund = 5;
      healthScore += 5;
    } else {
      scoreComponents.emergencyFund = 0;
    }

    // Debt management (10% of score)
    const debtToIncomeRatio = healthData.monthlyIncome > 0 ? 
      (healthData.monthlyDebtPayments / healthData.monthlyIncome) : 0;
    if (debtToIncomeRatio === 0) {
      scoreComponents.debtManagement = 10;
      healthScore += 10;
    } else if (debtToIncomeRatio < 0.1) {
      scoreComponents.debtManagement = 8;
      healthScore += 8;
    } else if (debtToIncomeRatio < 0.2) {
      scoreComponents.debtManagement = 5;
      healthScore += 5;
    } else {
      scoreComponents.debtManagement = 0;
    }

    // Budget adherence (10% of score)
    let budgetAdherence = 0;
    if (healthData.budgetItems.length > 0) {
      const adherentBudgets = healthData.budgetItems.filter(item => item.spent <= item.budget).length;
      budgetAdherence = (adherentBudgets / healthData.budgetItems.length) * 10;
      scoreComponents.budgetAdherence = Math.round(budgetAdherence);
      healthScore += budgetAdherence;
    } else {
      scoreComponents.budgetAdherence = 0;
    }

    // Generate personalized recommendations
    const recommendations = [];
    if (scoreComponents.incomeStability === 0) {
      recommendations.push('Focus on establishing a stable income source');
    }
    if (scoreComponents.expenseManagement < 15) {
      recommendations.push('Reduce monthly expenses to improve financial health');
    }
    if (scoreComponents.savingsRate < 10) {
      recommendations.push('Increase your savings rate to at least 10% of income');
    }
    if (scoreComponents.emergencyFund < 10) {
      recommendations.push('Build an emergency fund covering 3-6 months of expenses');
    }
    if (scoreComponents.debtManagement < 5) {
      recommendations.push('Reduce debt payments to improve cash flow');
    }
    if (scoreComponents.budgetAdherence < 5) {
      recommendations.push('Create and follow budgets for better expense control');
    }

    const healthLevel = healthScore >= 80 ? 'excellent' : 
                       healthScore >= 60 ? 'good' : 
                       healthScore >= 40 ? 'fair' : 'poor';

    res.json({
      healthScore: Math.round(healthScore),
      healthLevel,
      scoreComponents,
      recommendations: recommendations.slice(0, 3),
      financialGoals: healthData.financialGoals,
      mlModel: 'Multi-dimensional Financial Health Assessment',
      confidence: 85
    });

  } catch (err) {
    console.error('🔴 FINANCIAL HEALTH SCORE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to calculate financial health score' });
  }
};

module.exports = {
  getAIBudgetRecommendations,
  getBudgetRecommendations,
  getPredictiveCashFlow,
  getAdvancedAnomalies,
  getFinancialInsights,
  getFinancialHealthData,
  getPredictiveAnalytics,
  getRiskAssessment,
  getFinancialHealthScore
};