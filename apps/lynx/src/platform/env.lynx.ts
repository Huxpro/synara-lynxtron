import { resolveRuntimeHttpOrigin } from './runtimeEndpoint.logic';

/**
 * Lynx environment adapter for shared feature modules that gate synchronous
 * renderer-side services behind the Web `isBrowser()` contract.
 *
 * The Lynx renderer is not a DOM browser, but its hydrated storage mirror is
 * available synchronously at render time and should take the persisted path.
 */
export function isBrowser(): boolean {
  return true;
}

/**
 * Base used only by shared URL normalization when a snapshot contains a
 * relative attachment URL. Lynx rendering still fetches through its explicit
 * socket/server ports; there is no DOM location object to consult.
 */
export function getLocationOrigin(): string {
  // Replaced at build time together with the socket port. Keeping attachment
  // origin and RPC endpoint coupled prevents mixed-snapshot certification.
  const socketUrl = process.env.SYNARA_WS_URL;
  return resolveRuntimeHttpOrigin(socketUrl);
}

export function getNavigatorPlatform(): string {
  return 'MacIntel';
}

export function getNavigatorUserAgent(): string {
  return 'Lynxtron';
}

export function getNavigatorLanguage(): string {
  return 'en-US';
}

/** Native callers with an exact viewport should pass it explicitly. */
export function getViewportWidth(): number {
  return 0;
}

/** Native callers with an exact viewport should pass it explicitly. */
export function getViewportHeight(): number {
  return 0;
}

export function matchMediaSafe(): null {
  return null;
}

export function getDocumentElement(): null {
  return null;
}
