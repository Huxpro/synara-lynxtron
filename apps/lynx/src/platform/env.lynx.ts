import { resolveRuntimeHttpOrigin } from "./runtimeEndpoint.logic";
import { configuredRuntimeSocketUrl } from "./runtimeEndpointSource";

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
  // Derived from the same live endpoint as RPC, so attachment URLs and the
  // backend can never point at different servers.
  return resolveRuntimeHttpOrigin(configuredRuntimeSocketUrl());
}

export function getNavigatorPlatform(): string {
  return "MacIntel";
}

export function getNavigatorUserAgent(): string {
  return "Lynxtron";
}

export function getNavigatorLanguage(): string {
  return "en-US";
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
