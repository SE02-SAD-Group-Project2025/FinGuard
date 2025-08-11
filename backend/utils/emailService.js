const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({  // ← Fixed: removed 'r' from createTransporter
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter (with error handling to prevent crashes)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail transporter failed:', error.message);
    // Don't throw or crash the server
  } else {
    console.log('✅ Gmail transporter is ready');
  }
});

// Existing budget alert email
const sendBudgetAlertEmail = async (to, username, category, spent, limit) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '⚠️ FinGuard Budget Alert',
    text: `Hi ${username},\n\nYou've spent Rs. ${spent} in "${category}", which exceeds your monthly budget limit of Rs. ${limit}.\n\nStay mindful — every rupee counts toward your goals.\n\n— FinGuard Team`
  };

  return transporter.sendMail(mailOptions);
};

// Password reset email
const sendPasswordResetEmail = async (to, username, resetToken) => {
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '🔐 FinGuard Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          <p style="color: #e5f5f1; margin: 10px 0 0 0;">FinGuard Security</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${username}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
            We received a request to reset your FinGuard account password. If you made this request, click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px; color: #4b5563;">
            ${resetLink}
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <p style="color: #ef4444; font-size: 14px; margin-bottom: 10px;">
              <strong>⚠️ Security Notice:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              <li>This link will expire in <strong>1 hour</strong> for security reasons</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This email was sent by FinGuard Security System<br>
              Your smart financial companion for Sri Lanka
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Hi ${username}!

We received a request to reset your FinGuard account password.

To reset your password, click this link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

— FinGuard Security Team
Your smart financial companion for Sri Lanka
    `
  };

  return transporter.sendMail(mailOptions);
};

// Welcome email for new registrations
const sendWelcomeEmail = async (to, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '🎉 Welcome to FinGuard - Your Financial Journey Starts Now!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to FinGuard!</h1>
          <p style="color: #e5f5f1; margin: 10px 0 0 0;">Your Financial Journey Starts Now</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome aboard, ${username}! 🚀</h2>
          
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
            Congratulations on joining FinGuard! You've taken the first step towards better financial management and smarter money decisions.
          </p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px;">🎯 What's Next?</h3>
            <ul style="color: #065f46; margin: 0; padding-left: 20px;">
              <li>Set up your monthly budgets</li>
              <li>Track your daily expenses</li>
              <li>Monitor your financial goals</li>
              <li>Get AI-powered insights</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Start Managing Your Finances
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Thank you for choosing FinGuard<br>
              Your smart financial companion for Sri Lanka 🇱🇰
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Welcome to FinGuard, ${username}!

Congratulations on joining FinGuard! You've taken the first step towards better financial management.

What's Next?
- Set up your monthly budgets
- Track your daily expenses  
- Monitor your financial goals
- Get AI-powered insights

Visit your dashboard: http://localhost:3000/dashboard

Thank you for choosing FinGuard!
Your smart financial companion for Sri Lanka
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendBudgetAlertEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};