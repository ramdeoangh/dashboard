/**
 * @param {{ partnerId?: unknown }} auth - req.auth from JWT
 * @param {unknown} bodyPartnerId - partner_id from request body (global admin only)
 * @returns {number | null} Effective partner id for writes, or null if unset (invalid for project create when actor is global)
 */
export function actorPartnerId(auth) {
  const raw = auth?.partnerId;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Partner id for filtering lists (same as actorPartnerId but explicit name).
 */
export function listScopePartnerId(auth) {
  return actorPartnerId(auth);
}

/**
 * When creating a project: partner users always use their partner; global admins must pass partner_id.
 */
export function resolveProjectPartnerIdForCreate(auth, bodyPartnerId) {
  const scoped = actorPartnerId(auth);
  if (scoped) return scoped;
  const fromBody = bodyPartnerId != null ? Number(bodyPartnerId) : null;
  if (Number.isInteger(fromBody) && fromBody > 0) return fromBody;
  return null;
}
