// FILE: platform/net.socket.ts (Lynx impl)
// Purpose: L1 net.socket port for the Lynx target, per decision D4: the
//   pre-registered LynxWebSocketModule via the official @lynx-js/websocket
//   W3C wrapper (text frames; RTT ~0.5-1ms per P0-S2). Contract-aligned with
//   synara/apps/web/src/platform/socket.ts (createWebSocket +
//   resolveDefaultSocketUrl shape; the effect-layer adapter stays web-side
//   until the Lynx app needs effect RpcClient there).
// Layer: L1 platform port (lynx implementation)

import "background-only";

import {
  GlobalEventEmitter,
  type LynxWebSocketModule,
  type WebSocketClosedEvent,
  type WebSocketFailedEvent,
  type WebSocketMessageEvent,
  type WebSocketOpenEvent,
} from "@lynx-js/websocket/impl";

import { resolveRuntimeSocketUrl } from "./runtimeEndpoint.logic";
import { configuredRuntimeSocketUrl } from "./runtimeEndpointSource";

type SocketEvent = {
  readonly type: string;
  readonly target: NativeRpcWebSocket;
  readonly data?: string;
  readonly code?: number;
  readonly reason?: string;
  readonly message?: string;
};

let nextSocketId = 1_000_000;

/**
 * Minimal W3C-shaped facade for Synara RPC.
 *
 * @lynx-js/websocket 0.0.4 marks its wrapper CLOSED before application close
 * listeners run. Calling close() from that listener therefore becomes a no-op,
 * while Lynxtron 0.0.7 leaves the native descriptor in CLOSE_WAIT. Owning the
 * native id here lets us issue the idempotent native close even after a remote
 * close notification and keeps long-running polling from exhausting FDs.
 */
class NativeRpcWebSocket {
  readonly url: string;
  private readonly socketId = nextSocketId++;
  private readonly socketModule = (
    NativeModules as {
      readonly LynxWebSocketModule?: LynxWebSocketModule;
    }
  ).LynxWebSocketModule;
  private readonly listeners = new Map<string, Set<(event: SocketEvent) => void>>();
  private nativeCloseSent = false;
  private readyState = 0;

  constructor(url: string, protocols?: string | string[], options: WebSocketOptions = {}) {
    this.url = url;
    if (!this.socketModule) {
      throw new Error("LynxWebSocketModule is unavailable.");
    }
    GlobalEventEmitter.addListener("websocketMessage", this.onMessage, this);
    GlobalEventEmitter.addListener("websocketOpen", this.onOpen, this);
    GlobalEventEmitter.addListener("websocketClosed", this.onClosed, this);
    GlobalEventEmitter.addListener("websocketFailed", this.onFailed, this);
    this.socketModule.connect(
      url,
      typeof protocols === "string" ? [protocols] : (protocols ?? []),
      options,
      this.socketId,
    );
  }

  addEventListener(type: string, listener: (event: SocketEvent) => void): void {
    const entries = this.listeners.get(type) ?? new Set();
    entries.add(listener);
    this.listeners.set(type, entries);
  }

  send(data: string): void {
    if (this.readyState === 0) throw new Error("INVALID_STATE_ERR");
    if (this.readyState !== 1) return;
    this.socketModule?.send(data, this.socketId);
  }

  close(): void {
    this.forceNativeClose();
  }

  private forceNativeClose(): void {
    if (this.nativeCloseSent) return;
    this.nativeCloseSent = true;
    this.readyState = 2;
    this.socketModule?.close(1000, "", this.socketId);
  }

  private emit(type: string, detail: Omit<SocketEvent, "type" | "target"> = {}) {
    const event: SocketEvent = { type, target: this, ...detail };
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  private unregister(): void {
    GlobalEventEmitter.removeListener("websocketMessage", this.onMessage);
    GlobalEventEmitter.removeListener("websocketOpen", this.onOpen);
    GlobalEventEmitter.removeListener("websocketClosed", this.onClosed);
    GlobalEventEmitter.removeListener("websocketFailed", this.onFailed);
  }

  private readonly onMessage = (event: WebSocketMessageEvent): void => {
    if (event.id !== this.socketId) return;
    this.emit("message", { data: event.data });
  };

  private readonly onOpen = (event: WebSocketOpenEvent): void => {
    if (event.id !== this.socketId) return;
    this.readyState = 1;
    this.emit("open");
  };

  private readonly onClosed = (event: WebSocketClosedEvent): void => {
    if (event.id !== this.socketId) return;
    // Force the native close before publishing the terminal event. The public
    // wrapper cannot do this because it has already transitioned to CLOSED.
    this.forceNativeClose();
    this.readyState = 3;
    this.emit("close", { code: event.code, reason: event.reason });
    this.unregister();
  };

  private readonly onFailed = (event: WebSocketFailedEvent): void => {
    if (event.id !== this.socketId) return;
    this.forceNativeClose();
    this.readyState = 3;
    this.emit("error", { message: event.message });
    this.emit("close", { code: 1006, reason: event.message });
    this.unregister();
  };
}

export type WebSocketLike = NativeRpcWebSocket;
export interface WebSocketOptions {
  readonly headers?: Readonly<Record<string, string>>;
}
export type WebSocketFactory = (
  url: string,
  protocols?: string | string[],
  options?: WebSocketOptions,
) => WebSocketLike;

export const createWebSocket: WebSocketFactory = (url, protocols, options) =>
  new NativeRpcWebSocket(url, protocols, options);

/**
 * WS endpoint resolution for the Lynx app: explicit override → build-time env
 * (injected via rspeedy define if needed) → same-host loopback fallback. There
 * is no desktopBridge/location on this target; the production default comes
 * from the sidecar handshake (P4), so this stays deliberately small.
 */
export function resolveDefaultSocketUrl(explicitUrl: string | null): string {
  return resolveRuntimeSocketUrl(explicitUrl, configuredRuntimeSocketUrl());
}
