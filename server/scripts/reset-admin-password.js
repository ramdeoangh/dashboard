/**
 * Sets bcrypt password for the default admin user (username `admin` or email admin@example.com).
 * Usage: set ADMIN_PASSWORD or SEED_ADMIN_PASSWORD in .env, then:
 *   npm run db:reset-admin
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const pwd = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
const ADMIN_USER = 'admin';
const ADMIN_EMAIL = 'admin@example.com';

async function main() {
  if (!pwd || pwd.length < 8) {
    console.error('Set ADMIN_PASSWORD (or SEED_ADMIN_PASSWORD) in server/.env to a password with at least 8 characters.');
    process.exit(1);
  }

  const host = process.env.DATABASE_HOST || '127.0.0.1';
  const port = Number(process.env.DATABASE_PORT || 3306);
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const database = process.env.DATABASE_NAME || 'project_reporting';

  const conn = await mysql.createConnection({ host, port, user, password, database });
  const [rows] = await conn.execute(
    'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
    [ADMIN_USER, ADMIN_EMAIL]
  );

  if (!rows.length) {
    console.error('No admin user found. Run: npm run db:seed');
    await conn.end();
    process.exit(1);
  }

  const hash = await bcrypt.hash(pwd, 12);
  await conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, rows[0].id]);
  await conn.end();

  console.log('Password updated for:', rows[0].username, '/', rows[0].email);
  console.log('You can remove ADMIN_PASSWORD from .env after use.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
