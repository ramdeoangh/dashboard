import { getPool } from '../config/database.js';

const KEYS = new Set([
  'portal.name',
  'portal.logo_path',
  'portal.header_html',
  'portal.footer_html',
  'email.smtp_host',
  'email.smtp_port',
  'email.smtp_user',
  'email.smtp_secure',
  'email.from_address',
  'email.smtp_pass',
]);

export async function getAllSettings() {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT setting_key, setting_value FROM settings ORDER BY setting_key`);
  const out = {};
  for (const r of rows) {
    try {
      out[r.setting_key] = JSON.parse(r.setting_value ?? 'null');
    } catch {
      out[r.setting_key] = r.setting_value;
    }
  }
  return out;
}

export async function getPublicPortalSettings() {
  const all = await getAllSettings();
  return {
    portalName: all['portal.name'] ?? 'Portal',
    logoPath: all['portal.logo_path'] ?? null,
    headerHtml: all['portal.header_html'] ?? '',
    footerHtml: all['portal.footer_html'] ?? '',
  };
}

export async function updateSettings(patch) {
  const pool = getPool();
  for (const [k, v] of Object.entries(patch)) {
    if (!KEYS.has(k)) continue;
    const json = JSON.stringify(v === undefined ? null : v);
    await pool.execute(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [k, json]
    );
  }
  return getAllSettings();
}

export async function setLogoPath(relativePath) {
  await updateSettings({ 'portal.logo_path': relativePath });
}
