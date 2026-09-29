import { readHostRuntimeSocketUrl } from "./runtimeEndpoint.logic";

/**
 * The Synara backend this renderer belongs to.
 *
 * Native: the Lynxtron host passes the backend URL it is actually connected to
 * as `runtimeWsUrl` init data on every bundle load. Init data is set on both
 * Lynx threads before the first render, so synchronous callers (first-screen
 * rendering included) see the live endpoint and a bundle is never tied to the
 * port it happened to be built against.
 *
 * Web (Lynx-for-Web): there is no host init data; the build-time define below
 * carries the relay endpoint.
 */
export function configuredRuntimeSocketUrl(): string | undefined {
  const initData =
    typeof lynx === "undefined"
      ? undefined
      : (lynx as unknown as { readonly __initData?: unknown }).__initData;
  // `process.env.SYNARA_WS_URL` is replaced verbatim at build time.
  return readHostRuntimeSocketUrl(initData) ?? process.env.SYNARA_WS_URL;
}
