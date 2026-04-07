/**
 * Runs seed.sql then creates default admin if missing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!123';

async function main() {
  const host = process.env.DATABASE_HOST || '127.0.0.1';
  const port = Number(process.env.DATABASE_PORT || 3306);
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const database = process.env.DATABASE_NAME || 'project_reporting';

  const sqlPath = path.join(__dirname, '..', 'db', 'seed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  await conn.query(sql);

  const [rows] = await conn.execute(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [ADMIN_USER, ADMIN_EMAIL]
  );

  if (rows.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const [r] = await conn.execute(
      `INSERT INTO users (email, username, password_hash, display_name, is_active) VALUES (?, ?, ?, ?, 1)`,
      [ADMIN_EMAIL, ADMIN_USER, hash, 'Administrator']
    );
    const uid = r.insertId;
    const [[roleRow]] = await conn.execute(
      'SELECT id FROM roles WHERE slug = ? LIMIT 1',
      ['super_admin']
    );
    if (roleRow) {
      await conn.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [
        uid,
        roleRow.id,
      ]);
    }
    console.log('Created admin user:', ADMIN_USER, '/', ADMIN_EMAIL);
    console.log('Default password:', ADMIN_PASSWORD, '(set SEED_ADMIN_PASSWORD to override)');
  } else if (process.env.SEED_UPDATE_ADMIN_PASSWORD === '1' || process.env.SEED_UPDATE_ADMIN_PASSWORD === 'true') {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, rows[0].id]);
    console.log('Updated admin password for existing user (SEED_UPDATE_ADMIN_PASSWORD).');
  } else {
    console.log('Admin user already exists, skipping user seed. Use npm run db:reset-admin or SEED_UPDATE_ADMIN_PASSWORD=1 npm run db:seed to reset password.');
  }

  await conn.end();
  console.log('Seed completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
