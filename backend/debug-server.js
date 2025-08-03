const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

console.log('🚀 Starting debug server...');

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

console.log('✅ Basic middleware loaded');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Debug server running' });
});

console.log('✅ Basic route loaded');

// Test each route file individually
console.log('🔍 Testing route files...');

// Test 1: Auth Routes
console.log('Testing authRoutes...');
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ authRoutes loaded successfully');
} catch (error) {
  console.error('❌ authRoutes FAILED:', error.message);
  process.exit(1);
}

// Test 2: Summary Routes  
console.log('Testing summaryRoutes...');
try {
  const summaryRoutes = require('./routes/summaryRoutes');
  app.use('/api/summary', summaryRoutes);
  console.log('✅ summaryRoutes loaded successfully');
} catch (error) {
  console.error('❌ summaryRoutes FAILED:', error.message);
  process.exit(1);
}

// Test 3: Budget Routes
console.log('Testing budgetRoutes...');
try {
  const budgetRoutes = require('./routes/budgetRoutes');
  app.use('/api/budgets', budgetRoutes);
  console.log('✅ budgetRoutes loaded successfully');
} catch (error) {
  console.error('❌ budgetRoutes FAILED:', error.message);
  process.exit(1);
}

// Test 4: Transaction Routes
console.log('Testing transactionRoutes...');
try {
  const transactionRoutes = require('./routes/transactionRoutes');
  app.use('/api/transactions', transactionRoutes);
  console.log('✅ transactionRoutes loaded successfully');
} catch (error) {
  console.error('❌ transactionRoutes FAILED:', error.message);
  process.exit(1);
}

// Test 5: Admin Routes
console.log('Testing adminRoutes...');
try {
  const adminRoutes = require('./routes/adminRoutes');
  app.use('/admin', adminRoutes);
  console.log('✅ adminRoutes loaded successfully');
} catch (error) {
  console.error('❌ adminRoutes FAILED:', error.message);
  process.exit(1);
}

// Test 6: Middleware
console.log('Testing authMiddleware...');
try {
  const { authenticateToken } = require('./middleware/authMiddleware');
  
  app.get('/test-protected', authenticateToken, (req, res) => {
    res.json({ message: 'Protected route works' });
  });
  console.log('✅ authMiddleware loaded successfully');
} catch (error) {
  console.error('❌ authMiddleware FAILED:', error.message);
  process.exit(1);
}

const PORT = 5001; // Use different port to avoid conflicts
app.listen(PORT, () => {
  console.log('🎉 ALL ROUTES LOADED SUCCESSFULLY!');
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log('The issue might be in the original app.js structure or dependencies');
});