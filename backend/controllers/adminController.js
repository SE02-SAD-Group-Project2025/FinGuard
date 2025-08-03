const pool = require('../db');
 // Adjust path if your db file is elsewhere

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, role, is_banned 
      FROM users 
      ORDER BY id
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.banOrUnbanUser = async (req, res) => {
  const userId = req.params.id;
  const { is_banned } = req.body;

  if (typeof is_banned !== 'boolean') {
    return res.status(400).json({ error: 'is_banned must be a boolean (true or false)' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING id, username, is_banned',
      [is_banned, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${is_banned ? 'banned' : 'unbanned'} successfully`, user: result.rows[0] });
  } catch (error) {
    console.error('Error banning/unbanning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const allowedRoles = ['User', 'Admin', 'Premium User'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User role updated to ${role}`, user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT logs.id, logs.activity, logs.timestamp, users.username
      FROM logs
      LEFT JOIN users ON logs.user_id = users.id
      ORDER BY logs.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch all categories
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add a new category
exports.addCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Category name is required and must be a string.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM categories WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Category already exists.' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    res.status(201).json({ message: 'Category added', category: result.rows[0] });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a category name
exports.updateCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Valid category name is required.' });
  }

  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name',
      [name, categoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated', category: result.rows[0] });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id, name',
      [categoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted', category: result.rows[0] });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
