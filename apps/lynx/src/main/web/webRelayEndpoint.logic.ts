export function resolveWebRelayEndpoint(
  runtimeValue: unknown,
  buildValue: unknown,
  fallback: string
): string {
  const runtime = String(runtimeValue ?? '').trim();
  if (runtime) return runtime;
  const build = String(buildValue ?? '').trim();
  return build || fallback;
}

export function normalizeWebRelayUrl(value: unknown): string {
  const candidate = String(value ?? '').trim();
  const url = new URL(candidate);
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('Synara relay endpoint must use ws: or wss:');
  }
  url.pathname = '/';
  url.hash = '';
  return url.href.replace(/\/$/, '');
}

export function buildWebRelaySocketUrl(
  baseUrl: string,
  pathAndQuery: string
): string {
  const base = new URL(baseUrl);
  const target = new URL(pathAndQuery, base.origin);
  for (const [key, value] of base.searchParams) {
    if (!target.searchParams.has(key)) target.searchParams.set(key, value);
  }
  return target.href;
}
