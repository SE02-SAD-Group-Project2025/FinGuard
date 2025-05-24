const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBudgetAlertEmail = (to, category, spent, limit) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `⚠️ FinGuard Alert: Over Budget in ${category}`,
    text: `You've spent ${spent} in the "${category}" category, which exceeds your monthly budget limit of ${limit}. Please review your expenses and adjust your budget accordingly.`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendBudgetAlertEmail };
// This module handles sending budget alert emails using Nodemailer
// It exports a function that takes the recipient's email, category, spent amount, and budget limit