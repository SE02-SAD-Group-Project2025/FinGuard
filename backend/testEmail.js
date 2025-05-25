const nodemailer = require('nodemailer');
require('dotenv').config(); // Load .env file

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // send to yourself to test
  subject: 'FinGuard Email Test ✅',
  text: 'This is a test email from your FinGuard system.Janodh Pagaya',
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    return console.error('❌ Test email failed:', err.message);
  }
  console.log('✅ Test email sent:', info.response);
});
