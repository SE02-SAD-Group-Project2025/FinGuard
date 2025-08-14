const db = require('../db');

// Get user's merchant category rules
const getMerchantRules = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(`
      SELECT 
        id,
        merchant_name,
        category,
        confidence_score,
        COALESCE(transaction_count, times_used, 0) as transaction_count,
        created_at,
        updated_at
      FROM merchant_category_rules 
      WHERE user_id = $1 
      ORDER BY COALESCE(transaction_count, times_used, 0) DESC, merchant_name ASC
    `, [userId]);

    res.json({
      success: true,
      rules: result.rows
    });
  } catch (error) {
    console.error('Error fetching merchant rules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching merchant rules',
      error: error.message
    });
  }
};

// Create or update merchant category rule
const createOrUpdateMerchantRule = async (req, res) => {
  const userId = req.user.userId;
  const { merchantName, category, confidenceScore = 1.0 } = req.body;

  if (!merchantName || !category) {
    return res.status(400).json({
      success: false,
      message: 'Merchant name and category are required'
    });
  }

  try {
    // Check if rule already exists
    const existingRule = await db.query(`
      SELECT id FROM merchant_category_rules 
      WHERE user_id = $1 AND merchant_name = $2
    `, [userId, merchantName]);

    let result;
    if (existingRule.rows.length > 0) {
      // Update existing rule
      result = await db.query(`
        UPDATE merchant_category_rules 
        SET category = $1, confidence_score = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3 AND merchant_name = $4
        RETURNING *
      `, [category, confidenceScore, userId, merchantName]);
    } else {
      // Create new rule
      result = await db.query(`
        INSERT INTO merchant_category_rules 
        (user_id, merchant_name, category, confidence_score, transaction_count)
        VALUES ($1, $2, $3, $4, 0)
        RETURNING *
      `, [userId, merchantName, category, confidenceScore]);
    }

    // Apply the rule to existing transactions
    await applyRuleToExistingTransactions(userId, merchantName, category);

    res.json({
      success: true,
      message: 'Merchant rule created/updated successfully',
      rule: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating/updating merchant rule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating merchant rule',
      error: error.message
    });
  }
};

// Delete merchant category rule
const deleteMerchantRule = async (req, res) => {
  const userId = req.user.userId;
  const { ruleId } = req.params;

  try {
    const result = await db.query(`
      DELETE FROM merchant_category_rules 
      WHERE id = $1 AND user_id = $2
      RETURNING merchant_name
    `, [ruleId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Merchant rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Merchant rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting merchant rule:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting merchant rule',
      error: error.message
    });
  }
};

// Get recurring transactions analysis
const getRecurringTransactions = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(`
      SELECT 
        description,
        category,
        COUNT(*) as frequency,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount,
        MIN(date) as first_seen,
        MAX(date) as last_seen,
        ARRAY_AGG(DISTINCT EXTRACT(DAY FROM date)::int ORDER BY EXTRACT(DAY FROM date)::int) as days_of_month
      FROM transactions 
      WHERE user_id = $1 
        AND type = 'expense'
        AND date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY description, category
      HAVING COUNT(*) >= 3
      ORDER BY frequency DESC, avg_amount DESC
      LIMIT 20
    `, [userId]);

    const recurringTransactions = result.rows.map(row => {
      const frequency = parseInt(row.frequency);
      const avgAmount = parseFloat(row.avg_amount);
      const daysSinceFirst = Math.ceil((new Date() - new Date(row.first_seen)) / (1000 * 60 * 60 * 24));
      const avgDaysBetween = daysSinceFirst / frequency;
      
      // Calculate confidence based on regularity
      let confidence = 0.5;
      if (frequency >= 5) confidence += 0.2;
      if (avgDaysBetween <= 31) confidence += 0.2; // Monthly or more frequent
      if (row.min_amount === row.max_amount) confidence += 0.1; // Same amount each time
      
      return {
        description: row.description,
        category: row.category,
        frequency,
        avgAmount,
        minAmount: parseFloat(row.min_amount),
        maxAmount: parseFloat(row.max_amount),
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
        daysOfMonth: row.days_of_month,
        avgDaysBetween: Math.round(avgDaysBetween),
        confidence: Math.min(1.0, confidence),
        nextExpected: {
          date: new Date(new Date(row.last_seen).getTime() + avgDaysBetween * 24 * 60 * 60 * 1000),
          estimatedAmount: avgAmount
        }
      };
    });

    res.json({
      success: true,
      recurringTransactions
    });
  } catch (error) {
    console.error('Error analyzing recurring transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing recurring transactions',
      error: error.message
    });
  }
};

// Get auto-categorization statistics
const getCategorizationStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [totalTransactions, categorizedTransactions, rulesCount, recentlyCategorized] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM transactions WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*) as categorized FROM transactions WHERE user_id = $1 AND category IS NOT NULL', [userId]),
      db.query('SELECT COUNT(*) as rules FROM merchant_category_rules WHERE user_id = $1', [userId]),
      db.query(`
        SELECT COUNT(*) as recent 
        FROM transactions 
        WHERE user_id = $1 
          AND category IS NOT NULL 
          AND date >= CURRENT_DATE - INTERVAL '30 days'
      `, [userId])
    ]);

    const total = parseInt(totalTransactions.rows[0].total);
    const categorized = parseInt(categorizedTransactions.rows[0].categorized);
    const categorizationRate = total > 0 ? (categorized / total * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalTransactions: total,
        categorizedTransactions: categorized,
        categorizationRate: Math.round(categorizationRate * 10) / 10,
        rulesCount: parseInt(rulesCount.rows[0].rules),
        recentlyCategorized: parseInt(recentlyCategorized.rows[0].recent)
      }
    });
  } catch (error) {
    console.error('Error fetching categorization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categorization stats',
      error: error.message
    });
  }
};

// Auto-categorize transactions based on merchant rules
const autoCategorizeTransactions = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get all merchant rules for this user
    const rules = await db.query(`
      SELECT merchant_name, category 
      FROM merchant_category_rules 
      WHERE user_id = $1
    `, [userId]);

    let totalCategorized = 0;

    // Apply each rule to uncategorized transactions
    for (const rule of rules.rows) {
      const result = await db.query(`
        UPDATE transactions 
        SET category = $1 
        WHERE user_id = $2 
          AND (category IS NULL OR category = 'Other')
          AND (description ILIKE $3 OR description ILIKE $4)
      `, [
        rule.category, 
        userId, 
        `%${rule.merchant_name}%`,
        `%${rule.merchant_name.toLowerCase()}%`
      ]);

      totalCategorized += result.rowCount;

      // Update transaction count for the rule
      await db.query(`
        UPDATE merchant_category_rules 
        SET transaction_count = transaction_count + $1
        WHERE user_id = $2 AND merchant_name = $3
      `, [result.rowCount, userId, rule.merchant_name]);
    }

    res.json({
      success: true,
      message: `Successfully categorized ${totalCategorized} transactions`,
      categorizedCount: totalCategorized
    });
  } catch (error) {
    console.error('Error auto-categorizing transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-categorizing transactions',
      error: error.message
    });
  }
};

// Helper function to apply rule to existing transactions
const applyRuleToExistingTransactions = async (userId, merchantName, category) => {
  try {
    const result = await db.query(`
      UPDATE transactions 
      SET category = $1 
      WHERE user_id = $2 
        AND (description ILIKE $3 OR description ILIKE $4)
        AND (category IS NULL OR category = 'Other')
    `, [category, userId, `%${merchantName}%`, `%${merchantName.toLowerCase()}%`]);

    // Update transaction count for the rule
    if (result.rowCount > 0) {
      await db.query(`
        UPDATE merchant_category_rules 
        SET transaction_count = transaction_count + $1
        WHERE user_id = $2 AND merchant_name = $3
      `, [result.rowCount, userId, merchantName]);
    }

    return result.rowCount;
  } catch (error) {
    console.error('Error applying rule to existing transactions:', error);
    return 0;
  }
};

module.exports = {
  getMerchantRules,
  createOrUpdateMerchantRule,
  deleteMerchantRule,
  getRecurringTransactions,
  getCategorizationStats,
  autoCategorizeTransactions
};