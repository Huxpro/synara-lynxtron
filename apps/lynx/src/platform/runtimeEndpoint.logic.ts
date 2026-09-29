export const DEFAULT_SYNARA_SOCKET_URL = "ws://127.0.0.1:58090";
export const DEFAULT_SYNARA_HTTP_ORIGIN = "http://localhost:58090";

export function resolveRuntimeSocketUrl(explicitUrl: unknown, configuredUrl: unknown): string {
  const explicit = typeof explicitUrl === "string" ? explicitUrl.trim() : "";
  if (explicit.length > 0) return explicit;
  const configured = typeof configuredUrl === "string" ? configuredUrl.trim() : "";
  if (configured.length > 0) return configured;
  return DEFAULT_SYNARA_SOCKET_URL;
}

export function resolveRuntimeHttpOrigin(configuredUrl: unknown): string {
  const value = typeof configuredUrl === "string" ? configuredUrl.trim() : "";
  const match = value?.match(/^(ws|wss):\/\/([^/]+)/i);
  if (!match) return DEFAULT_SYNARA_HTTP_ORIGIN;
  return `${match[1].toLowerCase() === "wss" ? "https" : "http"}://${match[2]}`;
}
