/**
 * Filesystem browsing/import is a host capability and remains outside the
 * first shared palette slice. Returning null preserves the Web component's
 * existing guarded fallback without inventing a DOM bridge.
 */
export function readNativeApi(): null {
  return null;
}

/**
 * Same contract as the Web `ensureNativeApi`: callers that require the native
 * API (instead of degrading on a null read) must fail loudly. Keeping the throw
 * identical means shared call sites take their own documented error path rather
 * than a silent Lynx-only branch.
 */
export function ensureNativeApi(): never {
  throw new Error("Native API not found");
}
