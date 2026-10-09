import WebSocket from "ws";

import {
  createRpcSocketManager,
  isRpcTransportError,
  openRpcSocketWithTimeout,
  type RpcTransportState,
  type StartRpcTimeout,
} from "../../data/rpcTransport.logic";
import {
  nativeEventStreamChannel,
  parseNativeRpcCompatibility,
  type NativeRpcCompatibility,
  type NativeRpcStreamResetReply,
} from "../nativeEventStreams.logic";
import { readRpcFailureDetails, type RpcFailureDetails } from "../rpcFailure.logic";
import { createScopedStreamRegistry } from "../scopedStreamRegistry.logic";
import { resolveSynaraWsUrl } from "./runtimeEndpoint.logic";
import { normalizeLynxRpcPayload } from "../rpcPayload.logic";
import {
  WS_CLIENT_REQUIRED_CAPABILITIES,
  WS_PROTOCOL_EPOCH,
  WS_PROTOCOL_MAX_REVISION,
  WS_PROTOCOL_MIN_REVISION,
} from "@synara/contracts";

const CLIENT_BUILD = "0.5.5-lynx-slice";
const SOCKET_OPEN_TIMEOUT_MS = 8_000;
const RPC_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 6;
const INITIAL_RECONNECT_DELAY_MS = 250;
const MAX_RECONNECT_DELAY_MS = 2_000;
const OFFLINE_RETRY_DELAY_MS = 5_000;
// Negotiated with the same constants the Electron renderer uses, so a server
// protocol bump can never strand Lynx on a revision the server rejects. The
// required capabilities are the upstream client's too: the shared transport
// compat runs the same streams (thread detail snapshots, worktree setup).
const PROTOCOL = {
  epoch: WS_PROTOCOL_EPOCH,
  minRevision: WS_PROTOCOL_MIN_REVISION,
  maxRevision: WS_PROTOCOL_MAX_REVISION,
  capabilities: WS_CLIENT_REQUIRED_CAPABILITIES,
} as const;

const startTimeout: StartRpcTimeout = (milliseconds, onTimeout) => {
  const timer = setTimeout(onTimeout, milliseconds);
  return () => clearTimeout(timer);
};

function openSocket(url: string): Promise<WebSocket> {
  return openRpcSocketWithTimeout({
    timeoutMs: SOCKET_OPEN_TIMEOUT_MS,
    startTimeout,
    createSocket: () => new WebSocket(url),
  }) as Promise<WebSocket>;
}

let requestSequence = 0;

let negotiatedCompatibility: NativeRpcCompatibility | null = null;
const compatibilityListeners = new Set<(compatibility: NativeRpcCompatibility) => void>();

/** Runs before the negotiated socket is opened, so before it reports connected. */
function adoptCompatibility(compatibility: NativeRpcCompatibility): void {
  negotiatedCompatibility = compatibility;
  for (const listener of compatibilityListeners) listener(compatibility);
}

export function subscribeNativeRpcCompatibility(
  listener: (compatibility: NativeRpcCompatibility) => void,
): () => void {
  compatibilityListeners.add(listener);
  return () => compatibilityListeners.delete(listener);
}

function createManager(
  connect: () => Promise<WebSocket>,
  options: {
    readonly maxReconnectAttempts?: number;
    readonly closeWhenIdle?: boolean;
  } = {},
) {
  return createRpcSocketManager({
    connect,
    sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    startTimeout,
    nextRequestId: () => String(++requestSequence),
    requestTimeoutMs: RPC_REQUEST_TIMEOUT_MS,
    maxReconnectAttempts: options.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS,
    initialReconnectDelayMs: INITIAL_RECONNECT_DELAY_MS,
    maxReconnectDelayMs: MAX_RECONNECT_DELAY_MS,
    offlineRetryDelayMs: OFFLINE_RETRY_DELAY_MS,
    closeWhenIdle: options.closeWhenIdle ?? true,
    autoReconnectOnFailure: true,
  });
}

async function negotiate(baseUrl: string): Promise<NativeRpcCompatibility> {
  const bootstrapUrl = new URL(baseUrl);
  bootstrapUrl.pathname = "/ws/bootstrap";
  bootstrapUrl.hash = "";
  const manager = createManager(() => openSocket(bootstrapUrl.toString()), {
    maxReconnectAttempts: 0,
  });
  try {
    const result = parseNativeRpcCompatibility(
      await manager.request("bootstrap.negotiate", {
        protocolEpoch: PROTOCOL.epoch,
        minRevision: PROTOCOL.minRevision,
        maxRevision: PROTOCOL.maxRevision,
        clientBuild: CLIENT_BUILD,
        requiredCapabilities: [...PROTOCOL.capabilities],
      }),
    );
    if (!result) throw new Error("Synara bootstrap negotiation returned an unreadable result");
    return result;
  } finally {
    manager.dispose();
  }
}

async function openFeatureSocket(): Promise<WebSocket> {
  const socketUrl = new URL(resolveSynaraWsUrl(process.env.SYNARA_WS_URL));
  const compatibility = await negotiate(socketUrl.toString());
  adoptCompatibility(compatibility);
  socketUrl.pathname = "/ws";
  socketUrl.hash = "";
  socketUrl.searchParams.set("x-synara-client-build", CLIENT_BUILD);
  socketUrl.searchParams.set("x-synara-protocol-epoch", String(compatibility.protocolEpoch));
  socketUrl.searchParams.set(
    "x-synara-protocol-revision",
    String(compatibility.negotiatedRevision),
  );
  socketUrl.searchParams.set("x-synara-server-instance", compatibility.serverInstanceId);
  return openSocket(socketUrl.toString());
}

const featureManager = createManager(openFeatureSocket, {
  closeWhenIdle: false,
});
export function subscribeNativeRpcTransportState(
  listener: (state: RpcTransportState) => void,
): () => void {
  return featureManager.subscribe(listener);
}

function toRelayError(
  error: unknown,
): Error & { errorKind?: "rpc" | "transport"; rpcFailure?: RpcFailureDetails } {
  const relayError = new Error(error instanceof Error ? error.message : String(error)) as Error & {
    errorKind?: "rpc" | "transport";
    rpcFailure?: RpcFailureDetails;
  };
  relayError.errorKind = isRpcTransportError(error) ? "transport" : "rpc";
  const rpcFailure = readRpcFailureDetails(error);
  if (rpcFailure) relayError.rpcFailure = rpcFailure;
  return relayError;
}

export async function handleNativeRpc(
  method: "synaraRpc" | "synaraRpcStream",
  data: {
    readonly tag?: unknown;
    readonly payload?: unknown;
    readonly timeoutMs?: unknown;
  },
  onProgress?: (event: unknown) => void,
): Promise<unknown> {
  const tag = String(data.tag ?? "").trim();
  if (!tag) throw new Error("Synara RPC tag is required");
  try {
    if (method === "synaraRpcStream") {
      const events: unknown[] = [];
      await featureManager.requestStream(tag, data.payload, (event) => {
        if (nativeEventStreamChannel(tag) === null) events.push(event);
        onProgress?.(event);
      });
      return events;
    }
    return await featureManager.request(tag, normalizeLynxRpcPayload(tag, data.payload), {
      // `null` disables the watchdog for calls the renderer declared long-running
      // (provider updates, recap generation); a number is the renderer's own
      // deadline; anything else keeps the host default.
      timeoutMs:
        data.timeoutMs === null
          ? null
          : typeof data.timeoutMs === "number"
            ? data.timeoutMs
            : undefined,
    });
  } catch (error) {
    throw toRelayError(error);
  }
}

const scopedStreams = createScopedStreamRegistry();

/**
 * Request-scoped stream for the shared `WsTransport` compat class: every item
 * goes to `onItem` as it arrives, the promise settles when the server ends the
 * stream or the renderer cancels it (`cancelNativeRpcStream`). Ownership and
 * renderer generations live in `scopedStreamRegistry.logic.ts`.
 */
export async function runNativeRpcStream(
  streamId: string,
  data: { readonly tag?: unknown; readonly payload?: unknown },
  onItem: (item: unknown) => void,
): Promise<void> {
  const tag = String(data.tag ?? "").trim();
  if (!tag) throw new Error("Synara RPC tag is required");
  try {
    await scopedStreams.run(streamId, () => featureManager.openStream(tag, data.payload, onItem));
  } catch (error) {
    throw toRelayError(error);
  }
}

export function cancelNativeRpcStream(streamId: string): boolean {
  return scopedStreams.cancel(streamId);
}

/** Renderer-generation handshake; see `NATIVE_RPC_STREAM_RESET_METHOD`. */
export function resetNativeRpcStreams(): NativeRpcStreamResetReply {
  return {
    generation: scopedStreams.reset(),
    transportState: featureManager.getState(),
    compatibility: negotiatedCompatibility,
  };
}

export function disposeNativeRpcHost(): void {
  scopedStreams.cancelAll();
  featureManager.dispose();
}
