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
