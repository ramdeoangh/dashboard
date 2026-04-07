/**
 * Adds application_logs table to an existing database (CREATE IF NOT EXISTS).
 * Uses server/.env with override: true.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

async function main() {
  const host = process.env.DATABASE_HOST || '127.0.0.1';
  const port = Number(process.env.DATABASE_PORT || 3306);
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const database = process.env.DATABASE_NAME || 'project_reporting';

  const sqlPath = path.join(__dirname, '..', 'db', 'patch_application_logs.sql');
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
  await conn.end();
  console.log('Patch applied: application_logs on', database);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
