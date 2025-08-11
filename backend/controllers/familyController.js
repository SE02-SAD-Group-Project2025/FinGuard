const pool = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create email transporter (you may need to configure this with actual SMTP settings)
const transporter = nodemailer.createTransport({
  // Configure with your SMTP settings
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Get user's family group
const getFamilyGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is head of a family group
    const headQuery = await pool.query(`
      SELECT fg.*, 
             COUNT(fm.id) as member_count,
             SUM(fm.monthly_budget) as total_budget
      FROM family_groups fg
      LEFT JOIN family_members fm ON fg.id = fm.family_group_id AND fm.is_active = true
      WHERE fg.head_user_id = $1
      GROUP BY fg.id
    `, [userId]);
    
    if (headQuery.rows.length > 0) {
      const familyGroup = headQuery.rows[0];
      
      // Get all family members
      const membersQuery = await pool.query(`
        SELECT fm.*, u.username, u.email, u.profile_photo,
               COALESCE(fm.original_role, fm.role) as display_role
        FROM family_members fm
        JOIN users u ON fm.user_id = u.id
        WHERE fm.family_group_id = $1 AND fm.is_active = true
        ORDER BY fm.joined_at ASC
      `, [familyGroup.id]);
      
      // Get pending invitations
      const invitationsQuery = await pool.query(`
        SELECT * FROM family_invitations
        WHERE family_group_id = $1 AND status = 'pending' AND expires_at > NOW()
        ORDER BY created_at DESC
      `, [familyGroup.id]);
      
      return res.json({
        isHead: true,
        familyGroup: {
          ...familyGroup,
          members: membersQuery.rows,
          pendingInvitations: invitationsQuery.rows
        }
      });
    }
    
    // Check if user is a member of a family group
    const memberQuery = await pool.query(`
      SELECT fg.*, fm.role, fm.monthly_budget, fm.joined_at,
             u.username as head_name
      FROM family_members fm
      JOIN family_groups fg ON fm.family_group_id = fg.id
      JOIN users u ON fg.head_user_id = u.id
      WHERE fm.user_id = $1 AND fm.is_active = true
    `, [userId]);
    
    if (memberQuery.rows.length > 0) {
      const familyInfo = memberQuery.rows[0];
      
      // Get all family members for member view
      const membersQuery = await pool.query(`
        SELECT fm.*, u.username, u.email, u.profile_photo,
               COALESCE(fm.original_role, fm.role) as display_role
        FROM family_members fm
        JOIN users u ON fm.user_id = u.id
        WHERE fm.family_group_id = $1 AND fm.is_active = true
        ORDER BY fm.joined_at ASC
      `, [familyInfo.id]);
      
      return res.json({
        isHead: false,
        isMember: true,
        familyGroup: {
          ...familyInfo,
          members: membersQuery.rows
        }
      });
    }
    
    // User is not part of any family group
    res.json({
      isHead: false,
      isMember: false,
      familyGroup: null
    });
    
  } catch (error) {
    console.error('Get family group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new family group
const createFamilyGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Family name is required' });
    }
    
    // Check if user already has a family group or is member of one
    const existingCheck = await pool.query(`
      SELECT 1 FROM family_groups WHERE head_user_id = $1
      UNION
      SELECT 1 FROM family_members WHERE user_id = $1 AND is_active = true
    `, [userId]);
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You are already part of a family group' });
    }
    
    const result = await pool.query(`
      INSERT INTO family_groups (name, head_user_id)
      VALUES ($1, $2)
      RETURNING *
    `, [name.trim(), userId]);
    
    res.status(201).json({
      message: 'Family group created successfully',
      familyGroup: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create family group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Invite family member
const inviteFamilyMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, role, monthlyBudget } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }
    
    const validRoles = ['Father', 'Mother', 'Wife', 'Husband', 'Son', 'Daughter', 'Other'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user is head of a family group
    const familyQuery = await pool.query(`
      SELECT id FROM family_groups WHERE head_user_id = $1
    `, [userId]);
    
    if (familyQuery.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a family head' });
    }
    
    const familyGroupId = familyQuery.rows[0].id;
    
    // Check family member limit (4 members max)
    const memberCount = await pool.query(`
      SELECT COUNT(*) as count FROM family_members 
      WHERE family_group_id = $1 AND is_active = true
    `, [familyGroupId]);
    
    if (parseInt(memberCount.rows[0].count) >= 4) {
      return res.status(400).json({ message: 'Family member limit reached (maximum 4 members)' });
    }
    
    // Check if email already exists as user
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ message: 'User with this email not found. They need to register first.' });
    }
    
    const invitedUserId = userCheck.rows[0].id;
    
    // Check if user is already a family member or has pending invitation
    const existingCheck = await pool.query(`
      SELECT 1 FROM family_members WHERE user_id = $1 AND is_active = true
      UNION
      SELECT 1 FROM family_invitations WHERE invited_email = $2 AND status = 'pending' AND expires_at > NOW()
    `, [invitedUserId, email]);
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User is already part of a family or has a pending invitation' });
    }
    
    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create invitation
    const invitationResult = await pool.query(`
      INSERT INTO family_invitations (
        family_group_id, inviter_id, invited_email, invited_role, 
        monthly_budget, invitation_token, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [familyGroupId, userId, email, role, monthlyBudget || 0, invitationToken, expiresAt]);
    
    // Get family group name for email
    const familyInfo = await pool.query(`
      SELECT fg.name, u.username as inviter_name
      FROM family_groups fg
      JOIN users u ON fg.head_user_id = u.id
      WHERE fg.id = $1
    `, [familyGroupId]);
    
    // Send invitation email
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/family/accept-invitation/${invitationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@finguard.com',
      to: email,
      subject: `Family Account Invitation - ${familyInfo.rows[0].name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">FinGuard Family Account Invitation</h2>
          <p>Hello!</p>
          <p><strong>${familyInfo.rows[0].inviter_name}</strong> has invited you to join their family account "<strong>${familyInfo.rows[0].name}</strong>" on FinGuard.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Role:</strong> ${role}</p>
            <p><strong>Monthly Budget:</strong> Rs.${(monthlyBudget || 0).toLocaleString()}</p>
          </div>
          <p>As a family member, you'll be able to:</p>
          <ul>
            <li>Track your personal expenses within the family budget</li>
            <li>View family financial overview</li>
            <li>Collaborate on budget planning</li>
            <li>Access premium family features</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="font-size: 12px; color: #6B7280;">This invitation expires in 7 days. If you don't want to join, you can simply ignore this email.</p>
        </div>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails
    }
    
    res.status(201).json({
      message: 'Family invitation sent successfully',
      invitation: invitationResult.rows[0]
    });
    
  } catch (error) {
    console.error('Invite family member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept family invitation
const acceptFamilyInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.userId;
    
    // Find valid invitation
    const invitationQuery = await pool.query(`
      SELECT fi.*, fg.name as family_name, u.username as inviter_name
      FROM family_invitations fi
      JOIN family_groups fg ON fi.family_group_id = fg.id
      JOIN users u ON fi.inviter_id = u.id
      WHERE fi.invitation_token = $1 AND fi.status = 'pending' AND fi.expires_at > NOW()
    `, [token]);
    
    if (invitationQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    
    const invitation = invitationQuery.rows[0];
    
    // Verify the user email matches invitation
    const userQuery = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userQuery.rows[0].email;
    const invitedEmail = invitation.invited_email;
    
    console.log('Email validation:', { userEmail, invitedEmail, match: userEmail === invitedEmail });
    
    if (userEmail !== invitedEmail) {
      return res.status(403).json({ 
        message: 'This invitation is not for your account',
        debug: { userEmail, invitedEmail }
      });
    }
    
    // Check if user is already part of a family
    const memberCheck = await pool.query(`
      SELECT 1 FROM family_members WHERE user_id = $1 AND is_active = true
    `, [userId]);
    
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You are already part of a family group' });
    }
    
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Add user as family member - using family_owner_id instead of family_group_id
      // Get the family owner from the family group
      const ownerQuery = await client.query(`
        SELECT head_user_id FROM family_groups WHERE id = $1
      `, [invitation.family_group_id]);
      
      const familyOwnerId = ownerQuery.rows[0].head_user_id;
      
      // Map family group roles to subscription system roles
      const roleMapping = {
        'Father': 'parent',
        'Mother': 'parent', 
        'Wife': 'parent',
        'Husband': 'parent',
        'Son': 'child',
        'Daughter': 'child',
        'Other': 'child'
      };
      
      const mappedRole = roleMapping[invitation.invited_role] || 'child';
      
      console.log('Inserting family member:', {
        familyOwnerId,
        userId,
        original_role: invitation.invited_role,
        mapped_role: mappedRole,
        monthly_budget: invitation.monthly_budget
      });
      
      await client.query(`
        INSERT INTO family_members (family_owner_id, family_group_id, user_id, email, name, role, original_role, monthly_budget, status, joined_at)
        SELECT $1, $2, $3, u.email, u.username, $4, $5, $6, 'active', NOW()
        FROM users u WHERE u.id = $3
      `, [familyOwnerId, invitation.family_group_id, userId, mappedRole, invitation.invited_role, invitation.monthly_budget]);
      
      // Update invitation status
      await client.query(`
        UPDATE family_invitations 
        SET status = 'accepted', responded_at = NOW()
        WHERE id = $1
      `, [invitation.id]);
      
      await client.query('COMMIT');
      
      res.json({
        message: `Welcome to ${invitation.family_name}! You have successfully joined as ${invitation.invited_role}.`,
        familyGroup: {
          id: invitation.family_group_id,
          name: invitation.family_name,
          role: invitation.invited_role,
          monthlyBudget: invitation.monthly_budget
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Decline family invitation
const declineFamilyInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.userId;
    
    // Find valid invitation
    const invitationQuery = await pool.query(`
      SELECT * FROM family_invitations
      WHERE invitation_token = $1 AND status = 'pending' AND expires_at > NOW()
    `, [token]);
    
    if (invitationQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    
    const invitation = invitationQuery.rows[0];
    
    // Verify the user email matches invitation
    const userQuery = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userQuery.rows[0].email !== invitation.invited_email) {
      return res.status(403).json({ message: 'This invitation is not for your account' });
    }
    
    // Update invitation status
    await pool.query(`
      UPDATE family_invitations 
      SET status = 'declined', responded_at = NOW()
      WHERE id = $1
    `, [invitation.id]);
    
    res.json({ message: 'Family invitation declined successfully' });
    
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove family member (only head can do this)
const removeFamilyMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { memberId } = req.params;
    
    // Check if user is head of a family group
    const familyQuery = await pool.query(`
      SELECT id FROM family_groups WHERE head_user_id = $1
    `, [userId]);
    
    if (familyQuery.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a family head' });
    }
    
    const familyGroupId = familyQuery.rows[0].id;
    
    // Check if member exists and belongs to this family
    const memberQuery = await pool.query(`
      SELECT * FROM family_members 
      WHERE id = $1 AND family_group_id = $2 AND is_active = true
    `, [memberId, familyGroupId]);
    
    if (memberQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Family member not found' });
    }
    
    // Deactivate member instead of deleting (to preserve history)
    await pool.query(`
      UPDATE family_members 
      SET is_active = false 
      WHERE id = $1
    `, [memberId]);
    
    res.json({ message: 'Family member removed successfully' });
    
  } catch (error) {
    console.error('Remove family member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update member budget (only head can do this)
const updateMemberBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { memberId } = req.params;
    const { monthlyBudget } = req.body;
    
    if (monthlyBudget < 0) {
      return res.status(400).json({ message: 'Budget cannot be negative' });
    }
    
    // Check if user is head of a family group
    const familyQuery = await pool.query(`
      SELECT id FROM family_groups WHERE head_user_id = $1
    `, [userId]);
    
    if (familyQuery.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a family head' });
    }
    
    const familyGroupId = familyQuery.rows[0].id;
    
    // Update member budget
    const result = await pool.query(`
      UPDATE family_members 
      SET monthly_budget = $1 
      WHERE id = $2 AND family_group_id = $3 AND is_active = true
      RETURNING *
    `, [monthlyBudget, memberId, familyGroupId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Family member not found' });
    }
    
    res.json({
      message: 'Member budget updated successfully',
      member: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update member budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get family financial summary
const getFamilyFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;
    
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Check if user is head or member of a family group
    const familyQuery = await pool.query(`
      SELECT fg.id as family_id, fg.name, 
             CASE WHEN fg.head_user_id = $1 THEN true ELSE false END as is_head
      FROM family_groups fg
      WHERE fg.head_user_id = $1
      UNION
      SELECT fg.id as family_id, fg.name, false as is_head
      FROM family_members fm
      JOIN family_groups fg ON fm.family_group_id = fg.id
      WHERE fm.user_id = $1 AND fm.is_active = true
    `, [userId]);
    
    if (familyQuery.rows.length === 0) {
      return res.status(404).json({ message: 'No family group found' });
    }
    
    const familyInfo = familyQuery.rows[0];
    
    // Get all family members with their financial data
    const membersQuery = await pool.query(`
      SELECT 
        fm.*,
        u.username,
        u.email,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as monthly_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as monthly_expenses
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      LEFT JOIN transactions t ON fm.user_id = t.user_id 
        AND EXTRACT(MONTH FROM t.date) = $2
        AND EXTRACT(YEAR FROM t.date) = $3
      WHERE fm.family_group_id = $1 AND fm.is_active = true
      GROUP BY fm.id, u.username, u.email
      ORDER BY fm.joined_at ASC
    `, [familyInfo.family_id, currentMonth, currentYear]);
    
    // Calculate totals
    const totalBudget = membersQuery.rows.reduce((sum, member) => sum + parseFloat(member.monthly_budget || 0), 0);
    const totalIncome = membersQuery.rows.reduce((sum, member) => sum + parseFloat(member.monthly_income || 0), 0);
    const totalExpenses = membersQuery.rows.reduce((sum, member) => sum + parseFloat(member.monthly_expenses || 0), 0);
    
    res.json({
      familyInfo: {
        id: familyInfo.family_id,
        name: familyInfo.name,
        isHead: familyInfo.is_head
      },
      summary: {
        totalBudget,
        totalIncome,
        totalExpenses,
        totalSavings: totalIncome - totalExpenses,
        month: currentMonth,
        year: currentYear
      },
      members: membersQuery.rows.map(member => ({
        id: member.id,
        userId: member.user_id,
        username: member.username,
        email: member.email,
        role: member.role,
        monthlyBudget: parseFloat(member.monthly_budget || 0),
        monthlyIncome: parseFloat(member.monthly_income || 0),
        monthlyExpenses: parseFloat(member.monthly_expenses || 0),
        monthlyBalance: parseFloat(member.monthly_income || 0) - parseFloat(member.monthly_expenses || 0),
        budgetUtilization: member.monthly_budget > 0 ? 
          ((parseFloat(member.monthly_expenses || 0) / parseFloat(member.monthly_budget)) * 100).toFixed(1) : 0
      }))
    });
    
  } catch (error) {
    console.error('Get family financial summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFamilyGroup,
  createFamilyGroup,
  inviteFamilyMember,
  acceptFamilyInvitation,
  declineFamilyInvitation,
  removeFamilyMember,
  updateMemberBudget,
  getFamilyFinancialSummary
};