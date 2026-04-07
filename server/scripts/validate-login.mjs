/**
 * Calls POST /api/auth/login on a running API (default http://127.0.0.1:4000).
 * Usage: npm run validate-login
 * Optional: LOGIN_URL=http://host:port/api/auth/login LOGIN_USER=... LOGIN_PASSWORD=...
 */
const base = process.env.LOGIN_URL || 'http://127.0.0.1:4000/api/auth/login';
const username = process.env.LOGIN_USER || 'admin@example.com';
const password = process.env.LOGIN_PASSWORD || 'ChangeMe!123';

const res = await fetch(base, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text };
}

console.log('POST', base);
console.log('Status:', res.status);
console.log('Body:', JSON.stringify(json, null, 2));

if (res.ok && json.success && json.data?.accessToken) {
  console.log('\nOK: accessToken present (length', json.data.accessToken.length, ')');
  process.exit(0);
}

console.error('\nFAIL: expected 200 + success + data.accessToken');
process.exit(1);
