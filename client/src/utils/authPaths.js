/** Default app home after sign-in: partner users → portal; global admins → admin. */
export function defaultHomePath(user) {
  if (!user) return '/login';
  if (user.partnerId != null) return '/portal';
  if (user.adminNav?.length) return '/admin';
  return '/portal';
}

/**
 * Respect deep-link `from` (e.g. return to /admin/... or /portal/...) when the user is allowed to go there.
 */
export function postLoginNavigatePath(from, user) {
  if (!user) return '/login';
  const f = typeof from === 'string' ? from : '';
  if (f.startsWith('/admin')) {
    if (user.adminNav?.length) return f;
    return defaultHomePath(user);
  }
  if (f.startsWith('/portal')) return f;
  return defaultHomePath(user);
}
