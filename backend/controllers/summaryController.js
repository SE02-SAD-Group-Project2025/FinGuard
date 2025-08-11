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

module.exports = { 
  getMonthlySummary,
  getFinancialHealth 
};