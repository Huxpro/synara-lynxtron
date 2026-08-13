const ALLOWED_WEB_INITIAL_ROUTES = new Set([
  '/',
  '/automations',
  '/kanban',
  '/plugins',
  '/pull-requests',
  '/settings',
  '/studio',
  '/update',
]);

export function resolveWebInitialRoute(search: string): string | null {
  const candidate = new URLSearchParams(search).get('route')?.trim();
  if (!candidate || !candidate.startsWith('/')) return null;
  if (ALLOWED_WEB_INITIAL_ROUTES.has(candidate)) return candidate;
  if (/^\/(?:automations|kanban|new-thread|thread)\/[^/]+$/.test(candidate)) {
    return candidate;
  }
  if (/^\/settings\/[^/]+$/.test(candidate)) return candidate;
  return null;
}
