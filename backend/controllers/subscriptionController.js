// controllers/subscriptionController.js
const pool = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Get all available subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    // Return hardcoded plans (3 separate plans)
    const transformedPlans = [
      {
        id: 1,
        name: 'free',
        display_name: 'Regular User',
        description: 'Basic financial tracking features',
        price: 0,
        billing_cycle: 'lifetime',
        max_family_members: 1,
        features: ["Basic Transaction Tracking", "Simple Budget Management", "Basic Reports", "Email Support"],
        is_active: true
      },
      {
        id: 2, 
        name: 'premium_monthly',
        display_name: 'Premium Monthly',
        description: 'All premium features including family management',
        price: 999,
        billing_cycle: 'monthly',
        max_family_members: 5,
        features: ["Advanced Analytics", "Budget Transfers", "Export Reports", "Priority Support", "AI Insights", "Custom Categories", "Advanced Reports", "Family Management (Up to 5 members)"],
        is_active: true
      },
      {
        id: 3, 
        name: 'premium_yearly',
        display_name: 'Premium Yearly',
        description: 'All premium features including family management (17% savings!)',
        price: 10000,
        billing_cycle: 'yearly',
        max_family_members: 5,
        features: ["Advanced Analytics", "Budget Transfers", "Export Reports", "Priority Support", "AI Insights", "Custom Categories", "Advanced Reports", "Family Management (Up to 5 members)"],
        is_active: true
      }
    ];

    res.json({
      success: true,
      plans: transformedPlans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

// Get current user subscription details
exports.getUserSubscription = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Check if user is premium
    const userResult = await pool.query('SELECT is_premium FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.is_premium) {
      // User is on free plan
      return res.json({
        success: true,
        subscription: {
          plan_name: 'free',
          display_name: 'Regular User',
          status: 'active',
          billing: 'LKR 0.00/free',
          billing_cycle: 'lifetime',
          current_period_start: new Date(),
          current_period_end: new Date('2099-12-31'), // Far future for free plan
          auto_renew: false,
          features: ['Basic Transaction Tracking', 'Simple Budget Management', 'Basic Reports', 'Email Support']
        }
      });
    }

    // User is premium - create mock premium subscription data
    const premiumSubscription = {
      plan_name: 'premium',
      display_name: 'Premium User', 
      status: 'active',
      billing: 'LKR 999.00/monthly', // Default to monthly, could be yearly
      billing_cycle: 'monthly',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      auto_renew: true,
      features: [
        'Advanced Analytics',
        'Budget Transfers', 
        'Export Reports',
        'Priority Support',
        'AI Insights',
        'Custom Categories',
        'Advanced Reports',
        'Family Management (Up to 5 members)'
      ]
    };

    res.json({
      success: true,
      subscription: premiumSubscription
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
};

// Upgrade/change subscription plan
exports.upgradeSubscription = async (req, res) => {
  const userId = req.user.userId;
  const { planName, billingCycle = 'monthly' } = req.body;

  if (!planName || !['free', 'premium_monthly', 'premium_yearly'].includes(planName)) {
    return res.status(400).json({ error: 'Invalid plan name' });
  }

  if (!['monthly', 'yearly'].includes(billingCycle)) {
    return res.status(400).json({ error: 'Invalid billing cycle' });
  }

  try {
    // Get the new plan details (use hardcoded plans)
    let newPlan;
    if (planName === 'free') {
      newPlan = {
        id: 1,
        name: 'free',
        display_name: 'Regular User',
        price: 0,
        billing_cycle: 'lifetime',
        max_family_members: 1
      };
    } else if (planName === 'premium_monthly') {
      newPlan = {
        id: 2,
        name: 'premium_monthly',
        display_name: 'Premium Monthly',
        price: 999,
        billing_cycle: 'monthly',
        max_family_members: 5
      };
    } else if (planName === 'premium_yearly') {
      newPlan = {
        id: 3,
        name: 'premium_yearly',
        display_name: 'Premium Yearly',
        price: 10000,
        billing_cycle: 'yearly',
        max_family_members: 5
      };
    } else {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get current subscription
    const currentSubResult = await pool.query(`
      SELECT us.*, sp.name as current_plan_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
    `, [userId]);

    const currentPlan = currentSubResult.rows[0]?.current_plan_name || 'free';

    // Calculate new period end date
    const periodStart = new Date();
    const periodEnd = new Date();
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Deactivate current subscription if exists
      if (currentSubResult.rows.length > 0) {
        await pool.query(`
          UPDATE user_subscriptions 
          SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $1 AND status = 'active'
        `, [userId]);
      }

      // Create new subscription
      await pool.query(`
        INSERT INTO user_subscriptions 
        (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, auto_renew)
        VALUES ($1, $2, 'active', $3, $4, $5, true)
      `, [userId, newPlan.id, billingCycle, periodStart, periodEnd]);

      // Update user role based on plan - preserve Admin role
      const currentUserResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      const currentRole = currentUserResult.rows[0]?.role;
      
      let newRole = 'User';
      const isPremium = planName === 'premium_monthly' || planName === 'premium_yearly';
      
      // Preserve Admin role - Admins keep Admin role regardless of subscription
      if (currentRole === 'Admin') {
        newRole = 'Admin';
      } else if (isPremium) {
        newRole = 'Premium User';
      } else {
        newRole = 'User'; // Free plan
      }

      console.log(`🔄 Updating user role: ${currentRole} -> ${newRole}, is_premium: ${isPremium}`);
      
      await pool.query(`
        UPDATE users 
        SET role = $1, is_premium = $2
        WHERE id = $3
      `, [newRole, isPremium, userId]);

      // Log subscription history
      await pool.query(`
        INSERT INTO subscription_history (user_id, old_plan, new_plan, change_reason, changed_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, currentPlan, planName, 'User upgrade', userId]);

      // If downgrading from family plan, handle family members
      if (currentPlan === 'family' && planName !== 'family') {
        // Remove family member associations but keep their accounts
        await pool.query(`
          UPDATE users SET family_owner_id = NULL 
          WHERE family_owner_id = $1
        `, [userId]);

        await pool.query(`
          UPDATE family_members SET status = 'inactive' 
          WHERE family_owner_id = $1
        `, [userId]);
      }

      await pool.query('COMMIT');

      // Log successful upgrade
      try {
        await pool.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [userId, 'Subscription upgraded', JSON.stringify({
            old_plan: currentPlan,
            new_plan: planName,
            billing_cycle: billingCycle,
            amount: newPlan.price,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
      } catch (logErr) {
        console.error('Failed to log subscription upgrade:', logErr);
      }

      // Generate new JWT token with updated role
      const userResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [userId]);
      const updatedUser = userResult.rows[0];
      
      const newToken = jwt.sign(
        { 
          userId: updatedUser.id, 
          username: updatedUser.username, 
          email: updatedUser.email, 
          role: updatedUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: `Successfully upgraded to ${newPlan.display_name}`,
        subscription: {
          plan_name: planName,
          display_name: newPlan.display_name,
          billing_cycle: billingCycle,
          current_period_end: periodEnd,
          price: newPlan.price
        },
        newToken: newToken // Send new token to frontend
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  const userId = req.user.userId;
  const { reason } = req.body;

  try {
    // Get current subscription
    const result = await pool.query(`
      SELECT us.*, sp.name as plan_name, sp.display_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = result.rows[0];

    await pool.query('BEGIN');

    try {
      // Cancel subscription (but keep it active until period end)
      await pool.query(`
        UPDATE user_subscriptions 
        SET auto_renew = false, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND status = 'active'
      `, [userId]);

      // Log cancellation history
      await pool.query(`
        INSERT INTO subscription_history (user_id, old_plan, new_plan, change_reason, changed_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, subscription.plan_name, 'free', reason || 'User cancellation', userId]);

      await pool.query('COMMIT');

      // Log cancellation
      try {
        await pool.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [userId, 'Subscription cancelled', JSON.stringify({
            plan_name: subscription.plan_name,
            reason: reason,
            cancellation_date: new Date(),
            active_until: subscription.current_period_end,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
      } catch (logErr) {
        console.error('Failed to log subscription cancellation:', logErr);
      }

      res.json({
        success: true,
        message: `Subscription cancelled. You'll have access to ${subscription.display_name} until ${new Date(subscription.current_period_end).toLocaleDateString()}`,
        active_until: subscription.current_period_end
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get family members (family plan only)
exports.getFamilyMembers = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Check if user has family plan
    const subResult = await pool.query(`
      SELECT sp.name as plan_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
    `, [userId]);

    if (subResult.rows.length === 0 || subResult.rows[0].plan_name !== 'family') {
      return res.status(403).json({ error: 'Family plan required' });
    }

    const result = await pool.query(`
      SELECT 
        fm.id,
        fm.name,
        fm.email,
        fm.role,
        fm.monthly_budget,
        fm.status,
        fm.invited_at,
        fm.joined_at,
        u.username,
        u.profile_photo
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.family_owner_id = $1
      ORDER BY fm.role DESC, fm.name ASC
    `, [userId]);

    res.json({
      success: true,
      family_members: result.rows
    });

  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
};

// Invite family member
exports.inviteFamilyMember = async (req, res) => {
  const userId = req.user.userId;
  const { name, email, role = 'child', monthlyBudget = 0 } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  if (!['parent', 'child'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Check if user has family plan
    const subResult = await pool.query(`
      SELECT sp.name as plan_name, sp.max_family_members
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
    `, [userId]);

    if (subResult.rows.length === 0 || subResult.rows[0].plan_name !== 'family') {
      return res.status(403).json({ error: 'Family plan required' });
    }

    const maxMembers = subResult.rows[0].max_family_members;

    // Check current family member count
    const memberCountResult = await pool.query(`
      SELECT COUNT(*) as count FROM family_members 
      WHERE family_owner_id = $1 AND status != 'inactive'
    `, [userId]);

    if (parseInt(memberCountResult.rows[0].count) >= maxMembers) {
      return res.status(400).json({ 
        error: `Maximum ${maxMembers} family members allowed` 
      });
    }

    // Check if email already invited
    const existingResult = await pool.query(`
      SELECT id FROM family_members 
      WHERE family_owner_id = $1 AND email = $2 AND status != 'inactive'
    `, [userId, email]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already invited' });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Insert family member invitation
    const result = await pool.query(`
      INSERT INTO family_members 
      (family_owner_id, email, name, role, monthly_budget, invitation_token, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, name, email, role, monthly_budget, status, invited_at
    `, [userId, email, name, role, monthlyBudget, invitationToken]);

    // Log invitation
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Family member invited', JSON.stringify({
          invited_email: email,
          invited_name: name,
          role: role,
          monthly_budget: monthlyBudget,
          ip_address: req.ip || req.connection?.remoteAddress
        })]
      );
    } catch (logErr) {
      console.error('Failed to log family invitation:', logErr);
    }

    res.json({
      success: true,
      message: `Invitation sent to ${name} (${email})`,
      member: result.rows[0],
      invitation_token: invitationToken // In real app, send this via email
    });

  } catch (error) {
    console.error('Error inviting family member:', error);
    res.status(500).json({ error: 'Failed to invite family member' });
  }
};

// Remove family member
exports.removeFamilyMember = async (req, res) => {
  const userId = req.user.userId;
  const { memberId } = req.params;

  try {
    // Verify family member belongs to user
    const result = await pool.query(`
      SELECT id, name, email, user_id FROM family_members 
      WHERE id = $1 AND family_owner_id = $2
    `, [memberId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    const member = result.rows[0];

    await pool.query('BEGIN');

    try {
      // Remove family member
      await pool.query(`
        UPDATE family_members 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [memberId]);

      // If member has joined, remove family association from user account
      if (member.user_id) {
        await pool.query(`
          UPDATE users SET family_owner_id = NULL 
          WHERE id = $1
        `, [member.user_id]);
      }

      await pool.query('COMMIT');

      // Log removal
      try {
        await pool.query(
          'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
          [userId, 'Family member removed', JSON.stringify({
            removed_member: member.name,
            removed_email: member.email,
            ip_address: req.ip || req.connection?.remoteAddress
          })]
        );
      } catch (logErr) {
        console.error('Failed to log family member removal:', logErr);
      }

      res.json({
        success: true,
        message: `${member.name} has been removed from your family plan`
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error removing family member:', error);
    res.status(500).json({ error: 'Failed to remove family member' });
  }
};

// Update family member budget
exports.updateFamilyMemberBudget = async (req, res) => {
  const userId = req.user.userId;
  const { memberId } = req.params;
  const { monthlyBudget } = req.body;

  if (monthlyBudget === undefined || monthlyBudget < 0) {
    return res.status(400).json({ error: 'Invalid budget amount' });
  }

  try {
    // Verify family member belongs to user
    const result = await pool.query(`
      SELECT id, name, monthly_budget FROM family_members 
      WHERE id = $1 AND family_owner_id = $2
    `, [memberId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    const oldBudget = result.rows[0].monthly_budget;

    // Update budget
    await pool.query(`
      UPDATE family_members 
      SET monthly_budget = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [monthlyBudget, memberId]);

    // Log budget update
    try {
      await pool.query(
        'INSERT INTO logs (user_id, activity, details) VALUES ($1, $2, $3)',
        [userId, 'Family member budget updated', JSON.stringify({
          member_name: result.rows[0].name,
          old_budget: oldBudget,
          new_budget: monthlyBudget,
          ip_address: req.ip || req.connection?.remoteAddress
        })]
      );
    } catch (logErr) {
      console.error('Failed to log budget update:', logErr);
    }

    res.json({
      success: true,
      message: `Budget updated for ${result.rows[0].name}`,
      new_budget: monthlyBudget
    });

  } catch (error) {
    console.error('Error updating family member budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

// Note: All exports are using individual exports.functionName format above
// No need for module.exports = {} block at the end