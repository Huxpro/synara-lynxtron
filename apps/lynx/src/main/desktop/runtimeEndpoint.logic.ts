export function resolveSynaraWsUrl(
  configuredUrl: string | undefined
): string {
  const candidate = configuredUrl?.trim() || 'ws://127.0.0.1:58090';
  const parsed = new URL(candidate);
  if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
    throw new Error('Synara endpoint requires a ws:// or wss:// URL.');
  }
  return parsed.origin;
}
