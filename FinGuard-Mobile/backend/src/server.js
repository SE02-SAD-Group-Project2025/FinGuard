// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import authRouter from './routes/auth.js';

const app = express();

/* Security & logging */
app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } }));
app.use(morgan('dev'));

/* Parsers */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* CORS - UPDATED FOR MOBILE APP ACCESS + LOCALTUNNEL */
const DEV_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://10.91.73.120:8081',
  'http://10.91.73.120:19006',
  'exp://10.91.73.120:8081',
  'http://10.0.2.2:8081',
  'http://10.0.2.2:19006',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log('[CORS] Allowing request with no origin (mobile app/tool)');
      return callback(null, true);
    }
    
    // Check against allowed origins
    if (DEV_ORIGINS.includes(origin)) {
      console.log(`[CORS] Allowed origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow all subdomains of ngrok (for development)
    if (origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app')) {
      console.log(`[CORS] Allowed ngrok origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow localtunnel domains (for development)
    if (origin.includes('.loca.lt')) {
      console.log(`[CORS] Allowed localtunnel origin: ${origin}`);
      return callback(null, true);
    }
    
    // In production, you might want to be more restrictive
    if (process.env.NODE_ENV === 'production') {
      // Add your production domains here
      const PRODUCTION_ORIGINS = [
        'https://yourapp.com',
        // Add other production domains
      ];
      if (PRODUCTION_ORIGINS.includes(origin)) {
        console.log(`[CORS] Allowed production origin: ${origin}`);
        return callback(null, true);
      }
    }
    
    console.log(`[CORS] ❌ Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-access-token'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

/* Debug log */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`[ORIGIN] ${req.headers.origin || 'no-origin'}`);
  next();
});

/* Health - ENHANCED FOR DEBUGGING */
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    ts: new Date().toISOString(), 
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: DEV_ORIGINS.length,
      yourIp: '10.91.73.120',
      allowsNoOrigin: true,
      allowsNgrok: true,
      allowsLocaltunnel: true
    }
  });
});

/* Routes */
app.use('/api/auth', authRouter);

/* DB */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false },
});

(async () => {
  const c = await pool.connect();
  try {
    const { rows } = await c.query('SELECT NOW() now');
    console.log('[DB] Connected. NOW =', rows[0].now);
  } finally { 
    c.release(); 
  }
})().catch(err => console.error('[DB] connect error:', err));

/* ===== AUTH ===== */
function extractToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  const x = req.headers['x-access-token'];
  if (h && typeof h === 'string') {
    return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : h.trim();
  }
  if (x && typeof x === 'string') return x.trim();
  return null;
}

function requireAuth(req, res, next) {
  const authz = req.headers.authorization || req.headers.Authorization || '';
  const token = extractToken(req);
  
  if (req.path.startsWith('/api/transactions')) {
    console.log('[AUTH DEBUG] Authorization header:', authz || '(none)');
  }
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Missing authentication token',
      hint: 'Include: Authorization: Bearer <your-jwt-token>'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id ?? decoded?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Invalid token payload',
        details: 'No user ID found in token'
      });
    }
    
    req.user = { id: userId };
    return next();
  } catch (err) {
    console.warn('[AUTH DEBUG] Token verification failed:', err?.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        details: 'Please login again'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: 'Malformed token'
      });
    }
    
    return res.status(401).json({ 
      error: 'Authentication failed',
      details: err.message 
    });
  }
}

/* Helpers */
const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const toMidnightUTC = (yyyyMmDd) => new Date(`${yyyyMmDd}T00:00:00.000Z`);

/* ===== TRANSACTIONS ===== */
app.post('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { type, category, amount, date, description } = req.body || {};
    const errors = [];
    
    if (type !== 'income' && type !== 'expense') {
      errors.push("type must be 'income' or 'expense'");
    }
    if (!category || typeof category !== 'string') {
      errors.push('category is required');
    }
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      errors.push('amount must be a number');
    }
    if (!date || !isIsoDate(date)) {
      errors.push("date must be 'YYYY-MM-DD'");
    }
    
    if (errors.length) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, date, description, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, type, amount, date, description, category`,
      [req.user.id, type, Number(amount), toMidnightUTC(date), description || null, category]
    );
    
    return res.status(201).json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('POST /api/transactions error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: 'Failed to create transaction'
    });
  }
});

app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
    const t = req.query.type;
    
    let sql = `SELECT id, user_id, type, amount, date, description, category
               FROM transactions
               WHERE user_id = $1`;
    const params = [req.user.id];
    
    if (t === 'income' || t === 'expense') { 
      sql += ' AND type = $2'; 
      params.push(t); 
    }
    
    sql += ` ORDER BY date DESC, id DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const { rows } = await pool.query(sql, params);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('GET /api/transactions error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: 'Failed to fetch transactions'
    });
  }
});

/* ADDITIONAL ROUTES FOR FINANCIAL APP */
app.get('/api/summary', requireAuth, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_income 
       FROM transactions 
       WHERE user_id = $1 AND type = 'income'`,
      [req.user.id]
    );
    
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expense 
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense'`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        totalIncome: parseFloat(incomeResult.rows[0].total_income),
        totalExpense: parseFloat(expenseResult.rows[0].total_expense),
        balance: parseFloat(incomeResult.rows[0].total_income) - parseFloat(expenseResult.rows[0].total_expense)
      }
    });
  } catch (err) {
    console.error('GET /api/summary error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: 'Failed to fetch summary'
    });
  }
});

/* 404 for /api/* */
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'Not Found', 
      path: req.originalUrl, 
      method: req.method 
    });
  }
  next();
});

/* Error handler */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS Error',
      details: 'Origin not allowed',
      allowedOrigins: DEV_ORIGINS,
      hint: 'Check server logs for blocked origin'
    });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error', 
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

/* Start */
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`• Local access:   http://localhost:${PORT}/api/health`);
  console.log(`• Network access: http://10.91.73.120:${PORT}/api/health`);
  console.log(`• Health:         http://${HOST}:${PORT}/api/health`);
  console.log(`• Auth:           http://${HOST}:${PORT}/api/auth`);
  console.log(`• Transactions:   POST http://${HOST}:${PORT}/api/transactions`);
  console.log(`• Transactions:   GET  http://${HOST}:${PORT}/api/transactions`);
  console.log(`• Summary:        GET  http://${HOST}:${PORT}/api/summary`);
  console.log('[DB] Connected to:', {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER
  });
  console.log('[CORS] Configuration:');
  console.log('  - Allowed local origins:', DEV_ORIGINS.length);
  console.log('  - Allows no-origin requests: ✓');
  console.log('  - Allows *.ngrok.io: ✓');
  console.log('  - Allows *.loca.lt: ✓');
});