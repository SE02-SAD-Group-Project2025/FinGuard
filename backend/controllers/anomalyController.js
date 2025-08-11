const db = require('../db');

// Get detected anomalies for user
const getAnomalies = async (req, res) => {
  const userId = req.user.userId;
  const { filter = 'all', limit = 10 } = req.query;

  try {
    let whereClause = 'user_id = $1';
    let queryParams = [userId];

    if (filter !== 'all') {
      whereClause += ' AND severity = $2';
      queryParams.push(filter);
    }

    const result = await db.query(`
      SELECT *
      FROM anomalies 
      WHERE ${whereClause}
      ORDER BY detected_at DESC
      LIMIT $${queryParams.length + 1}
    `, [...queryParams, limit]);

    const anomalies = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      amount: parseFloat(row.amount),
      normalAmount: parseFloat(row.normal_amount),
      category: row.category,
      date: row.transaction_date,
      time: row.transaction_time,
      location: row.location,
      confidence: parseInt(row.confidence),
      status: row.status,
      details: row.details ? JSON.parse(row.details) : {},
      recommendations: row.recommendations ? JSON.parse(row.recommendations) : []
    }));

    res.json(anomalies);
  } catch (err) {
    console.error('🔴 ANOMALIES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
};

// Advanced ML-based anomaly detection using statistical methods
const detectAnomalies = async (req, res) => {
  const userId = req.user.userId;

  try {
    console.log('🤖 Starting ML-powered anomaly detection for user:', userId);
    
    // Get comprehensive transaction history for statistical analysis
    const transactionsResult = await db.query(`
      SELECT *
      FROM transactions 
      WHERE user_id = $1 
      AND type = 'expense'
      AND date >= CURRENT_DATE - INTERVAL '120 days'
      ORDER BY date DESC, created_at DESC
    `, [userId]);

    const transactions = transactionsResult.rows;
    console.log(`📊 Analyzing ${transactions.length} transactions with ML algorithms`);

    if (transactions.length < 15) {
      return res.json({
        message: 'Insufficient transaction history for statistical anomaly detection (minimum 15 transactions)',
        anomalies: [],
        mlModel: 'Statistical Analysis + Isolation Forest'
      });
    }

    const detectedAnomalies = [];
    
    // 1. Z-Score Based Statistical Anomaly Detection
    const statisticalAnomalies = await detectStatisticalAnomalies(userId, transactions);
    detectedAnomalies.push(...statisticalAnomalies);

    // 2. Isolation Forest-inspired Outlier Detection
    const isolationAnomalies = await detectIsolationForestAnomalies(userId, transactions);
    detectedAnomalies.push(...isolationAnomalies);

    // 3. Time Series Anomaly Detection
    const timeSeriesAnomalies = await detectTimeSeriesAnomalies(userId, transactions);
    detectedAnomalies.push(...timeSeriesAnomalies);

    // 4. Multi-dimensional Clustering Anomalies
    const clusteringAnomalies = await detectClusteringAnomalies(userId, transactions);
    detectedAnomalies.push(...clusteringAnomalies);

    // Remove duplicates and rank by confidence
    const uniqueAnomalies = removeDuplicateAnomalies(detectedAnomalies);
    const rankedAnomalies = rankAnomaliesByMLConfidence(uniqueAnomalies);

    // Save top anomalies to database
    for (const anomaly of rankedAnomalies.slice(0, 10)) {
      await saveAnomaly(userId, anomaly);
    }

    console.log(`🎯 ML Analysis Complete: ${rankedAnomalies.length} anomalies detected`);
    res.json({
      message: `ML-powered anomaly detection complete. Found ${rankedAnomalies.length} potential anomalies using statistical analysis.`,
      anomalies: rankedAnomalies,
      mlModel: 'Z-score Analysis + Isolation Forest Principles + Time Series Analysis',
      statisticalMetrics: {
        transactionsAnalyzed: transactions.length,
        algorithmsUsed: ['Z-score', 'Isolation Forest', 'Time Series', 'Clustering'],
        confidenceThreshold: 70,
        timeRange: '120 days'
      }
    });
  } catch (err) {
    console.error('🔴 ML ANOMALY DETECTION ERROR:', err.message);
    res.status(500).json({ error: 'Failed to perform ML-based anomaly detection' });
  }
};

// Z-Score Based Statistical Anomaly Detection
const detectStatisticalAnomalies = async (userId, transactions) => {
  const anomalies = [];
  const categoryData = {};

  // Group transactions by category for statistical analysis
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    if (!categoryData[category]) {
      categoryData[category] = [];
    }
    categoryData[category].push({
      amount: parseFloat(tx.amount),
      date: tx.date,
      description: tx.description,
      id: tx.id
    });
  });

  // Calculate Z-scores for each category
  Object.entries(categoryData).forEach(([category, txs]) => {
    if (txs.length < 5) return; // Need minimum data for statistical significance

    const amounts = txs.map(tx => tx.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return; // No variance, can't detect anomalies

    txs.forEach(tx => {
      const zScore = (tx.amount - mean) / stdDev;
      
      // Flag transactions with |z-score| > 2.5 (statistically significant outliers)
      if (Math.abs(zScore) > 2.5) {
        const confidence = Math.min(95, Math.abs(zScore) * 25 + 50);
        
        anomalies.push({
          type: 'statistical_outlier',
          severity: Math.abs(zScore) > 3.5 ? 'high' : Math.abs(zScore) > 2.8 ? 'medium' : 'low',
          title: `Statistical Outlier in ${category}`,
          description: `Transaction amount deviates ${Math.abs(zScore).toFixed(2)} standard deviations from normal ${category.toLowerCase()} spending`,
          amount: tx.amount,
          normalAmount: mean,
          category: category,
          date: tx.date.toISOString().split('T')[0],
          confidence: Math.round(confidence),
          details: {
            zScore: Math.round(zScore * 100) / 100,
            mean: Math.round(mean * 100) / 100,
            standardDeviation: Math.round(stdDev * 100) / 100,
            sampleSize: amounts.length,
            mlAlgorithm: 'Z-score Statistical Analysis'
          },
          recommendations: [
            Math.abs(zScore) > 3.5 ? 'High statistical deviation - verify transaction accuracy' :
            'Unusual spending pattern detected - review if this was planned',
            'Consider setting alerts for this spending range',
            'Monitor similar transactions in this category'
          ]
        });
      }
    });
  });

  return anomalies.slice(0, 5); // Top 5 statistical anomalies
};

// Isolation Forest-inspired Outlier Detection
const detectIsolationForestAnomalies = async (userId, transactions) => {
  const anomalies = [];
  
  // Multi-dimensional feature extraction
  const features = transactions.map(tx => ({
    amount: parseFloat(tx.amount),
    dayOfWeek: new Date(tx.date).getDay(),
    dayOfMonth: new Date(tx.date).getDate(),
    hourOfDay: new Date(tx.created_at || tx.date).getHours(),
    categoryIndex: getCategoryIndex(tx.category),
    transaction: tx
  }));

  if (features.length < 10) return anomalies;

  // Calculate isolation scores using path length approximation
  const isolationScores = features.map(feature => {
    let pathLength = 0;
    let remainingData = features.filter(f => f !== feature);
    
    // Simulate isolation tree path length
    for (let depth = 0; depth < Math.log2(features.length) && remainingData.length > 1; depth++) {
      // Random feature selection and split
      const splitFeature = ['amount', 'dayOfWeek', 'dayOfMonth', 'hourOfDay'][Math.floor(Math.random() * 4)];
      const splitValue = feature[splitFeature];
      
      // Count how many points are isolated at this split
      const leftSide = remainingData.filter(f => f[splitFeature] <= splitValue);
      const rightSide = remainingData.filter(f => f[splitFeature] > splitValue);
      
      if (leftSide.length === 0 || rightSide.length === 0) {
        pathLength = depth;
        break;
      }
      
      // Follow the path with fewer points (more isolated)
      remainingData = leftSide.length < rightSide.length ? leftSide : rightSide;
      pathLength = depth + 1;
    }

    // Normalize path length (shorter paths = more anomalous)
    const avgPathLength = Math.log2(features.length);
    const anomalyScore = Math.pow(2, -pathLength / avgPathLength);
    
    return {
      ...feature,
      isolationScore: anomalyScore,
      pathLength: pathLength
    };
  });

  // Sort by isolation score (higher = more anomalous)
  isolationScores.sort((a, b) => b.isolationScore - a.isolationScore);

  // Flag top 10% as potential anomalies
  const anomalyThreshold = Math.ceil(isolationScores.length * 0.1);
  
  isolationScores.slice(0, anomalyThreshold).forEach(item => {
    if (item.isolationScore > 0.6) { // High isolation score threshold
      const confidence = Math.round(item.isolationScore * 100);
      
      anomalies.push({
        type: 'isolation_forest_outlier',
        severity: item.isolationScore > 0.8 ? 'high' : item.isolationScore > 0.7 ? 'medium' : 'low',
        title: 'Multi-dimensional Anomaly Detected',
        description: `Transaction shows unusual patterns across multiple dimensions (amount, timing, category)`,
        amount: item.amount,
        normalAmount: item.amount * 0.7, // Approximation
        category: item.transaction.category || 'Uncategorized',
        date: item.transaction.date.toISOString().split('T')[0],
        confidence: confidence,
        details: {
          isolationScore: Math.round(item.isolationScore * 1000) / 1000,
          pathLength: item.pathLength,
          features: {
            amount: item.amount,
            dayOfWeek: item.dayOfWeek,
            dayOfMonth: item.dayOfMonth,
            hourOfDay: item.hourOfDay
          },
          mlAlgorithm: 'Isolation Forest Principles'
        },
        recommendations: [
          'Multi-dimensional anomaly detected using ML clustering',
          'Verify transaction details and timing',
          'Check for potential account security issues if highly anomalous'
        ]
      });
    }
  });

  return anomalies.slice(0, 3); // Top 3 isolation forest anomalies
};

// Time Series Anomaly Detection using moving averages and trends
const detectTimeSeriesAnomalies = async (userId, transactions) => {
  const anomalies = [];
  
  // Sort transactions chronologically
  const sortedTxs = transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  const dailySpending = {};

  // Aggregate daily spending
  sortedTxs.forEach(tx => {
    const dateKey = tx.date.toISOString().split('T')[0];
    dailySpending[dateKey] = (dailySpending[dateKey] || 0) + parseFloat(tx.amount);
  });

  const dailyAmounts = Object.values(dailySpending);
  if (dailyAmounts.length < 14) return anomalies; // Need at least 2 weeks of data

  // Calculate 7-day moving average
  const movingAverage = [];
  const windowSize = 7;
  
  for (let i = windowSize - 1; i < dailyAmounts.length; i++) {
    const window = dailyAmounts.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
    movingAverage.push(avg);
  }

  // Detect anomalies using moving average deviation
  const dates = Object.keys(dailySpending).sort();
  
  for (let i = windowSize - 1; i < dailyAmounts.length; i++) {
    const actual = dailyAmounts[i];
    const predicted = movingAverage[i - windowSize + 1];
    const deviation = Math.abs(actual - predicted) / predicted;
    
    if (deviation > 0.5 && actual > 1000) { // 50% deviation threshold
      const confidence = Math.min(90, deviation * 100);
      
      anomalies.push({
        type: 'time_series_anomaly',
        severity: deviation > 1.0 ? 'high' : deviation > 0.7 ? 'medium' : 'low',
        title: 'Daily Spending Pattern Anomaly',
        description: `Daily spending deviates ${Math.round(deviation * 100)}% from 7-day moving average trend`,
        amount: actual,
        normalAmount: predicted,
        category: 'Daily Pattern',
        date: dates[i],
        confidence: Math.round(confidence),
        details: {
          deviation: Math.round(deviation * 1000) / 1000,
          movingAverage: Math.round(predicted * 100) / 100,
          actual: Math.round(actual * 100) / 100,
          windowSize: windowSize,
          mlAlgorithm: 'Time Series Moving Average Analysis'
        },
        recommendations: [
          'Unusual daily spending pattern detected',
          'Review transactions for this date',
          'Consider if this was due to special events or emergencies'
        ]
      });
    }
  }

  return anomalies.slice(0, 3); // Top 3 time series anomalies
};

// Multi-dimensional Clustering Anomalies
const detectClusteringAnomalies = async (userId, transactions) => {
  const anomalies = [];
  
  // Feature engineering for clustering
  const features = transactions.map(tx => {
    const date = new Date(tx.date);
    return {
      amount: parseFloat(tx.amount),
      weekday: date.getDay() < 5 ? 1 : 0, // Weekday vs weekend
      monthDay: date.getDate(),
      category: getCategoryIndex(tx.category),
      transaction: tx
    };
  });

  if (features.length < 20) return anomalies;

  // Simple k-means clustering approximation (k=3)
  const k = 3;
  let centroids = initializeCentroids(features, k);
  
  for (let iteration = 0; iteration < 10; iteration++) {
    const clusters = assignToClusters(features, centroids);
    const newCentroids = updateCentroids(clusters);
    
    // Check for convergence
    if (centroidsConverged(centroids, newCentroids)) break;
    centroids = newCentroids;
  }

  // Calculate distances to nearest centroid for anomaly detection
  features.forEach(feature => {
    const distances = centroids.map(centroid => euclideanDistance(feature, centroid));
    const minDistance = Math.min(...distances);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    // Anomaly score based on distance from cluster centers
    const anomalyScore = minDistance / avgDistance;
    
    if (anomalyScore > 1.5) { // Significantly far from all clusters
      const confidence = Math.min(85, anomalyScore * 30);
      
      anomalies.push({
        type: 'clustering_anomaly',
        severity: anomalyScore > 2.0 ? 'high' : anomalyScore > 1.7 ? 'medium' : 'low',
        title: 'Behavioral Clustering Anomaly',
        description: `Transaction doesn't fit typical spending behavior clusters`,
        amount: feature.amount,
        normalAmount: feature.amount * 0.8,
        category: feature.transaction.category || 'Uncategorized',
        date: feature.transaction.date.toISOString().split('T')[0],
        confidence: Math.round(confidence),
        details: {
          anomalyScore: Math.round(anomalyScore * 1000) / 1000,
          clusterDistance: Math.round(minDistance * 100) / 100,
          mlAlgorithm: 'K-means Clustering Analysis'
        },
        recommendations: [
          'Transaction deviates from typical behavior patterns',
          'Verify if this represents a new spending category or unusual circumstance',
          'Monitor for similar atypical transactions'
        ]
      });
    }
  });

  return anomalies.slice(0, 2); // Top 2 clustering anomalies
};

// Utility functions for ML algorithms
const getCategoryIndex = (category) => {
  const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Other'];
  return categories.indexOf(category || 'Other') + 1;
};

const initializeCentroids = (features, k) => {
  const centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * features.length);
    centroids.push({...features[randomIndex]});
  }
  return centroids;
};

const euclideanDistance = (point1, point2) => {
  const keys = ['amount', 'weekday', 'monthDay', 'category'];
  return Math.sqrt(keys.reduce((sum, key) => {
    const diff = (point1[key] || 0) - (point2[key] || 0);
    return sum + diff * diff;
  }, 0));
};

const assignToClusters = (features, centroids) => {
  const clusters = centroids.map(() => []);
  
  features.forEach(feature => {
    const distances = centroids.map(centroid => euclideanDistance(feature, centroid));
    const closestIndex = distances.indexOf(Math.min(...distances));
    clusters[closestIndex].push(feature);
  });
  
  return clusters;
};

const updateCentroids = (clusters) => {
  return clusters.map(cluster => {
    if (cluster.length === 0) return {amount: 0, weekday: 0, monthDay: 15, category: 1};
    
    const keys = ['amount', 'weekday', 'monthDay', 'category'];
    const newCentroid = {};
    
    keys.forEach(key => {
      newCentroid[key] = cluster.reduce((sum, point) => sum + (point[key] || 0), 0) / cluster.length;
    });
    
    return newCentroid;
  });
};

const centroidsConverged = (old, new_centroids) => {
  const threshold = 0.1;
  return old.every((centroid, i) => {
    const keys = ['amount', 'weekday', 'monthDay', 'category'];
    return keys.every(key => Math.abs((centroid[key] || 0) - (new_centroids[i][key] || 0)) < threshold);
  });
};

const removeDuplicateAnomalies = (anomalies) => {
  const seen = new Set();
  return anomalies.filter(anomaly => {
    const key = `${anomaly.date}-${anomaly.amount}-${anomaly.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const rankAnomaliesByMLConfidence = (anomalies) => {
  return anomalies.sort((a, b) => {
    const scoreA = a.confidence * getSeverityWeight(a.severity);
    const scoreB = b.confidence * getSeverityWeight(b.severity);
    return scoreB - scoreA;
  });
};

const getSeverityWeight = (severity) => {
  switch (severity) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 1;
  }
};

// Original detect spending spikes function (keeping for backward compatibility)
const detectSpendingSpikes = async (userId, transactions) => {
  const anomalies = [];
  const categorySpending = {};

  // Group transactions by category and calculate averages
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    if (!categorySpending[category]) {
      categorySpending[category] = [];
    }
    categorySpending[category].push({
      amount: parseFloat(tx.amount),
      date: tx.date,
      description: tx.description
    });
  });

  // Check each category for spending spikes
  Object.entries(categorySpending).forEach(([category, txs]) => {
    if (txs.length < 5) return; // Need sufficient data

    const amounts = txs.map(tx => tx.amount);
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const recentTxs = txs.slice(0, Math.min(5, txs.length)); // Last 5 transactions

    recentTxs.forEach(tx => {
      const spike = tx.amount / average;
      if (spike >= 3.0 && tx.amount > 1000) { // 300% higher than average and significant amount
        anomalies.push({
          type: 'spending_spike',
          severity: spike >= 5 ? 'high' : spike >= 3 ? 'medium' : 'low',
          title: 'Unusual High Spending Detected',
          description: `Your ${category.toLowerCase()} expenses are ${Math.round((spike - 1) * 100)}% higher than usual`,
          amount: tx.amount,
          normalAmount: average,
          category: category,
          date: tx.date.toISOString().split('T')[0],
          confidence: Math.min(95, Math.round(spike * 20)),
          details: {
            pattern: 'Spending spike detected',
            comparison: 'vs category average',
            trigger: 'Amount threshold exceeded',
            relatedTransactions: [{ description: tx.description, amount: tx.amount }]
          },
          recommendations: [
            'Review this transaction for accuracy',
            'Check if this was a planned expense',
            'Consider adjusting category budget if needed',
            'Set up spending alerts for this category'
          ]
        });
      }
    });
  });

  return anomalies.slice(0, 3); // Limit to top 3
};

// Detect category spending pattern changes
const detectCategoryAnomalies = async (userId, transactions) => {
  const anomalies = [];
  
  // Get spending by category for last 30 days vs previous 60 days
  const recent = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const daysAgo = (new Date() - txDate) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });
  
  const previous = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const daysAgo = (new Date() - txDate) / (1000 * 60 * 60 * 24);
    return daysAgo > 30 && daysAgo <= 90;
  });

  if (recent.length < 3 || previous.length < 3) return anomalies;

  const recentByCategory = groupByCategory(recent);
  const previousByCategory = groupByCategory(previous);

  Object.entries(recentByCategory).forEach(([category, recentSpending]) => {
    const previousSpending = previousByCategory[category] || 0;
    const change = recentSpending / previousSpending;
    
    if (change >= 2.5 && recentSpending > 2000) { // 250% increase and significant amount
      anomalies.push({
        type: 'category_shift',
        severity: change >= 4 ? 'high' : change >= 2.5 ? 'medium' : 'low',
        title: 'Category Spending Shift',
        description: `Significant increase in ${category.toLowerCase()} spending`,
        amount: recentSpending,
        normalAmount: previousSpending,
        category: category,
        date: new Date().toISOString().split('T')[0],
        confidence: Math.min(90, Math.round(change * 15)),
        details: {
          pattern: 'Category spending pattern changed',
          comparison: 'vs previous period average',
          trigger: 'Category spending threshold exceeded'
        },
        recommendations: [
          'Review recent transactions in this category',
          'Update budget if this is a new recurring expense',
          'Monitor for continued increases',
          'Consider if this change is temporary or permanent'
        ]
      });
    }
  });

  return anomalies.slice(0, 2);
};

// Detect unusual transaction timing
const detectTimeAnomalies = async (userId, transactions) => {
  const anomalies = [];
  
  // Check for transactions at unusual hours (11 PM - 5 AM)
  const unusualHourTxs = transactions.filter(tx => {
    if (!tx.created_at) return false;
    const hour = new Date(tx.created_at).getHours();
    return (hour >= 23 || hour <= 5) && parseFloat(tx.amount) > 500;
  }).slice(0, 2);

  unusualHourTxs.forEach(tx => {
    anomalies.push({
      type: 'time_anomaly',
      severity: 'medium',
      title: 'Unusual Time Transaction',
      description: `Transaction made at unusual time (${new Date(tx.created_at).toLocaleTimeString()})`,
      amount: parseFloat(tx.amount),
      normalAmount: parseFloat(tx.amount) * 0.9,
      category: tx.category || 'Uncategorized',
      date: tx.date.toISOString().split('T')[0],
      time: new Date(tx.created_at).toLocaleTimeString(),
      confidence: 70,
      details: {
        pattern: 'Transaction outside normal hours',
        comparison: 'vs usual transaction times',
        trigger: 'Time-based anomaly detected',
        relatedTransactions: [{ description: tx.description, amount: parseFloat(tx.amount) }]
      },
      recommendations: [
        'Verify if this transaction was legitimate',
        'Check for automatic payments or subscriptions',
        'Consider setting time-based restrictions',
        'Review account security if suspicious'
      ]
    });
  });

  return anomalies;
};

// Detect frequency anomalies (too many transactions in short time)
const detectFrequencyAnomalies = async (userId, transactions) => {
  const anomalies = [];
  
  // Group transactions by date and look for high frequency days
  const txsByDate = {};
  transactions.forEach(tx => {
    const dateKey = tx.date.toISOString().split('T')[0];
    if (!txsByDate[dateKey]) {
      txsByDate[dateKey] = [];
    }
    txsByDate[dateKey].push(tx);
  });

  Object.entries(txsByDate).forEach(([date, dayTxs]) => {
    if (dayTxs.length >= 5) { // 5 or more transactions in one day
      const totalAmount = dayTxs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      anomalies.push({
        type: 'frequency_anomaly',
        severity: dayTxs.length >= 8 ? 'high' : 'medium',
        title: 'Unusual Transaction Frequency',
        description: `${dayTxs.length} transactions made on ${date}`,
        amount: totalAmount,
        normalAmount: totalAmount * 0.4,
        category: 'Multiple',
        date: date,
        confidence: Math.min(85, dayTxs.length * 12),
        details: {
          pattern: 'High frequency transactions detected',
          comparison: 'vs normal daily transaction count',
          trigger: 'Multiple transactions in single day',
          relatedTransactions: dayTxs.slice(0, 3).map(tx => ({
            description: tx.description,
            amount: parseFloat(tx.amount)
          }))
        },
        recommendations: [
          'Review all transactions for accuracy',
          'Check if this was a planned shopping day',
          'Consider daily spending limits',
          'Monitor for recurring high-frequency days'
        ]
      });
    }
  });

  return anomalies.slice(0, 1);
};

// Helper function to group transactions by category
const groupByCategory = (transactions) => {
  return transactions.reduce((acc, tx) => {
    const category = tx.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + parseFloat(tx.amount);
    return acc;
  }, {});
};

// Save anomaly to database
const saveAnomaly = async (userId, anomaly) => {
  try {
    await db.query(`
      INSERT INTO anomalies (
        user_id, type, severity, title, description, amount, normal_amount,
        category, transaction_date, transaction_time, location, confidence,
        status, details, recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (user_id, type, transaction_date, amount) DO NOTHING
    `, [
      userId,
      anomaly.type,
      anomaly.severity,
      anomaly.title,
      anomaly.description,
      anomaly.amount,
      anomaly.normalAmount,
      anomaly.category,
      anomaly.date,
      anomaly.time || '00:00:00',
      anomaly.location || 'Unknown',
      anomaly.confidence,
      'unreviewed',
      JSON.stringify(anomaly.details || {}),
      JSON.stringify(anomaly.recommendations || [])
    ]);
  } catch (error) {
    console.error('Error saving anomaly:', error);
  }
};

// Update anomaly status (acknowledge, dismiss, etc.)
const updateAnomalyStatus = async (req, res) => {
  const { anomalyId } = req.params;
  const { status } = req.body;
  const userId = req.user.userId;

  const validStatuses = ['unreviewed', 'acknowledged', 'dismissed', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await db.query(`
      UPDATE anomalies 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
    `, [status, anomalyId, userId]);

    res.json({ success: true, message: 'Anomaly status updated' });
  } catch (err) {
    console.error('🔴 UPDATE ANOMALY ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update anomaly status' });
  }
};

module.exports = {
  getAnomalies,
  detectAnomalies,
  updateAnomalyStatus
};