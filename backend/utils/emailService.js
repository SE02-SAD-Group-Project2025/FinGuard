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

// Enhanced budget alert email with cool design
const sendBudgetAlertEmail = async (to, username, category, spent, limit, transferDetails = null) => {
  const overAmount = spent - limit;
  const subject = transferDetails ? '✅ FinGuard Budget Transfer Completed' : '🚨 FinGuard Budget Alert - Action Required!';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
        <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, ${transferDetails ? '#10b981, #059669' : '#ef4444, #dc2626'}); padding: 30px 20px; text-align: center; position: relative;">
            <div style="font-size: 60px; margin-bottom: 10px;">${transferDetails ? '✅' : '🚨'}</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${transferDetails ? 'Budget Transfer Complete!' : 'Budget Alert!'}
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
              ${transferDetails ? 'Your budget has been rebalanced' : 'Budget limit exceeded'}
            </p>
            <div style="position: absolute; top: -10px; right: -10px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
            <div style="position: absolute; bottom: -20px; left: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.2;"></div>
          </div>
          
          <!-- Content Section -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
              Hi ${username}! 👋
            </h2>
            
            ${transferDetails ? `
              <div style="background: #f0fdf4; border-left: 5px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 0 10px 10px 0;">
                <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">
                  🎉 Transfer Successful!
                </h3>
                <p style="color: #166534; line-height: 1.6; margin: 0;">
                  Your budget overflow has been automatically resolved through our smart budget transfer system.
                </p>
              </div>
            ` : `
              <div style="background: #fef2f2; border-left: 5px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 10px 10px 0;">
                <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">
                  💰 Budget Exceeded Alert
                </h3>
                <p style="color: #991b1b; line-height: 1.6; margin: 0;">
                  You've spent more than your allocated budget for this month. Don't worry - we've got solutions!
                </p>
              </div>
            `}
            
            <!-- Budget Details Card -->
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 15px; padding: 25px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #334155; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
                📊 Budget Overview
              </h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #64748b; font-weight: 600;">Category:</span>
                <span style="color: #1e293b; font-weight: 700; font-size: 18px;">${category}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #64748b; font-weight: 600;">Budget Limit:</span>
                <span style="color: #059669; font-weight: 700; font-size: 18px;">LKR ${limit.toFixed(2)}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #64748b; font-weight: 600;">Amount Spent:</span>
                <span style="color: #dc2626; font-weight: 700; font-size: 18px;">LKR ${spent.toFixed(2)}</span>
              </div>
              
              <hr style="border: none; height: 1px; background: #cbd5e1; margin: 20px 0;">
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151; font-weight: 700; font-size: 16px;">Exceeded By:</span>
                <span style="color: #dc2626; font-weight: 900; font-size: 22px; background: #fee2e2; padding: 8px 16px; border-radius: 25px;">
                  LKR ${overAmount.toFixed(2)}
                </span>
              </div>
            </div>
            
            ${transferDetails ? `
              <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 15px; padding: 25px; margin: 25px 0; border: 1px solid #a7f3d0;">
                <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 18px; text-align: center;">
                  🔄 Transfer Details
                </h3>
                <div style="text-align: center;">
                  <p style="color: #047857; margin: 8px 0; font-size: 16px;">
                    <strong>LKR ${transferDetails.overflowAmount.toFixed(2)}</strong> transferred from 
                    <strong style="background: #a7f3d0; padding: 4px 8px; border-radius: 6px;">${transferDetails.fromCategory}</strong>
                    to 
                    <strong style="background: #fecaca; padding: 4px 8px; border-radius: 6px;">${transferDetails.toCategory}</strong>
                  </p>
                </div>
              </div>
            ` : `
              <div style="background: linear-gradient(135deg, #fef3c7, #fed7aa); border-radius: 15px; padding: 25px; margin: 25px 0; border: 1px solid #fdba74;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; text-align: center;">
                  💡 What's Next?
                </h3>
                <ul style="color: #a16207; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li>Review your recent expenses in the <strong>${category}</strong> category</li>
                  <li>Consider transferring budget from other categories</li>
                  <li>Adjust your spending habits for the rest of the month</li>
                  <li>Set up spending alerts to avoid future overruns</li>
                </ul>
              </div>
            `}
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="http://localhost:3000/budget" style="
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 700;
                font-size: 16px;
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
                transition: all 0.3s ease;
                display: inline-block;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">
                ${transferDetails ? '📈 View Updated Budget' : '🔧 Manage Budget'}
              </a>
            </div>
            
            <!-- Footer Message -->
            <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e2e8f0; margin-top: 30px;">
              <p style="color: #64748b; line-height: 1.6; margin: 0 0 10px 0; font-size: 16px;">
                ${transferDetails ? '🎯 Your budget is now balanced and ready for smart spending!' : '💪 Stay strong on your financial journey!'}
              </p>
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                Remember: Every rupee counts toward your financial goals 🌟
              </p>
            </div>
            
          </div>
          
          <!-- Bottom Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              💌 With love from the <strong style="color: #3b82f6;">FinGuard Team</strong>
            </p>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px;">
              Making financial management fun and intelligent ✨
            </p>
          </div>
          
        </div>
      </div>
    `,
    text: `Hi ${username}!\n\n${transferDetails ? 
      `✅ BUDGET TRANSFER COMPLETED!\n\nYour budget overflow has been resolved:\n• Category: ${category}\n• Exceeded by: LKR ${overAmount.toFixed(2)}\n• Transfer: LKR ${transferDetails.overflowAmount.toFixed(2)} from ${transferDetails.fromCategory} to ${transferDetails.toCategory}\n\nYour budget is now balanced!` :
      `🚨 BUDGET ALERT!\n\nYou've exceeded your budget:\n• Category: ${category}\n• Budget Limit: LKR ${limit.toFixed(2)}\n• Amount Spent: LKR ${spent.toFixed(2)}\n• Exceeded By: LKR ${overAmount.toFixed(2)}\n\nConsider transferring budget from other categories or adjusting your spending.`
    }\n\nView your budget: http://localhost:3000/budget\n\n💪 Stay strong on your financial journey!\n— FinGuard Team ✨`
  };

  return transporter.sendMail(mailOptions);
};

// Budget transfer completion email
const sendBudgetTransferEmail = async (to, username, fromCategory, toCategory, transferAmount, originalCategory, overflowAmount) => {
  return sendBudgetAlertEmail(to, username, originalCategory, overflowAmount + transferAmount, transferAmount, {
    fromCategory,
    toCategory,
    overflowAmount,
    transferAmount
  });
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

// Bill reminder notification email
const sendBillReminderEmail = async (to, username, bill) => {
  const dueDate = new Date(bill.dueDate || bill.due_date);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  
  let urgencyLevel = 'reminder';
  let urgencyText = 'upcoming';
  let urgencyColor = '#10b981';
  
  if (daysUntilDue <= 0) {
    urgencyLevel = 'overdue';
    urgencyText = 'overdue';
    urgencyColor = '#ef4444';
  } else if (daysUntilDue <= 1) {
    urgencyLevel = 'urgent';
    urgencyText = 'due soon';
    urgencyColor = '#f59e0b';
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `💳 Bill ${urgencyText.toUpperCase()}: ${bill.name} - Rs.${(bill.amount || 0).toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💳 Bill ${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">FinGuard Payment Reminder</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${username}! 👋</h2>
          
          <div style="background: ${urgencyLevel === 'overdue' ? '#fef2f2' : urgencyLevel === 'urgent' ? '#fefbf2' : '#f0f9ff'}; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: ${urgencyColor}; margin: 0 0 15px 0; font-size: 20px;">
              ${urgencyLevel === 'overdue' ? '⚠️ Payment Overdue' : urgencyLevel === 'urgent' ? '⏰ Payment Due Soon' : '📅 Payment Reminder'}
            </h3>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 600; color: #374151; font-size: 18px;">${bill.name}</span>
                <span style="font-weight: 700; color: ${urgencyColor}; font-size: 24px;">Rs.${(bill.amount || 0).toLocaleString()}</span>
              </div>
              <div style="color: #6b7280; font-size: 14px;">
                <div style="margin-bottom: 5px;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div style="margin-bottom: 5px;"><strong>Category:</strong> ${bill.category || 'Bills & Utilities'}</div>
                ${daysUntilDue > 0 
                  ? `<div style="color: #f59e0b;"><strong>Days Until Due:</strong> ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}</div>` 
                  : `<div style="color: #ef4444;"><strong>Status:</strong> ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue</div>`
                }
              </div>
            </div>
            
            ${bill.description ? `<p style="color: #6b7280; font-style: italic; margin: 10px 0;">"${bill.description}"</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/liabilities" 
               style="display: inline-block; background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
              Make Payment
            </a>
            <a href="http://localhost:3000/premium-dashboard" 
               style="display: inline-block; background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View All Bills
            </a>
          </div>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #374151; margin: 0 0 10px 0;">💡 Quick Actions:</h4>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Mark as paid in your FinGuard dashboard</li>
              <li>Set up automatic payment reminders</li>
              <li>Track this payment in your expense categories</li>
              <li>Update payment frequency if needed</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Stay on top of your bills with FinGuard<br>
              Your smart financial companion for Sri Lanka 🇱🇰
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Bill ${urgencyText.toUpperCase()}: ${bill.name}

Hi ${username}!

${urgencyLevel === 'overdue' 
  ? `⚠️ Your bill payment is ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue.`
  : urgencyLevel === 'urgent'
  ? `⏰ Your bill payment is due ${daysUntilDue === 0 ? 'today' : 'tomorrow'}.`
  : `📅 Your bill payment is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}.`
}

Bill Details:
- Name: ${bill.name}
- Amount: Rs.${(bill.amount || 0).toLocaleString()}
- Due Date: ${dueDate.toLocaleDateString()}
- Category: ${bill.category || 'Bills & Utilities'}
${bill.description ? `- Notes: ${bill.description}` : ''}

Quick Actions:
• Make payment: http://localhost:3000/liabilities  
• View all bills: http://localhost:3000/premium-dashboard

Stay on top of your bills with FinGuard!
Your smart financial companion for Sri Lanka
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendBudgetAlertEmail,
  sendBudgetTransferEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendBillReminderEmail
};