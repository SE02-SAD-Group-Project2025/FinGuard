const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail transporter failed:', error.message);
  } else {
    console.log('✅ Gmail transporter is ready');
  }
});

const sendBudgetAlertEmail = async (to, username, category, spent, limit) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '⚠️ FinGuard Budget Alert',
    text: `Hi ${username},\n\nYou've spent Rs. ${spent} in "${category}", which exceeds your monthly budget limit of Rs. ${limit}.\n\nStay mindful — every rupee counts toward your goals.\n\n— FinGuard Team`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendBudgetAlertEmail
};
// Test the email service