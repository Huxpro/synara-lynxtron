export const DEFAULT_SYNARA_SOCKET_URL = "ws://127.0.0.1:58090";
export const DEFAULT_SYNARA_HTTP_ORIGIN = "http://localhost:58090";

export function resolveRuntimeSocketUrl(explicitUrl: unknown, configuredUrl: unknown): string {
  const explicit = typeof explicitUrl === "string" ? explicitUrl.trim() : "";
  if (explicit.length > 0) return explicit;
  const configured = typeof configuredUrl === "string" ? configuredUrl.trim() : "";
  if (configured.length > 0) return configured;
  return DEFAULT_SYNARA_SOCKET_URL;
}

/**
 * The backend URL the desktop host hands to the renderer in its init data
 * (`runtimeWsUrl`). Anything that is not a ws(s) URL is ignored so a malformed
 * host value falls back to the configured endpoint instead of breaking RPC.
 */
export function readHostRuntimeSocketUrl(initData: unknown): string | null {
  if (!initData || typeof initData !== "object") return null;
  const value = (initData as { readonly runtimeWsUrl?: unknown }).runtimeWsUrl;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^wss?:\/\//i.test(trimmed) ? trimmed : null;
}

export function resolveRuntimeHttpOrigin(configuredUrl: unknown): string {
  const value = typeof configuredUrl === "string" ? configuredUrl.trim() : "";
  const match = value?.match(/^(ws|wss):\/\/([^/]+)/i);
  if (!match) return DEFAULT_SYNARA_HTTP_ORIGIN;
  return `${match[1]!.toLowerCase() === "wss" ? "https" : "http"}://${match[2]}`;
}
