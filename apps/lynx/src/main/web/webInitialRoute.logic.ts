const ALLOWED_WEB_INITIAL_ROUTES = new Set([
  "/",
  "/automations",
  "/components-lab",
  "/kanban",
  "/plugins",
  "/pull-requests",
  "/settings",
  "/studio",
  "/update",
]);

export function resolveWebInitialRoute(search: string): string | null {
  const candidate = new URLSearchParams(search).get("route")?.trim();
  if (!candidate || !candidate.startsWith("/")) return null;
  const route = new URL(candidate, "http://synara.local");
  if (ALLOWED_WEB_INITIAL_ROUTES.has(route.pathname)) return candidate;
  if (/^\/(?:automations|kanban|new-thread|thread)\/[^/]+$/.test(candidate)) {
    return candidate;
  }
  if (/^\/settings\/[^/]+$/.test(candidate)) return candidate;
  return null;
}
