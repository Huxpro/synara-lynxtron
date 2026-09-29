export function resolveWebRelayEndpoint(...candidates: readonly unknown[]): string {
  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

export function normalizeWebRelayUrl(value: unknown): string {
  const candidate = String(value ?? "").trim();
  const url = new URL(candidate);
  if (url.protocol !== "ws:" && url.protocol !== "wss:") {
    throw new Error("Synara relay endpoint must use ws: or wss:");
  }
  url.pathname = "/";
  url.hash = "";
  return url.href.replace(/\/$/, "");
}

export function buildWebRelaySocketUrl(baseUrl: string, pathAndQuery: string): string {
  const base = new URL(baseUrl);
  const target = new URL(pathAndQuery, base.origin);
  for (const [key, value] of base.searchParams) {
    if (!target.searchParams.has(key)) target.searchParams.set(key, value);
  }
  return target.href;
}
