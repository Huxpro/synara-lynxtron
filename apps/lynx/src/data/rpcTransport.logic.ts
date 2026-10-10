export interface RpcTransportSocket {
  send(data: string): void;
  close(): void;
  addEventListener(type: string, listener: (event: any) => void): void;
}

export type RpcTransportState = "idle" | "connecting" | "connected" | "reconnecting" | "offline";

export type StartRpcTimeout = (milliseconds: number, onTimeout: () => void) => () => void;

interface RpcExit {
  readonly _tag: "Exit";
  readonly requestId: string;
  readonly exit:
    | { readonly _tag: "Success"; readonly value: unknown }
    | { readonly _tag: "Failure"; readonly cause?: unknown };
}

interface RpcChunk {
  readonly _tag: "Chunk";
  readonly requestId: string;
  readonly values: readonly unknown[];
}

interface PendingRpc {
  readonly tag: string;
  readonly cancelTimeout: () => void;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly onChunk?: (value: unknown) => void;
}

interface RpcSocketContext {
  failed: boolean;
  readonly pending: Map<string, PendingRpc>;
}

interface RpcRequestHandle {
  readonly interrupt: () => void;
}

export interface RpcStreamHandle {
  /** Resolves when the stream ends (including after `cancel()`); rejects on transport failure. */
  readonly settled: Promise<void>;
  readonly cancel: () => void;
}

import { describeRpcFailureCause } from "../main/rpcFailure.logic";

export class RpcTransportError extends Error {
  readonly name = "RpcTransportError";
}

export function isRpcTransportError(error: unknown): boolean {
  return (
    error instanceof RpcTransportError ||
    (error instanceof Error && error.name === "RpcTransportError")
  );
}

function describeError(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object" && "message" in value) {
    return String((value as { message?: unknown }).message);
  }
  return String(value);
}

function safeClose(socket: RpcTransportSocket): void {
  try {
    socket.close();
  } catch {
    // A failed transport is already unusable.
  }
}

export function openRpcSocketWithTimeout(input: {
  readonly createSocket: () => RpcTransportSocket;
  readonly timeoutMs: number;
  readonly startTimeout: StartRpcTimeout;
}): Promise<RpcTransportSocket> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let cancelTimeout: () => void = () => undefined;
    const socket = input.createSocket();
    const finishFailure = (error: Error) => {
      if (settled) return;
      settled = true;
      cancelTimeout();
      safeClose(socket);
      reject(error);
    };
    cancelTimeout = input.startTimeout(input.timeoutMs, () => {
      finishFailure(new RpcTransportError(`WebSocket open timed out after ${input.timeoutMs}ms`));
    });
    socket.addEventListener("open", () => {
      if (settled) return;
      settled = true;
      cancelTimeout();
      resolve(socket);
    });
    socket.addEventListener("error", (event: unknown) => {
      finishFailure(new RpcTransportError(`WebSocket open failed: ${describeError(event)}`));
    });
    socket.addEventListener("close", () => {
      finishFailure(new RpcTransportError("WebSocket closed before open"));
    });
  });
}

function attachRpcSocketContext(
  socket: RpcTransportSocket,
  onTransportFailure: (socket: RpcTransportSocket, error: Error) => void,
): RpcSocketContext {
  const context: RpcSocketContext = { failed: false, pending: new Map() };
  const failAll = (error: Error) => {
    if (context.failed) return;
    context.failed = true;
    for (const request of context.pending.values()) {
      request.cancelTimeout();
      request.reject(error);
    }
    context.pending.clear();
    onTransportFailure(socket, error);
  };
  socket.addEventListener("error", (event: unknown) => {
    failAll(new RpcTransportError(`socket error: ${describeError(event)}`));
  });
  socket.addEventListener("close", () => {
    failAll(new RpcTransportError("socket closed"));
  });
  return context;
}

export function createRpcSocketManager(input: {
  readonly connect: () => Promise<RpcTransportSocket>;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly startTimeout: StartRpcTimeout;
  readonly nextRequestId: () => string;
  readonly requestTimeoutMs: number;
  readonly maxReconnectAttempts: number;
  readonly initialReconnectDelayMs: number;
  readonly maxReconnectDelayMs: number;
  readonly offlineRetryDelayMs?: number;
  readonly now?: () => number;
  readonly closeWhenIdle?: boolean;
  readonly autoReconnectOnFailure?: boolean;
}) {
  let activeSocket: RpcTransportSocket | null = null;
  let connectionPromise: Promise<RpcTransportSocket> | null = null;
  let recoveryPromise: Promise<void> | null = null;
  let recoveryGeneration = 0;
  let disposed = false;
  let everConnected = false;
  let offlineUntilMs = 0;
  let state: RpcTransportState = "idle";
  const listeners = new Set<(state: RpcTransportState) => void>();
  const contexts = new WeakMap<RpcTransportSocket, RpcSocketContext>();

  const publishState = (next: RpcTransportState) => {
    if (state === next) return;
    state = next;
    for (const listener of listeners) listener(state);
  };

  const retire = (socket: RpcTransportSocket) => {
    if (activeSocket !== socket) return;
    activeSocket = null;
    connectionPromise = null;
    publishState("idle");
    safeClose(socket);
  };

  const startBackgroundRecovery = () => {
    if (!input.autoReconnectOnFailure || disposed || activeSocket || recoveryPromise) {
      return;
    }
    const generation = ++recoveryGeneration;
    const pending = (async () => {
      while (!disposed && generation === recoveryGeneration && !activeSocket) {
        if (state === "offline") {
          await input.sleep(input.offlineRetryDelayMs ?? 0);
          if (disposed || generation !== recoveryGeneration || activeSocket) return;
        }
        try {
          await getSocket();
          return;
        } catch {
          // connectWithBackoff publishes the actionable state. Keep retrying
          // after the offline window so recovery never depends on a UI poll.
        }
      }
    })();
    recoveryPromise = pending;
    void pending
      .finally(() => {
        if (recoveryPromise === pending) recoveryPromise = null;
      })
      .catch(() => {
        // Background recovery has no caller to observe the original promise.
        // A later request or state transition can start a fresh recovery loop.
      });
  };

  const invalidate = (socket: RpcTransportSocket, error: Error) => {
    if (activeSocket !== socket) return;
    activeSocket = null;
    connectionPromise = null;
    publishState(input.autoReconnectOnFailure ? "reconnecting" : "idle");
    safeClose(socket);
    startBackgroundRecovery();
  };

  const contextFor = (socket: RpcTransportSocket) => {
    const existing = contexts.get(socket);
    if (existing) return existing;
    const context = attachRpcSocketContext(socket, invalidate);
    contexts.set(socket, context);
    return context;
  };

  const connectWithBackoff = async (): Promise<RpcTransportSocket> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= input.maxReconnectAttempts; attempt += 1) {
      if (disposed) throw new RpcTransportError("client disposed");
      publishState(
        state === "reconnecting" || state === "offline" || attempt > 0
          ? "reconnecting"
          : "connecting",
      );
      try {
        const socket = await input.connect();
        if (disposed) {
          safeClose(socket);
          throw new RpcTransportError("client disposed");
        }
        activeSocket = socket;
        everConnected = true;
        offlineUntilMs = 0;
        contextFor(socket);
        publishState("connected");
        return socket;
      } catch (error) {
        lastError = error instanceof Error ? error : new RpcTransportError(String(error));
        if (attempt >= input.maxReconnectAttempts) break;
        const delay = Math.min(
          input.initialReconnectDelayMs * 2 ** attempt,
          input.maxReconnectDelayMs,
        );
        await input.sleep(delay);
      }
    }
    offlineUntilMs = (input.now?.() ?? Date.now()) + (input.offlineRetryDelayMs ?? 0);
    publishState("offline");
    startBackgroundRecovery();
    throw lastError ?? new RpcTransportError("connection failed");
  };

  const getSocket = (): Promise<RpcTransportSocket> => {
    if (activeSocket) return Promise.resolve(activeSocket);
    if (connectionPromise) return connectionPromise;
    if (state === "offline" && (input.now?.() ?? Date.now()) < offlineUntilMs) {
      return Promise.reject(new RpcTransportError("Synara is offline; reconnect cooling down"));
    }
    const pending = connectWithBackoff();
    connectionPromise = pending;
    void pending
      .finally(() => {
        if (connectionPromise === pending && activeSocket === null) {
          connectionPromise = null;
        }
      })
      .catch(() => {
        // The caller observes the original pending promise.
      });
    return pending;
  };

  const requestOnSocket = <A extends unknown>(
    socket: RpcTransportSocket,
    tag: string,
    payload: unknown,
    onChunk?: (value: unknown) => void,
    timeoutMs: number | null = input.requestTimeoutMs,
    onStarted?: (handle: RpcRequestHandle) => void,
  ): Promise<A> => {
    const context = contextFor(socket);
    if (context.failed) {
      return Promise.reject(new RpcTransportError("socket unavailable"));
    }
    const id = input.nextRequestId();
    return new Promise((resolve, reject) => {
      const failTransport = (error: Error) => {
        if (context.failed) return;
        context.failed = true;
        for (const pending of context.pending.values()) {
          pending.cancelTimeout();
          pending.reject(error);
        }
        context.pending.clear();
        invalidate(socket, error);
      };
      const cancelTimeout =
        timeoutMs === null
          ? () => undefined
          : input.startTimeout(timeoutMs, () => {
              failTransport(
                new RpcTransportError(`Synara RPC ${tag} timed out after ${timeoutMs}ms`),
              );
            });
      context.pending.set(id, {
        tag,
        cancelTimeout,
        resolve: (value) => resolve(value as A),
        reject,
        ...(onChunk ? { onChunk } : {}),
      });
      try {
        socket.send(
          JSON.stringify({
            _tag: "Request",
            id,
            tag,
            payload,
            headers: [],
          }),
        );
      } catch (error) {
        failTransport(
          new RpcTransportError(`Synara RPC ${tag} send failed: ${describeError(error)}`),
        );
        return;
      }
      onStarted?.({
        // Settle locally first so the server's interrupt Exit, which arrives
        // with a failure cause, is ignored for this request id.
        interrupt: () => {
          const pending = context.pending.get(id);
          if (!pending) return;
          context.pending.delete(id);
          pending.cancelTimeout();
          try {
            socket.send(JSON.stringify({ _tag: "Interrupt", requestId: id }));
          } catch {
            // The socket is already unusable; the pending entry is gone either way.
          }
          pending.resolve(undefined);
        },
      });
    });
  };

  const attachResponseListener = (socket: RpcTransportSocket) => {
    socket.addEventListener("message", (event: { data?: unknown }) => {
      if (typeof event.data !== "string") return;
      let response: RpcExit | RpcChunk;
      try {
        response = JSON.parse(event.data) as RpcExit | RpcChunk;
      } catch {
        return;
      }
      const context = contexts.get(socket);
      const pending = context?.pending.get(response.requestId);
      if (!pending) return;
      if (response._tag === "Chunk") {
        for (const value of response.values) pending.onChunk?.(value);
        try {
          socket.send(
            JSON.stringify({
              _tag: "Ack",
              requestId: response.requestId,
            }),
          );
        } catch (error) {
          const transportError = new RpcTransportError(
            `Synara RPC ${pending.tag} acknowledgement failed: ${describeError(error)}`,
          );
          context!.failed = true;
          for (const request of context!.pending.values()) {
            request.cancelTimeout();
            request.reject(transportError);
          }
          context!.pending.clear();
          invalidate(socket, transportError);
        }
        return;
      }
      if (response._tag !== "Exit") return;
      context?.pending.delete(response.requestId);
      pending.cancelTimeout();
      if (response.exit._tag === "Success") {
        pending.resolve(response.exit.value);
      } else {
        // `rpcFailure` keeps the typed error (code, retry hints) the message flattens.
        pending.reject(
          Object.assign(
            new Error(`Synara RPC ${pending.tag} failed: ${JSON.stringify(response.exit.cause)}`),
            { rpcFailure: describeRpcFailureCause(response.exit.cause) },
          ),
        );
      }
      if (input.closeWhenIdle && context && context.pending.size === 0) {
        // Lynxtron 0.0.7 can leave remotely-closed native sockets in
        // CLOSE_WAIT. Retire the raw facade socket from the client side as
        // soon as its final response settles so the host releases the FD.
        context.failed = true;
        retire(socket);
      }
    });
  };

  const originalContextFor = contextFor;
  const socketsWithResponseListener = new WeakSet<RpcTransportSocket>();
  const ensureResponseListener = (socket: RpcTransportSocket) => {
    const context = originalContextFor(socket);
    if (!socketsWithResponseListener.has(socket)) {
      socketsWithResponseListener.add(socket);
      attachResponseListener(socket);
    }
    return context;
  };

  return {
    async request<A>(
      tag: string,
      payload: unknown,
      options?: { readonly timeoutMs?: number | null },
    ): Promise<A> {
      const socket = await getSocket();
      ensureResponseListener(socket);
      return requestOnSocket<A>(
        socket,
        tag,
        payload,
        undefined,
        options?.timeoutMs === undefined ? input.requestTimeoutMs : options.timeoutMs,
      );
    },
    /**
     * A stream request: every chunk goes to `onChunk`, `settled` resolves when
     * the server ends it. `cancel()` sends an Effect RPC `Interrupt` for the
     * request and settles the stream locally. Cancelling before the socket is
     * open just skips sending the request.
     */
    openStream<A>(tag: string, payload: unknown, onChunk: (value: A) => void): RpcStreamHandle {
      let cancelled = false;
      let interrupt: (() => void) | null = null;
      const settled = (async () => {
        const socket = await getSocket();
        if (cancelled) return;
        ensureResponseListener(socket);
        await requestOnSocket<void>(
          socket,
          tag,
          payload,
          (value) => onChunk(value as A),
          null,
          (handle) => {
            interrupt = handle.interrupt;
            if (cancelled) handle.interrupt();
          },
        );
      })();
      return {
        settled,
        cancel: () => {
          cancelled = true;
          interrupt?.();
        },
      };
    },
    getState(): RpcTransportState {
      return state;
    },
    subscribe(listener: (state: RpcTransportState) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose(): void {
      disposed = true;
      recoveryGeneration += 1;
      const socket = activeSocket;
      activeSocket = null;
      connectionPromise = null;
      publishState("idle");
      if (socket) safeClose(socket);
    },
  };
}
