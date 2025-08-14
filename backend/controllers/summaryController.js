const db = require('../db');

const getMonthlySummary = async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    const incomeResult = await db.query(
      `SELECT SUM(amount) AS total_income
       FROM transactions
       WHERE user_id = $1 AND type = 'income'
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
      [userId, month, year]
    );

    const expenseResult = await db.query(
      `SELECT SUM(amount) AS total_expenses
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
      [userId, month, year]
    );

    const income = parseFloat(incomeResult.rows[0].total_income) || 0;
    const expenses = parseFloat(expenseResult.rows[0].total_expenses) || 0;

    res.json({
      income,
      expenses,
      balance: income - expenses
    });
  } catch (err) {
    console.error('🔴 MONTHLY SUMMARY ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

// Get comprehensive financial health data
const getFinancialHealth = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get current month/year for calculations
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get monthly income for current month
    const incomeResult = await db.query(`
      SELECT SUM(amount) AS total_income
      FROM transactions
      WHERE user_id = $1 AND type = 'income'
      AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    // Get monthly expenses for current month
    const expenseResult = await db.query(`
      SELECT SUM(amount) AS total_expenses
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    // Get total savings (approximation: all income - expenses over time)
    const savingsResult = await db.query(`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'income') -
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'expense') AS total_savings
    `, [userId]);

    // Get total liabilities/debts (using actual column names)
    const liabilitiesResult = await db.query(`
      SELECT SUM(current_balance) AS total_debt
      FROM liabilities
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

    // Get monthly debt payments (using minimum_payment)
    const debtPaymentsResult = await db.query(`
      SELECT SUM(minimum_payment) AS monthly_debt_payments
      FROM liabilities
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

    // Get budget performance
    const budgetResult = await db.query(`
      SELECT 
        b.category,
        b.limit_amount as budget,
        COALESCE(
          (SELECT SUM(amount) 
           FROM transactions t 
           WHERE t.user_id = $1 AND t.type = 'expense' AND t.category = b.category
           AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3), 0
        ) as spent
      FROM budgets b
      WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
    `, [userId, currentMonth, currentYear]);

    // Calculate values with proper null handling
    const monthlyIncome = parseFloat(incomeResult.rows[0]?.total_income || '0') || 0;
    const monthlyExpenses = parseFloat(expenseResult.rows[0]?.total_expenses || '0') || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const emergencyFund = Math.max(parseFloat(savingsResult.rows[0]?.total_savings || '0') || 0, 0);
    const totalDebt = parseFloat(liabilitiesResult.rows[0]?.total_debt || '0') || 0;
    const monthlyDebtPayments = parseFloat(debtPaymentsResult.rows[0]?.monthly_debt_payments || '0') || 0;

    // Format budget items with null safety
    const budgetItems = budgetResult.rows.map(row => ({
      category: row.category || 'Unknown',
      budget: parseFloat(row.budget || '0') || 0,
      spent: parseFloat(row.spent || '0') || 0
    }));

    // Mock investment types and goals (these would need separate tables in a real system)
    const investmentTypes = Math.min(Math.floor(emergencyFund / 50000), 5); // Rough estimate
    
    const financialGoals = [
      { 
        name: 'Emergency Fund', 
        progress: (monthlyExpenses > 0) ? Math.min((emergencyFund / (monthlyExpenses * 6)) * 100, 100) : 0
      },
      { 
        name: 'Debt Reduction', 
        progress: (totalDebt > 0 && monthlyIncome > 0) ? Math.max(100 - ((totalDebt / monthlyIncome) * 10), 0) : 100
      },
      { 
        name: 'Savings Rate', 
        progress: (monthlyIncome > 0) ? Math.min((monthlySavings / monthlyIncome) * 100 * 5, 100) : 0
      }
    ];

    res.json({
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      emergencyFund,
      monthlyDebtPayments,
      investmentTypes,
      budgetItems,
      financialGoals,
      totalDebt
    });

  } catch (err) {
    console.error('🔴 FINANCIAL HEALTH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch financial health data' });
  }
};

// Get dashboard overview data
const getDashboardOverview = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get total income
    const totalIncomeResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_income
      FROM transactions
      WHERE user_id = $1 AND type = 'income'
    `, [userId]);

    // Get total expenses
    const totalExpensesResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
    `, [userId]);

    // Get transaction count
    const transactionCountResult = await db.query(`
      SELECT COUNT(*) AS transaction_count
      FROM transactions
      WHERE user_id = $1
    `, [userId]);

    // Get budget count
    const budgetCountResult = await db.query(`
      SELECT COUNT(*) AS budget_count
      FROM budgets
      WHERE user_id = $1
    `, [userId]);

    const totalIncome = parseFloat(totalIncomeResult.rows[0].total_income) || 0;
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].total_expenses) || 0;
    const transactionCount = parseInt(transactionCountResult.rows[0].transaction_count) || 0;
    const budgetCount = parseInt(budgetCountResult.rows[0].budget_count) || 0;

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount,
      budgetCount,
      status: 'Dashboard Overview Working!'
    });

  } catch (err) {
    console.error('❌ Dashboard overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
};

// Get recent transactions
const getRecentTransactions = async (req, res) => {
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await db.query(`
      SELECT id, type, amount, category, description, date
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT $2
    `, [userId, limit]);

    res.json(result.rows);

  } catch (err) {
    console.error('❌ Recent transactions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
};

module.exports = { 
  getMonthlySummary,
  getFinancialHealth,
  getDashboardOverview,
  getRecentTransactions
};