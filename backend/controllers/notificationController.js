const pool = require('../db');
const { sendBillReminderEmail } = require('../utils/emailService');

// Create a new notification
const createNotification = async (userId, type, title, message, priority = 'medium', data = null) => {
  try {
    const result = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, priority, data, created_at, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
      RETURNING *
    `, [userId, type, title, message, priority, data ? JSON.stringify(data) : null]);
    
    console.log(`📱 Notification created: ${title} for user ${userId}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
};

// Create budget overflow notification
const createBudgetOverflowNotification = async (userId, category, amount, limit, overflowAmount) => {
  const title = '🚨 Budget Exceeded!';
  const message = `Your ${category} budget has exceeded its limit of LKR ${limit.toFixed(2)} by LKR ${overflowAmount.toFixed(2)}. Transfer budget or review your spending.`;
  
  return await createNotification(userId, 'budget_overflow', title, message, 'high', {
    category,
    amount,
    limit,
    overflowAmount,
    actionRequired: true
  });
};

// Create budget transfer notification
const createBudgetTransferNotification = async (userId, fromCategory, toCategory, transferAmount, reason) => {
  const title = '✅ Budget Transfer Completed';
  const message = `Successfully transferred LKR ${transferAmount.toFixed(2)} from ${fromCategory} to ${toCategory}. ${reason || ''}`;
  
  return await createNotification(userId, 'budget_transfer', title, message, 'medium', {
    fromCategory,
    toCategory,
    transferAmount,
    reason
  });
};

// Send bill reminder notifications
const sendBillReminders = async (req, res) => {
  try {
    console.log('🔔 Starting bill reminder notifications...');
    
    // Get all users with bills due in the next 7 days or overdue
    const result = await pool.query(`
      SELECT 
        br.id as bill_id,
        br.name as bill_name,
        br.amount,
        br.due_date,
        br.category,
        br.description,
        br.reminder_days,
        u.id as user_id,
        u.email,
        u.username,
        CASE 
          WHEN br.due_date < CURRENT_DATE THEN 'overdue'
          WHEN br.due_date <= CURRENT_DATE + INTERVAL '1 day' THEN 'urgent'
          ELSE 'reminder'
        END as urgency_level,
        (br.due_date - CURRENT_DATE) as days_until_due
      FROM bill_reminders br
      JOIN users u ON br.user_id = u.id
      WHERE 
        (br.status IS NULL OR br.status != 'paid')
        AND (
          br.due_date <= CURRENT_DATE + INTERVAL '7 days'
          OR br.due_date < CURRENT_DATE
        )
        AND u.email IS NOT NULL
        AND u.email != ''
      ORDER BY br.due_date ASC, u.username ASC
    `);

    if (result.rows.length === 0) {
      console.log('✅ No bill reminders to send');
      return res.json({ 
        success: true, 
        message: 'No bill reminders to send',
        remindersSent: 0 
      });
    }

    console.log(`📧 Found ${result.rows.length} bill reminders to send`);

    let emailsSent = 0;
    let emailsFailed = 0;
    const results = [];

    // Send emails for each bill reminder
    for (const row of result.rows) {
      try {
        console.log(`📤 Sending reminder for ${row.bill_name} to ${row.email}`);
        
        await sendBillReminderEmail(row.email, row.username, {
          name: row.bill_name,
          amount: parseFloat(row.amount),
          dueDate: row.due_date,
          category: row.category,
          description: row.description
        });

        // Log the notification in the database
        await pool.query(`
          INSERT INTO logs (user_id, activity, details)
          VALUES ($1, $2, $3)
        `, [
          row.user_id,
          'Bill reminder email sent',
          JSON.stringify({
            bill_id: row.bill_id,
            bill_name: row.bill_name,
            amount: parseFloat(row.amount),
            due_date: row.due_date,
            urgency_level: row.urgency_level,
            email_sent_to: row.email
          })
        ]);

        emailsSent++;
        results.push({
          success: true,
          user: row.username,
          email: row.email,
          bill: row.bill_name,
          urgency: row.urgency_level
        });

        console.log(`✅ Reminder sent successfully to ${row.email}`);

      } catch (emailError) {
        console.error(`❌ Failed to send reminder to ${row.email}:`, emailError.message);
        emailsFailed++;
        results.push({
          success: false,
          user: row.username,
          email: row.email,
          bill: row.bill_name,
          error: emailError.message
        });
      }
    }

    console.log(`🎯 Bill reminder summary: ${emailsSent} sent, ${emailsFailed} failed`);

    res.json({
      success: true,
      message: `Bill reminder notifications processed`,
      remindersSent: emailsSent,
      remindersFailed: emailsFailed,
      totalProcessed: result.rows.length,
      results: results
    });

  } catch (error) {
    console.error('❌ Bill reminder notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bill reminder notifications',
      error: error.message
    });
  }
};

// Get upcoming bills for a specific user (for dashboard notifications)
const getUserUpcomingBills = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT 
        id,
        name,
        amount,
        due_date,
        category,
        description,
        reminder_days,
        status,
        CASE 
          WHEN due_date < CURRENT_DATE THEN 'overdue'
          WHEN due_date <= CURRENT_DATE + INTERVAL '1 day' THEN 'urgent'
          WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
          ELSE 'future'
        END as urgency_level,
        (due_date - CURRENT_DATE) as days_until_due
      FROM bill_reminders
      WHERE user_id = $1
        AND (status IS NULL OR status != 'paid')
        AND due_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY due_date ASC
      LIMIT 10
    `, [userId]);

    const bills = result.rows.map(bill => ({
      id: bill.id,
      name: bill.name,
      amount: parseFloat(bill.amount),
      dueDate: bill.due_date,
      category: bill.category,
      description: bill.description,
      urgencyLevel: bill.urgency_level,
      daysUntilDue: parseInt(bill.days_until_due) || 0,
      status: bill.status
    }));

    res.json({
      success: true,
      upcomingBills: bills,
      overdueBills: bills.filter(b => b.urgencyLevel === 'overdue'),
      urgentBills: bills.filter(b => b.urgencyLevel === 'urgent'),
      upcomingCount: bills.filter(b => b.urgencyLevel === 'upcoming').length
    });

  } catch (error) {
    console.error('Error fetching user upcoming bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming bills',
      error: error.message
    });
  }
};

// Manual trigger for bill reminders (admin only)
const triggerBillReminders = async (req, res) => {
  try {
    // This would typically be restricted to admin users
    console.log('🔧 Manual trigger for bill reminders initiated');
    await sendBillReminders(req, res);
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger bill reminders',
      error: error.message
    });
  }
};

module.exports = {
  sendBillReminders,
  getUserUpcomingBills,
  triggerBillReminders,
  createNotification,
  createBudgetOverflowNotification,
  createBudgetTransferNotification
};