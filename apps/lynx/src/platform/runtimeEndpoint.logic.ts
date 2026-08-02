export const DEFAULT_SYNARA_SOCKET_URL = 'ws://127.0.0.1:58090';
export const DEFAULT_SYNARA_HTTP_ORIGIN = 'http://localhost:58090';

export function resolveRuntimeSocketUrl(
  explicitUrl: string | null,
  configuredUrl: string | undefined
): string {
  if (explicitUrl && explicitUrl.trim().length > 0) return explicitUrl;
  if (configuredUrl && configuredUrl.trim().length > 0) return configuredUrl;
  return DEFAULT_SYNARA_SOCKET_URL;
}

export function resolveRuntimeHttpOrigin(
  configuredUrl: string | undefined
): string {
  const value = configuredUrl?.trim();
  const match = value?.match(/^(ws|wss):\/\/([^/]+)/i);
  if (!match) return DEFAULT_SYNARA_HTTP_ORIGIN;
  return `${match[1].toLowerCase() === 'wss' ? 'https' : 'http'}://${match[2]}`;
}
