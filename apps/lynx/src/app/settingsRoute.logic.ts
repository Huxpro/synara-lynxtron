export interface ParsedSettingsRoute {
  readonly section: string | null;
  readonly target: string | null;
}

export function parseSettingsRouteLocation(
  location: string
): ParsedSettingsRoute | null {
  const [pathname, search = ''] = location.split('?', 2);
  const match = pathname.match(/^\/settings(?:\/([^/]+))?$/);
  if (!match) return null;
  return {
    section: match[1] ?? null,
    target: new URLSearchParams(search).get('target')?.trim() || null,
  };
}

export function settingsRouteLocation(
  section: string,
  target?: string | null
): string {
  const search = target ? `?target=${encodeURIComponent(target)}` : '';
  return `/settings/${section}${search}`;
}
