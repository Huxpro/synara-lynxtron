// Lynx-for-Web host: one request-scoped stream over the relay WebSocket, as a
// `ScopedStreamOpener` for `scopedStreamRegistry.logic.ts`. Kept free of the
// web-host module's DOM side effects so the connection-time cancel race is
// unit-testable: the registry marks the entry cancelled, this opener checks
// `isCancelled()` once the (possibly pending) connection resolves and never
// sends the request, and `cancel()` after sending interrupts it server-side.

import type { ScopedStreamHandle } from "../scopedStreamRegistry.logic";

export interface RelaySocketLike {
  send(data: string): void;
}

/** Structural twin of the web host's `PendingRelayRequest`. */
export interface RelayPendingStreamRequest {
  readonly tag: string;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout> | null;
  readonly chunks?: unknown[];
  readonly onItem?: (item: unknown) => void;
}

export interface WebRelayScopedStreamDeps<Socket extends RelaySocketLike> {
  readonly ensureSocket: () => Promise<Socket>;
  readonly isSocketOpen: (socket: Socket) => boolean;
  readonly nextRequestId: () => string;
  readonly pending: Map<string, RelayPendingStreamRequest>;
  readonly onItem: (item: unknown) => void;
  readonly onSendFailure: (socket: Socket, error: Error) => void;
  readonly describeError: (error: unknown) => string;
}

export function openWebRelayScopedStream<Socket extends RelaySocketLike>(
  tag: string,
  payload: unknown,
  deps: WebRelayScopedStreamDeps<Socket>,
  isCancelled: () => boolean,
): ScopedStreamHandle {
  let requestId: string | null = null;
  let socketRef: Socket | null = null;
  let settleLocally: (() => void) | null = null;

  const settled = (async () => {
    const socket = await deps.ensureSocket();
    if (isCancelled()) return;
    const id = deps.nextRequestId();
    requestId = id;
    socketRef = socket;
    await new Promise<void>((resolve, reject) => {
      settleLocally = () => {
        deps.pending.delete(id);
        resolve();
      };
      deps.pending.set(id, {
        tag,
        resolve: () => resolve(),
        reject,
        timer: null,
        onItem: deps.onItem,
      });
      try {
        socket.send(JSON.stringify({ _tag: "Request", id, tag, payload, headers: [] }));
      } catch (error) {
        deps.pending.delete(id);
        const transportError = new Error(
          `Synara RPC ${tag} send failed: ${deps.describeError(error)}`,
        );
        reject(transportError);
        deps.onSendFailure(socket, transportError);
      }
    });
  })();

  return {
    settled,
    cancel: () => {
      // Before the request is on the wire the opener skips it (see above);
      // afterwards settle locally first so the server's interrupt Exit is
      // ignored for this request id, then interrupt it.
      if (requestId === null || socketRef === null) return;
      const id = requestId;
      const socket = socketRef;
      if (!deps.pending.has(id)) return;
      settleLocally?.();
      try {
        if (deps.isSocketOpen(socket)) {
          socket.send(JSON.stringify({ _tag: "Interrupt", requestId: id }));
        }
      } catch {
        // The socket is already unusable; the pending entry is gone either way.
      }
    },
  };
}
