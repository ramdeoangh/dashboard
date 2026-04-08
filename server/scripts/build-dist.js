/**
 * Production bundle: copies app sources + db + lockfile into server/dist/ and runs npm ci --omit=dev.
 * Deploy dist/ only; add .env (or env vars) and run: npm start  (or node src/server.js).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

/** @param {string} fromAbs @param {string} toAbs */
async function copyInto(fromAbs, toAbs) {
  const st = await fs.stat(fromAbs);
  if (st.isDirectory()) {
    await fs.cp(fromAbs, toAbs, { recursive: true });
  } else {
    await fs.mkdir(path.dirname(toAbs), { recursive: true });
    await fs.copyFile(fromAbs, toAbs);
  }
}

async function main() {
  console.log('Cleaning', dist);
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });

  const entries = [
    ['src', 'src'],
    ['scripts', 'scripts'],
    ['db', 'db'],
    ['package.json', 'package.json'],
    ['package-lock.json', 'package-lock.json'],
    ['.env.example', '.env.example'],
  ];

  for (const [relFrom, relTo] of entries) {
    const from = path.join(root, relFrom);
    const to = path.join(dist, relTo);
    try {
      await fs.access(from);
    } catch {
      console.warn('Skip (missing):', relFrom);
      continue;
    }
    console.log('Copy', relFrom, '→', relTo);
    await copyInto(from, to);
  }

  await fs.mkdir(path.join(dist, 'uploads'), { recursive: true });

  console.log('Running npm ci --omit=dev in dist…');
  execSync('npm ci --omit=dev', { cwd: dist, stdio: 'inherit', env: process.env });

  console.log('');
  console.log('Build complete:', dist);
  console.log('Deploy: upload dist/ contents, add .env, run npm start (PORT from env).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
