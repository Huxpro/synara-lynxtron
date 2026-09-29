// FILE: platform/socket.ts
// Purpose: L1 platform port — WebSocket construction and default URL resolution.
//   Web impl uses the global WebSocket. The Lynx impl swaps in
//   @lynx-js/websocket (text frames only) per synara-lynx decision D4.
// Layer: L1 platform port (web implementation)
// Exports: WebSocketFactory, createWebSocket, layerWebSocketConstructorFromPort,
//   resolveDefaultSocketUrl

import { Layer } from "effect";
import * as Socket from "effect/unstable/socket/Socket";

export type WebSocketFactory = (url: string, protocols?: string | string[]) => WebSocket;

export const createWebSocket: WebSocketFactory = (url, protocols) => new WebSocket(url, protocols);

/**
 * effect `Socket` constructor layer sourced from the port. Drop-in replacement
 * for `Socket.layerWebSocketConstructorGlobal` so the transport never touches
 * the global constructor directly.
 */
export const layerWebSocketConstructorFromPort: Layer.Layer<Socket.WebSocketConstructor> =
  Layer.succeed(Socket.WebSocketConstructor)((url, protocols) => createWebSocket(url, protocols));

/**
 * Default WS endpoint resolution, in the historical precedence order:
 * desktop bridge override → build-time env → same-origin location.
 */
export function resolveDefaultSocketUrl(explicitUrl: string | null): string {
  if (explicitUrl) return explicitUrl;
  if (typeof window !== "undefined") {
    const bridgeUrl = window.desktopBridge?.getWsUrl();
    if (bridgeUrl && bridgeUrl.length > 0) return bridgeUrl;
    const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
    if (envUrl && envUrl.length > 0) return envUrl;
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${window.location.port}`;
  }
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
  return envUrl && envUrl.length > 0 ? envUrl : "";
}
