const pool = require('../db');

// Get user's bills
const getBills = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT * FROM bill_reminders 
      WHERE user_id = $1 
      ORDER BY due_date ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('GET BILLS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
};

// Add new bill
const addBill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      name, 
      amount, 
      dueDate, 
      frequency, 
      category, 
      reminderDays, 
      isRecurring, 
      description 
    } = req.body;

    if (!name || !amount || !dueDate) {
      return res.status(400).json({ error: 'Name, amount, and due date are required' });
    }

    const result = await pool.query(`
      INSERT INTO bill_reminders (
        user_id, name, amount, due_date, frequency, 
        category, reminder_days, is_recurring, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [userId, name, amount, dueDate, frequency || 'monthly', 
        category || 'Bills & Utilities', reminderDays || 3, 
        isRecurring !== false, description || '']);

    const newBill = result.rows[0];

    // Log bill creation
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Bill reminder created', JSON.stringify({
          bill_id: newBill.id,
          name: newBill.name,
          amount: parseFloat(newBill.amount),
          due_date: newBill.due_date,
          frequency: newBill.frequency,
          is_recurring: newBill.is_recurring
        })]
      );
    } catch (logErr) {
      console.error('Failed to log bill creation:', logErr);
    }

    res.status(201).json(newBill);
  } catch (err) {
    console.error('ADD BILL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add bill' });
  }
};

// Update bill
const updateBill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const billId = req.params.id;
    const { 
      name, 
      amount, 
      dueDate, 
      frequency, 
      category, 
      reminderDays, 
      isRecurring, 
      description 
    } = req.body;

    if (!name || !amount || !dueDate) {
      return res.status(400).json({ error: 'Name, amount, and due date are required' });
    }

    const result = await pool.query(`
      UPDATE bill_reminders 
      SET name = $1, amount = $2, due_date = $3, frequency = $4,
          category = $5, reminder_days = $6, is_recurring = $7, 
          description = $8, updated_at = NOW()
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `, [name, amount, dueDate, frequency, category, reminderDays, 
        isRecurring, description, billId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or not authorized' });
    }

    const updatedBill = result.rows[0];

    // Log bill update
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Bill reminder updated', JSON.stringify({
          bill_id: billId,
          name: updatedBill.name,
          amount: parseFloat(updatedBill.amount),
          due_date: updatedBill.due_date
        })]
      );
    } catch (logErr) {
      console.error('Failed to log bill update:', logErr);
    }

    res.json(updatedBill);
  } catch (err) {
    console.error('UPDATE BILL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update bill' });
  }
};

// Delete bill
const deleteBill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const billId = req.params.id;

    const result = await pool.query(
      'DELETE FROM bill_reminders WHERE id = $1 AND user_id = $2 RETURNING *',
      [billId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or not authorized' });
    }

    const deletedBill = result.rows[0];

    // Log bill deletion
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Bill reminder deleted', JSON.stringify({
          deleted_bill_id: billId,
          name: deletedBill.name,
          amount: parseFloat(deletedBill.amount)
        })]
      );
    } catch (logErr) {
      console.error('Failed to log bill deletion:', logErr);
    }

    res.json({ message: 'Bill deleted successfully', bill: deletedBill });
  } catch (err) {
    console.error('DELETE BILL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
};

// Mark bill as paid
const markBillPaid = async (req, res) => {
  try {
    const userId = req.user.userId;
    const billId = req.params.id;

    const result = await pool.query(`
      UPDATE bill_reminders 
      SET status = 'paid', paid_date = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [billId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or not authorized' });
    }

    const paidBill = result.rows[0];

    // Log bill payment
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Bill marked as paid', JSON.stringify({
          bill_id: billId,
          name: paidBill.name,
          amount: parseFloat(paidBill.amount),
          paid_date: paidBill.paid_date
        })]
      );
    } catch (logErr) {
      console.error('Failed to log bill payment:', logErr);
    }

    res.json({ message: 'Bill marked as paid', bill: paidBill });
  } catch (err) {
    console.error('MARK BILL PAID ERROR:', err.message);
    res.status(500).json({ error: 'Failed to mark bill as paid' });
  }
};

// Get upcoming bills for notifications
const getUpcomingBills = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const result = await pool.query(`
      SELECT 
        id,
        name,
        amount,
        due_date as "dueDate",
        category,
        reminder_days,
        is_recurring,
        status
      FROM bill_reminders 
      WHERE user_id = $1 
        AND due_date BETWEEN $2 AND $3
        AND (status IS NULL OR status != 'paid')
      ORDER BY due_date ASC
    `, [userId, today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]]);

    res.json(result.rows);
  } catch (err) {
    console.error('GET UPCOMING BILLS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch upcoming bills' });
  }
};

module.exports = {
  getBills,
  addBill,
  updateBill,
  deleteBill,
  markBillPaid,
  getUpcomingBills
};