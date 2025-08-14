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
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    const billId = req.params.id;
    const { recordAsExpense = true, paymentDate } = req.body;

    await client.query('BEGIN');

    // Get bill details before marking as paid
    const billQuery = await client.query(`
      SELECT * FROM bill_reminders 
      WHERE id = $1 AND user_id = $2
    `, [billId, userId]);

    if (billQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Bill not found or not authorized' });
    }

    const bill = billQuery.rows[0];

    // Mark bill as paid
    const result = await client.query(`
      UPDATE bill_reminders 
      SET status = 'paid', paid_date = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [paymentDate || new Date(), billId, userId]);

    const paidBill = result.rows[0];

    // Record as expense transaction if requested
    if (recordAsExpense) {
      await client.query(`
        INSERT INTO transactions (
          user_id, 
          type, 
          amount, 
          category, 
          description, 
          date, 
          source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId,
        'expense',
        parseFloat(bill.amount),
        bill.category || 'Bills & Utilities',
        `Bill Payment: ${bill.name}${bill.description ? ` - ${bill.description}` : ''}`,
        paymentDate || new Date(),
        'bill_payment'
      ]);

      console.log(`💸 Bill payment recorded as expense: ${bill.name} - Rs.${bill.amount}`);
    }

    // Update liability if this bill is connected to a liability
    try {
      // Enhanced liability matching with category mapping
      const liabilityQuery = await client.query(`
        SELECT id, name, type FROM liabilities 
        WHERE user_id = $1 
          AND current_balance > 0
          AND (
            -- Direct name matching
            LOWER(name) = LOWER($2) 
            OR LOWER(creditor) = LOWER($2)
            OR LOWER(name) LIKE LOWER($3)
            OR LOWER(creditor) LIKE LOWER($3)
            -- Category-based matching
            OR (
              $4 IN ('Bills & Utilities', 'Phone & Internet', 'Subscriptions') 
              AND LOWER(name) LIKE '%credit%'
            )
            OR (
              $4 = 'Transportation' 
              AND (LOWER(name) LIKE '%car%' OR LOWER(name) LIKE '%vehicle%' OR LOWER(name) LIKE '%auto%')
            )
            OR (
              $4 = 'Utilities' 
              AND (LOWER(name) LIKE '%utility%' OR LOWER(name) LIKE '%electric%' OR LOWER(name) LIKE '%water%')
            )
            OR (
              $4 = 'Insurance' 
              AND LOWER(name) LIKE '%insurance%'
            )
            OR (
              $4 = 'Healthcare'
              AND (LOWER(name) LIKE '%medical%' OR LOWER(name) LIKE '%health%')
            )
            -- Generic loan/debt matching
            OR (
              $2 ILIKE '%loan%' OR $2 ILIKE '%payment%'
              AND (type = 'Personal Loan' OR type = 'Mortgage' OR type = 'Personal Debt')
            )
          )
        ORDER BY 
          CASE 
            WHEN LOWER(name) = LOWER($2) THEN 1
            WHEN LOWER(creditor) = LOWER($2) THEN 2
            WHEN LOWER(name) LIKE LOWER($3) THEN 3
            WHEN LOWER(creditor) LIKE LOWER($3) THEN 4
            ELSE 5
          END
        LIMIT 1
      `, [userId, bill.name, `%${bill.name}%`, bill.category]);

      if (liabilityQuery.rows.length > 0) {
        const liabilityId = liabilityQuery.rows[0].id;
        
        // Record liability payment
        await client.query(`
          INSERT INTO liability_payments (
            liability_id,
            user_id,
            amount,
            payment_date,
            payment_type,
            description
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          liabilityId,
          userId,
          parseFloat(bill.amount),
          paymentDate || new Date(),
          'bill_payment',
          `Automatic payment from bill: ${bill.name}`
        ]);

        // Update liability balance
        await client.query(`
          UPDATE liabilities 
          SET current_balance = GREATEST(0, current_balance - $1),
              updated_at = NOW()
          WHERE id = $2
        `, [parseFloat(bill.amount), liabilityId]);

        console.log(`🏦 Updated liability: "${liabilityQuery.rows[0].name}" (${liabilityQuery.rows[0].type}) - matched with bill: "${bill.name}" (${bill.category})`);
      }
    } catch (liabilityError) {
      console.log('ℹ️ No matching liability found for bill:', bill.name);
    }

    // Log bill payment
    try {
      await client.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Bill marked as paid', JSON.stringify({
          bill_id: billId,
          name: paidBill.name,
          amount: parseFloat(paidBill.amount),
          paid_date: paidBill.paid_date,
          recorded_as_expense: recordAsExpense,
          liability_updated: true
        })]
      );
    } catch (logErr) {
      console.error('Failed to log bill payment:', logErr);
    }

    await client.query('COMMIT');

    res.json({ 
      message: 'Bill marked as paid successfully', 
      bill: paidBill,
      expenseRecorded: recordAsExpense,
      liabilityUpdated: true
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('MARK BILL PAID ERROR:', err.message);
    res.status(500).json({ error: 'Failed to mark bill as paid' });
  } finally {
    client.release();
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