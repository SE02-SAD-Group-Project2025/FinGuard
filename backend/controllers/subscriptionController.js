// controllers/subscriptionController.js
const pool = require('../db');
const crypto = require('crypto');

// Get all available subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, display_name, description, price_monthly, price_yearly, 
             max_family_members, features, is_active
      FROM subscription_plans 
      WHERE is_active = true 
      ORDER BY price_monthly ASC
    `);

    res.json({
      success: true,
      plans: result.rows
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
    const result = await pool.query(`
      SELECT 
        us.id as subscription_id,
        us.status,
        us.billing_cycle,
        us.current_period_start,
        us.current_period_end,
        us.auto_renew,
        sp.name as plan_name,
        sp.display_name,
        sp.description,
        sp.price_monthly,
        sp.price_yearly,
        sp.max_family_members,
        sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN users u ON us.user_id = u.id
      WHERE us.user_id = $1 AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ 
        success: true,
        subscription: null,
        message: 'No active subscription found - user is on free plan'
      });
    }

    const subscription = result.rows[0];

    // Check if subscription is expired
    const now = new Date();
    const isExpired = new Date(subscription.current_period_end) < now;
    
    if (isExpired) {
      // Update subscription status to expired
      await pool.query(`
        UPDATE user_subscriptions 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND status = 'active'
      `, [userId]);
      
      subscription.status = 'expired';
    }

    // Get family members if family plan
    let familyMembers = [];
    if (subscription.plan_name === 'family') {
      const familyResult = await pool.query(`
        SELECT id, name, email, role, monthly_budget, status, joined_at
        FROM family_members 
        WHERE family_owner_id = $1 
        ORDER BY role DESC, name ASC
      `, [userId]);
      familyMembers = familyResult.rows;
    }

    res.json({
      success: true,
      subscription: {
        ...subscription,
        is_expired: isExpired,
        family_members: familyMembers
      }
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

  if (!planName || !['free', 'premium', 'family'].includes(planName)) {
    return res.status(400).json({ error: 'Invalid plan name' });
  }

  if (!['monthly', 'yearly'].includes(billingCycle)) {
    return res.status(400).json({ error: 'Invalid billing cycle' });
  }

  try {
    // Get the new plan details
    const planResult = await pool.query(`
      SELECT id, name, display_name, price_monthly, price_yearly, max_family_members
      FROM subscription_plans 
      WHERE name = $1 AND is_active = true
    `, [planName]);

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const newPlan = planResult.rows[0];

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

      // Update user role based on plan (only update role, not non-existent columns)
      let newRole = 'User';
      if (planName === 'premium' || planName === 'family') {
        newRole = 'Premium User';
      }

      await pool.query(`
        UPDATE users 
        SET role = $1
        WHERE id = $2
      `, [newRole, userId]);

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
            amount: billingCycle === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
          })]
        );
      } catch (logErr) {
        console.error('Failed to log subscription upgrade:', logErr);
      }

      res.json({
        success: true,
        message: `Successfully upgraded to ${newPlan.display_name}`,
        subscription: {
          plan_name: planName,
          display_name: newPlan.display_name,
          billing_cycle: billingCycle,
          current_period_end: periodEnd,
          price: billingCycle === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly
        }
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