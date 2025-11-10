// src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const BCRYPT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

/* ---------------- Helpers ---------------- */

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  full_name: user.full_name,
  created_at: user.created_at,
});

const generateToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

// Uniform validation error sender
const sendValidationErrors = (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: result.array().map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  return null;
};

/* ---------------- Validation ---------------- */

const validateRegister = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username')
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage('Username can include letters, numbers, underscore; 3-20 chars'),
  body('full_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('dob')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('DOB must be YYYY-MM-DD'),
];

const validateLogin = [
  body('email')
    .exists({ checkFalsy: true }).withMessage('Email is required')
    .bail()
    .isString().withMessage('Email must be a string')
    .bail()
    .isEmail().withMessage('Valid email is required')
    .bail()
    .normalizeEmail(),
  body('password')
    .exists({ checkFalsy: true }).withMessage('Password is required')
    .bail()
    .isString().withMessage('Password must be a string')
    .bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];


/* ---------------- Availability checks (web helpers) ---------------- */

// POST /api/auth/check-username  { username }
router.post(
  '/check-username',
  [body('username').isString().isLength({ min: 3, max: 20 })],
  async (req, res) => {
    const v = sendValidationErrors(req, res);
    if (v) return;

    const username = String(req.body.username).trim();
    try {
      const exists = await pool.query(
        'SELECT 1 FROM users WHERE username = $1 LIMIT 1',
        [username]
      );
      return res.json({ available: exists.rowCount === 0 });
    } catch (e) {
      console.error('check-username error:', e);
      return res.status(500).json({ error: 'Check failed' });
    }
  }
);

// POST /api/auth/check-email  { email }
router.post(
  '/check-email',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const v = sendValidationErrors(req, res);
    if (v) return;

    const email = String(req.body.email).toLowerCase();
    try {
      const exists = await pool.query(
        'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      return res.json({ available: exists.rowCount === 0 });
    } catch (e) {
      console.error('check-email error:', e);
      return res.status(500).json({ error: 'Check failed' });
    }
  }
);

/* ---------------- Register ---------------- */

async function handleRegister(req, res) {
  const v = sendValidationErrors(req, res);
  if (v) return;

  try {
    // Normalize inputs
    const email = String(req.body.email).toLowerCase();
    const password = String(req.body.password);
    const username = String(req.body.username).trim();
    const full_name = req.body.full_name ? String(req.body.full_name).trim() : null;
    const dob = req.body.dob || null; // ISO string or null

    // Uniqueness
    const exists = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email, username]
    );
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'Email or username already in use' });
    }

    // Hash & insert
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insert = await pool.query(
      `INSERT INTO users (email, password_hash, username, full_name, dob)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, full_name, created_at`,
      [email, hash, username, full_name, dob]
    );

    const user = insert.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
    } catch (e) {
      if (e.code === '28P01') {
        return res.status(500).json({ error: 'Database authentication failed. Check DB credentials on the server.' });
      }
      console.error('Registration error:', e);
      return res.status(500).json({ error: 'Registration failed' });
    }
}

// POST /api/auth/register
router.post('/register', validateRegister, handleRegister);

// Alias (kept for your web form compatibility)
router.post('/register-enhanced', validateRegister, handleRegister);

/* ---------------- Login ---------------- */

router.post('/login', validateLogin, async (req, res) => {
  const v = sendValidationErrors(req, res);
  if (v) return;

  try {
    const email = String(req.body.email).toLowerCase();
    const password = String(req.body.password);

    const q = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (q.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? e.message : undefined,
    });
  }
});

/* ---------------- Me (token check helper) ---------------- */

// GET /api/auth/me   (Authorization: Bearer <token>)
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const q = await pool.query(
      'SELECT id, email, username, full_name, created_at FROM users WHERE id = $1 LIMIT 1',
      [payload.sub]
    );
    if (q.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: q.rows[0] });
  } catch (e) {
    console.error('Me error:', e);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
