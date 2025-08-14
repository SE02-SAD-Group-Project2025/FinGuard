const pool = require('../db');

// Get advanced spending analytics by category for specific timeframes
const getCategorySpendingAnalysis = async (req, res) => {
  const userId = req.user.userId;
  const { timeframe = 'year', year, category } = req.query;
  
  try {
    let dateFilter = '';
    let params = [userId];
    let paramIndex = 2;

    // Build date filter based on timeframe
    if (timeframe === 'year' && year) {
      dateFilter = `AND EXTRACT(YEAR FROM date) = $${paramIndex}`;
      params.push(parseInt(year));
      paramIndex++;
    } else if (timeframe === 'current_year') {
      dateFilter = `AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    } else if (timeframe === 'last_year') {
      dateFilter = `AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1`;
    } else if (timeframe === 'last_6_months') {
      dateFilter = `AND date >= CURRENT_DATE - INTERVAL '6 months'`;
    } else if (timeframe === 'last_3_months') {
      dateFilter = `AND date >= CURRENT_DATE - INTERVAL '3 months'`;
    }

    // Category filter
    if (category) {
      dateFilter += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    const query = `
      SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_spent,
        AVG(amount) as avg_transaction,
        MIN(amount) as min_transaction,
        MAX(amount) as max_transaction,
        TO_CHAR(date, 'YYYY-MM') as month,
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month_num
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense' ${dateFilter}
      GROUP BY category, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), TO_CHAR(date, 'YYYY-MM')
      ORDER BY year DESC, month_num DESC, total_spent DESC
    `;

    const result = await pool.query(query, params);

    // Calculate additional insights
    const totalSpent = result.rows.reduce((sum, row) => sum + parseFloat(row.total_spent), 0);
    const categoryBreakdown = {};
    
    result.rows.forEach(row => {
      if (!categoryBreakdown[row.category]) {
        categoryBreakdown[row.category] = {
          total: 0,
          transactions: 0,
          months: []
        };
      }
      categoryBreakdown[row.category].total += parseFloat(row.total_spent);
      categoryBreakdown[row.category].transactions += parseInt(row.transaction_count);
      categoryBreakdown[row.category].months.push({
        month: row.month,
        spent: parseFloat(row.total_spent),
        transactions: parseInt(row.transaction_count),
        avg: parseFloat(row.avg_transaction)
      });
    });

    res.json({
      timeframe,
      totalSpent,
      categoryBreakdown,
      monthlyData: result.rows,
      insights: {
        topCategory: Object.keys(categoryBreakdown).reduce((a, b) => 
          categoryBreakdown[a].total > categoryBreakdown[b].total ? a : b, ''
        ),
        categoriesCount: Object.keys(categoryBreakdown).length,
        avgMonthlySpending: totalSpent / Math.max(1, Object.keys(categoryBreakdown).length)
      }
    });

  } catch (error) {
    console.error('Error getting category spending analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget vs actual spending comparison
const getBudgetVsActualAnalysis = async (req, res) => {
  const userId = req.user.userId;
  const { year = new Date().getFullYear(), month } = req.query;

  try {
    let dateFilter = 'WHERE b.year = $2';
    let params = [userId, parseInt(year)];
    
    if (month) {
      dateFilter += ' AND b.month = $3';
      params.push(parseInt(month));
    }

    const query = `
      SELECT 
        b.category,
        b.limit_amount as budget_limit,
        b.month,
        b.year,
        COALESCE(spent.total_spent, 0) as actual_spent,
        COALESCE(spent.transaction_count, 0) as transaction_count,
        (b.limit_amount - COALESCE(spent.total_spent, 0)) as remaining_budget,
        CASE 
          WHEN COALESCE(spent.total_spent, 0) > b.limit_amount THEN 'over'
          WHEN COALESCE(spent.total_spent, 0) > b.limit_amount * 0.8 THEN 'warning'
          ELSE 'safe'
        END as status,
        ROUND((COALESCE(spent.total_spent, 0) / b.limit_amount) * 100, 2) as usage_percentage
      FROM budgets b
      LEFT JOIN (
        SELECT 
          category,
          SUM(amount) as total_spent,
          COUNT(*) as transaction_count,
          EXTRACT(MONTH FROM date) as month,
          EXTRACT(YEAR FROM date) as year
        FROM transactions 
        WHERE user_id = $1 AND type = 'expense'
        GROUP BY category, EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
      ) spent ON b.category = spent.category 
        AND b.month = spent.month 
        AND b.year = spent.year
      ${dateFilter}
      ORDER BY b.year DESC, b.month DESC, usage_percentage DESC
    `;

    const result = await pool.query(query, params);

    // Calculate summary statistics
    const totalBudget = result.rows.reduce((sum, row) => sum + parseFloat(row.budget_limit), 0);
    const totalSpent = result.rows.reduce((sum, row) => sum + parseFloat(row.actual_spent), 0);
    const overBudgetCategories = result.rows.filter(row => row.status === 'over').length;
    const warningCategories = result.rows.filter(row => row.status === 'warning').length;

    res.json({
      year: parseInt(year),
      month: month ? parseInt(month) : null,
      budgetComparison: result.rows,
      summary: {
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
        overallUsage: Math.round((totalSpent / totalBudget) * 100),
        overBudgetCategories,
        warningCategories,
        safeCategories: result.rows.length - overBudgetCategories - warningCategories
      }
    });

  } catch (error) {
    console.error('Error getting budget vs actual analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get spending trends and growth analysis
const getSpendingTrends = async (req, res) => {
  const userId = req.user.userId;
  const { months = 12 } = req.query;

  try {
    // Monthly spending trends
    const trendsQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month_num,
        category,
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction
      FROM transactions 
      WHERE user_id = $1 
        AND type = 'expense' 
        AND date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), category, TO_CHAR(date, 'YYYY-MM')
      ORDER BY year DESC, month_num DESC, total_spent DESC
    `;

    const trendsResult = await pool.query(trendsQuery, [userId]);

    // Calculate month-over-month growth
    const monthlyTotals = {};
    const categoryTrends = {};

    trendsResult.rows.forEach(row => {
      const monthKey = row.month;
      
      // Monthly totals
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = 0;
      }
      monthlyTotals[monthKey] += parseFloat(row.total_spent);

      // Category trends
      if (!categoryTrends[row.category]) {
        categoryTrends[row.category] = {};
      }
      categoryTrends[row.category][monthKey] = parseFloat(row.total_spent);
    });

    // Calculate growth rates
    const monthKeys = Object.keys(monthlyTotals).sort();
    const growthData = monthKeys.map((month, index) => {
      if (index === 0) return { month, total: monthlyTotals[month], growth: 0 };
      
      const prevMonth = monthKeys[index - 1];
      const currentTotal = monthlyTotals[month];
      const prevTotal = monthlyTotals[prevMonth];
      const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

      return {
        month,
        total: currentTotal,
        growth: Math.round(growth * 100) / 100
      };
    });

    res.json({
      monthlyTrends: trendsResult.rows,
      growthAnalysis: growthData,
      categoryTrends,
      insights: {
        totalMonthsAnalyzed: monthKeys.length,
        avgMonthlySpending: Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / monthKeys.length,
        highestSpendingMonth: monthKeys.reduce((a, b) => monthlyTotals[a] > monthlyTotals[b] ? a : b, ''),
        lowestSpendingMonth: monthKeys.reduce((a, b) => monthlyTotals[a] < monthlyTotals[b] ? a : b, '')
      }
    });

  } catch (error) {
    console.error('Error getting spending trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get budget efficiency and variance reports
const getBudgetEfficiencyReport = async (req, res) => {
  const userId = req.user.userId;
  const { year = new Date().getFullYear() } = req.query;

  try {
    const query = `
      SELECT 
        b.category,
        b.month,
        b.limit_amount as budget,
        COALESCE(spent.actual_spent, 0) as spent,
        COALESCE(spent.transaction_count, 0) as transactions,
        (b.limit_amount - COALESCE(spent.actual_spent, 0)) as variance,
        CASE 
          WHEN COALESCE(spent.actual_spent, 0) = 0 THEN 0
          ELSE ROUND((COALESCE(spent.actual_spent, 0) / b.limit_amount) * 100, 2)
        END as efficiency_percentage,
        CASE 
          WHEN COALESCE(spent.actual_spent, 0) <= b.limit_amount * 0.5 THEN 'under_utilized'
          WHEN COALESCE(spent.actual_spent, 0) <= b.limit_amount * 0.8 THEN 'optimal'
          WHEN COALESCE(spent.actual_spent, 0) <= b.limit_amount THEN 'near_limit'
          ELSE 'over_budget'
        END as efficiency_status
      FROM budgets b
      LEFT JOIN (
        SELECT 
          category,
          EXTRACT(MONTH FROM date) as month,
          SUM(amount) as actual_spent,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = $1 AND type = 'expense' AND EXTRACT(YEAR FROM date) = $2
        GROUP BY category, EXTRACT(MONTH FROM date)
      ) spent ON b.category = spent.category AND b.month = spent.month
      WHERE b.user_id = $1 AND b.year = $2
      ORDER BY b.month, efficiency_percentage DESC
    `;

    const result = await pool.query(query, [userId, parseInt(year)]);

    // Calculate efficiency metrics
    const totalBudget = result.rows.reduce((sum, row) => sum + parseFloat(row.budget), 0);
    const totalSpent = result.rows.reduce((sum, row) => sum + parseFloat(row.spent), 0);
    const overallEfficiency = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const efficiencyByStatus = {
      under_utilized: result.rows.filter(r => r.efficiency_status === 'under_utilized').length,
      optimal: result.rows.filter(r => r.efficiency_status === 'optimal').length,
      near_limit: result.rows.filter(r => r.efficiency_status === 'near_limit').length,
      over_budget: result.rows.filter(r => r.efficiency_status === 'over_budget').length
    };

    // Monthly efficiency trends
    const monthlyEfficiency = {};
    result.rows.forEach(row => {
      if (!monthlyEfficiency[row.month]) {
        monthlyEfficiency[row.month] = {
          totalBudget: 0,
          totalSpent: 0,
          categories: 0
        };
      }
      monthlyEfficiency[row.month].totalBudget += parseFloat(row.budget);
      monthlyEfficiency[row.month].totalSpent += parseFloat(row.spent);
      monthlyEfficiency[row.month].categories++;
    });

    Object.keys(monthlyEfficiency).forEach(month => {
      const data = monthlyEfficiency[month];
      data.efficiency = data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0;
    });

    res.json({
      year: parseInt(year),
      budgetDetails: result.rows,
      overallMetrics: {
        totalBudget,
        totalSpent,
        overallEfficiency: Math.round(overallEfficiency * 100) / 100,
        totalSavings: totalBudget - totalSpent
      },
      efficiencyDistribution: efficiencyByStatus,
      monthlyTrends: monthlyEfficiency,
      recommendations: generateBudgetRecommendations(result.rows)
    });

  } catch (error) {
    console.error('Error getting budget efficiency report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate AI-like budget recommendations
const generateBudgetRecommendations = (budgetData) => {
  const recommendations = [];

  // Find over-budget categories
  const overBudget = budgetData.filter(item => item.efficiency_status === 'over_budget');
  if (overBudget.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Over-Budget Categories Detected',
      message: `You exceeded budget in ${overBudget.length} categories. Consider reviewing spending in: ${overBudget.map(item => item.category).join(', ')}`,
      priority: 'high'
    });
  }

  // Find under-utilized budgets
  const underUtilized = budgetData.filter(item => item.efficiency_status === 'under_utilized');
  if (underUtilized.length > 0) {
    const totalUnused = underUtilized.reduce((sum, item) => sum + parseFloat(item.variance), 0);
    recommendations.push({
      type: 'info',
      title: 'Budget Optimization Opportunity',
      message: `You have LKR ${totalUnused.toFixed(2)} unused budget in ${underUtilized.length} categories. Consider reallocating to high-spending areas.`,
      priority: 'medium'
    });
  }

  // Find optimal categories
  const optimal = budgetData.filter(item => item.efficiency_status === 'optimal');
  if (optimal.length > 0) {
    recommendations.push({
      type: 'success',
      title: 'Well-Managed Categories',
      message: `Great job! You're efficiently managing ${optimal.length} budget categories within optimal spending ranges.`,
      priority: 'low'
    });
  }

  return recommendations;
};

// Get comprehensive financial overview
const getFinancialOverview = async (req, res) => {
  const userId = req.user.userId;
  const { timeframe = 'current_year' } = req.query;

  try {
    let dateFilter = '';
    if (timeframe === 'current_year') {
      dateFilter = `AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    } else if (timeframe === 'last_year') {
      dateFilter = `AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1`;
    } else if (timeframe === 'last_6_months') {
      dateFilter = `AND date >= CURRENT_DATE - INTERVAL '6 months'`;
    }

    // Get income and expense totals
    const summaryQuery = `
      SELECT 
        type,
        SUM(amount) as total,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount
      FROM transactions 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY type
    `;

    const summaryResult = await pool.query(summaryQuery, [userId]);

    const income = summaryResult.rows.find(row => row.type === 'income') || { total: 0, transaction_count: 0, avg_amount: 0 };
    const expenses = summaryResult.rows.find(row => row.type === 'expense') || { total: 0, transaction_count: 0, avg_amount: 0 };
    
    const netSavings = parseFloat(income.total) - parseFloat(expenses.total);
    const savingsRate = parseFloat(income.total) > 0 ? (netSavings / parseFloat(income.total)) * 100 : 0;

    // Get current budget efficiency
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const budgetQuery = `
      SELECT 
        SUM(b.limit_amount) as total_budget,
        SUM(COALESCE(spent.actual_spent, 0)) as total_spent
      FROM budgets b
      LEFT JOIN (
        SELECT 
          category,
          SUM(amount) as actual_spent
        FROM transactions 
        WHERE user_id = $1 AND type = 'expense' 
          AND EXTRACT(MONTH FROM date) = $2 
          AND EXTRACT(YEAR FROM date) = $3
        GROUP BY category
      ) spent ON b.category = spent.category
      WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
    `;

    const budgetResult = await pool.query(budgetQuery, [userId, currentMonth, currentYear]);
    const budgetData = budgetResult.rows[0];
    const budgetEfficiency = budgetData.total_budget > 0 ? 
      ((budgetData.total_budget - budgetData.total_spent) / budgetData.total_budget) * 100 : 0;

    res.json({
      timeframe,
      summary: {
        totalIncome: parseFloat(income.total),
        totalExpenses: parseFloat(expenses.total),
        netSavings,
        savingsRate: Math.round(savingsRate * 100) / 100,
        incomeTransactions: parseInt(income.transaction_count),
        expenseTransactions: parseInt(expenses.transaction_count)
      },
      currentBudget: {
        totalBudget: parseFloat(budgetData.total_budget || 0),
        totalSpent: parseFloat(budgetData.total_spent || 0),
        remaining: parseFloat(budgetData.total_budget || 0) - parseFloat(budgetData.total_spent || 0),
        efficiency: Math.round(budgetEfficiency * 100) / 100
      },
      insights: {
        primaryIncomeSource: parseFloat(income.avg_amount) > 1000 ? 'Regular salary/income' : 'Variable income',
        spendingPattern: parseFloat(expenses.avg_amount) > 500 ? 'Large transactions' : 'Frequent small purchases',
        financialHealth: savingsRate > 20 ? 'Excellent' : savingsRate > 10 ? 'Good' : savingsRate > 0 ? 'Fair' : 'Needs improvement'
      }
    });

  } catch (error) {
    console.error('Error getting financial overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCategorySpendingAnalysis,
  getBudgetVsActualAnalysis,
  getSpendingTrends,
  getBudgetEfficiencyReport,
  getFinancialOverview
};