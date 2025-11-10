import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Prefer discrete env vars. If DATABASE_URL is set, we’ll use it.
 * PGSSLMODE=require is common on hosted providers; we map that to { ssl: { rejectUnauthorized: false } }.
 */
const useUrl = !!process.env.DATABASE_URL;

const sslNeeded =
  process.env.PGSSLMODE === 'require' ||
  process.env.NODE_ENV === 'production';

const pool = useUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslNeeded ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'finguard',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      ssl: sslNeeded ? { rejectUnauthorized: false } : false,
      max: 10,              // pool size
      idleTimeoutMillis: 0, // no idle timeout surprises in dev
    });

pool.on('connect', () => {
  console.log('🟢 Connected to PostgreSQL:', process.env.PGDATABASE || '(via DATABASE_URL)');
});

pool.on('error', (err) => {
  console.error('🔴 Postgres pool error', err);
});

export default pool;
