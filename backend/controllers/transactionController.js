const db = require('../db'); // ✅ Import db at the top

const getTransactions = async (req, res) => {
  const userId = req.user.userId;
  const { type, month, year } = req.query;

  try {
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];
    let index = 2;

    if (type) {
      query += ` AND type = $${index}`;
      params.push(type);
      index++;
    }

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $${index}`;
      params.push(month);
      index++;

      query += ` AND EXTRACT(YEAR FROM date) = $${index}`;
      params.push(year);
    }

    query += ' ORDER BY date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("🔴 DB QUERY ERROR:", err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const addTransaction = async (req, res) => {
  const userId = req.user.userId;
  const { type, amount, date, description, category } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO transactions (user_id, type, amount, date, description, category) VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP), $5, $6) RETURNING *',
      [userId, type, amount, date || null, description || null, category || 'uncategorized']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔴 ADD TRANSACTION ERROR:", err.message);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

module.exports = {
  addTransaction,
  getTransactions
};
