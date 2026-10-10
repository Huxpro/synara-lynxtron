// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import "@lynx-js/web-core/client";
import { setupSymmetricHost } from "@lynx-js/lynxtron/web-host";
import { COMPONENT_LAB_RELAY_STORAGE_KEY } from "@synara/shared/componentLab";
import { installLynxWebInteractionStateBridge } from "./web-interaction-state";
import { type LynxWebInteractionEvent } from "../webInteractionEvent.logic";
import { resolveWebInitialRoute } from "./webInitialRoute.logic";
import { decodeBridgeRpcData } from "../bridgeRpcPayload";
import {
  buildWebRelaySocketUrl,
  normalizeWebRelayUrl,
  resolveWebRelayEndpoint,
} from "./webRelayEndpoint.logic";
import { NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG } from "../syntaxHighlightingContract.logic";
import {
  NATIVE_RPC_COMPATIBILITY_EVENT,
  NATIVE_RPC_STREAM_CANCEL_METHOD,
  NATIVE_RPC_STREAM_ITEM_EVENT,
  NATIVE_RPC_STREAM_RESET_METHOD,
  parseNativeRpcCompatibility,
  type NativeRpcCompatibility,
  type NativeRpcStreamItemEvent,
  type NativeRpcStreamResetReply,
} from "../nativeEventStreams.logic";
import {
  describeRpcFailureCause,
  rpcFailureReplyFields,
  type RpcFailureDetails,
} from "../rpcFailure.logic";
import { createScopedStreamRegistry } from "../scopedStreamRegistry.logic";
import { openWebRelayScopedStream } from "./webRelayScopedStream.logic";
import { REDUCED_MOTION_EVENT } from "../reducedMotionEvent.logic";
import { normalizeLynxRpcPayload } from "../rpcPayload.logic";
import { SYSTEM_APPEARANCE_EVENT } from "../systemAppearanceEvent.logic";
import { EDITOR_ICON_ROUTE_PATH } from "@synara/shared/editorIcons";
import {
  describeWebRpcDefect,
  parseWebRpcResponse,
  type WebRpcChunkFrame,
  type WebRpcExitFrame,
} from "./webRpcFrame.logic";
import { isRelayPendingStream, summarizeRelayPendingRequests } from "./webRelayDiagnostics.logic";
import { isWebSocketOpen } from "./webSocketState.logic";
import {
  isWebTextareaConfirmKey,
  WEB_TEXTAREA_CONFIRM_EVENT,
  webTextareaConfirmEventInit,
} from "./webTextareaConfirm.logic";
import {
  WS_CLIENT_REQUIRED_CAPABILITIES,
  WS_PROTOCOL_EPOCH,
  WS_PROTOCOL_MAX_REVISION,
  WS_PROTOCOL_MIN_REVISION,
} from "@synara/contracts";

const bundleUrl = "./main.web.bundle";
const nodejsAdapterUrl = "./nodejs-adapter-web.js";
const LYNX_WEB_STYLE_RULES = [
  ".SharedThemePackImportTextarea::part(textarea) { box-sizing: border-box; width: 100%; height: 100%; padding: 0; }",
  ".EnvironmentScroller { flex: 0 1 auto; height: auto; min-height: 0; max-height: 100%; }",
  // web-elements' `raw-text` collapses runs of spaces (`white-space-collapse:
  // preserve-breaks`), which drops code indentation; native Lynx text keeps it.
  ".MdCodeBlockText raw-text { white-space-collapse: preserve; }",
  // A hard break is a `<text>` holding one newline; a DOM inline box collapses it.
  ".MdBreak { white-space-collapse: preserve-breaks; }",
];
const webDocument = globalThis.document;
webDocument.documentElement.style.width = "100%";
webDocument.documentElement.style.height = "100%";
webDocument.body.style.width = "100%";
webDocument.body.style.height = "100%";
webDocument.body.style.margin = "0";
webDocument.body.style.overflow = "hidden";
webDocument.documentElement.style.setProperty("--engine-landing-heading-letter-spacing", "-0.45px");
const CLIENT_BUILD = "0.5.5-lynx-web";
const DEFAULT_SYNARA_WS_URL = "ws://127.0.0.1:58090";
const SOCKET_OPEN_TIMEOUT_MS = 8_000;
const RPC_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 6;
const INITIAL_RECONNECT_DELAY_MS = 250;
const MAX_RECONNECT_DELAY_MS = 2_000;
const OFFLINE_RETRY_DELAY_MS = 5_000;
const INITIAL_OVERLAY_POSITION_RETRY_MS = 50;
const INITIAL_OVERLAY_POSITION_TIMEOUT_MS = 15_000;
const TRANSPORT_STATE_EVENT = "synara:transport-state";
const GIT_ACTION_PROGRESS_EVENT = "synara:git-action-progress";
const TERMINAL_EVENT = "synara:terminal-event";
const COMPOSER_MODEL_MENU_QUERY = "composerModelMenu";
const COMPOSER_MODEL_PROVIDER_QUERY = "composerModelProvider";
const STORAGE_PREFIX = "synara.lynx.";
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

interface PendingRelayRequest {
  readonly tag: string;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout> | null;
  readonly chunks?: unknown[];
  /** Request-scoped stream (shared WsTransport compat): items bypass the chunk buffer. */
  readonly onItem?: (item: unknown) => void;
}

class SynaraRpcResponseError extends Error {
  readonly name = "SynaraRpcResponseError";
  /** The typed server error the message flattens (see `rpcFailure.logic.ts`). */
  readonly rpcFailure: RpcFailureDetails | null;

  constructor(message: string, rpcFailure: RpcFailureDetails | null = null) {
    super(message);
    this.rpcFailure = rpcFailure;
  }
}

/** The last negotiation of the relay socket; `null` before the first connect. */
let relayCompatibility: NativeRpcCompatibility | null = null;

let relaySocket: WebSocket | null = null;
let relaySocketBaseUrl: string | null = null;
let relayReady: Promise<WebSocket> | null = null;
let relayReadyBaseUrl: string | null = null;
let relaySequence = 0;
// Browser clipboard permission is scoped to a same-realm trusted gesture. A
// Lynx background-thread bridge call can arrive after that activation expires,
// so preserve the last write as a harness-local fallback while still attempting
// the real Clipboard API first.
let relayClipboardText = "";
const relayPending = new Map<string, PendingRelayRequest>();
const scopedStreams = createScopedStreamRegistry();
const relayRecentRpcTags: string[] = [];
let transcriptScrollElement: HTMLElement | null = null;
let transcriptPreviousScrollTop: number | null = null;
let relayLastTransportError: string | null = null;
let relayLastRpcError: string | null = null;
let explorerPreviewActionCount = 0;
let lastExplorerPreviewAction: {
  readonly action: string;
  readonly path: string;
} | null = null;
let interactionEventCount = 0;
let lastInteractionEvent: LynxWebInteractionEvent | null = null;
let syntaxHighlightCallCount = 0;
let lastSyntaxHighlightResult: {
  readonly error: string | null;
  readonly language: string | null;
  readonly path: string;
  readonly theme: "light+dark";
} | null = null;
let relayConnectionAttempts = 0;
let relayRecoveryGeneration = 0;
let relayRecoveryActive = false;
const relayLifecycleEvents: Array<Record<string, unknown>> = [];
let pendingInitialRoute: string | null = null;
let lastRendererReadyRoute: string | null = null;
let publishRelayTransportState: ((state: "connected" | "reconnecting" | "offline") => void) | null =
  null;
let publishRelayGitActionProgress: ((event: unknown) => void) | null = null;
let publishRelayStreamItem: ((event: NativeRpcStreamItemEvent) => void) | null = null;

interface LynxWebRuntimeConfig {
  readonly wsUrl?: unknown;
}

function buildTimeSynaraWsUrl(): unknown {
  return process.env.SYNARA_WS_URL;
}

declare global {
  var __SYNARA_LYNX_RUNTIME__: LynxWebRuntimeConfig | undefined;
  var __SYNARA_LYNX_RELAY_DIAGNOSTICS__:
    | (() => {
        readonly configuredBaseUrl: string;
        readonly activeBaseUrl: string | null;
        readonly readyBaseUrl: string | null;
        readonly socketState: number | null;
        readonly connectionAttempts: number;
        readonly pendingRequests: number;
        readonly pendingRequestTags: readonly string[];
        readonly pendingUnaryRequests: number;
        readonly pendingUnaryTags: readonly string[];
        readonly activeStreamRequests: number;
        readonly activeStreamTags: readonly string[];
        readonly recentRpcTags: readonly string[];
        readonly rendererReadyRoute: string | null;
        readonly lastTransportError: string | null;
        readonly lastRpcError: string | null;
        readonly lifecycleEvents: readonly Record<string, unknown>[];
      })
    | undefined;
}

function configuredRelayBaseUrl(): string {
  return normalizeSynaraWsUrl(
    resolveWebRelayEndpoint(
      globalThis.__SYNARA_LYNX_RUNTIME__?.wsUrl,
      readComponentsLabRelayUrl(),
      buildTimeSynaraWsUrl(),
      DEFAULT_SYNARA_WS_URL,
    ),
  );
}

function readComponentsLabRelayUrl(): string {
  try {
    return globalThis.sessionStorage?.getItem(COMPONENT_LAB_RELAY_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function normalizeSynaraWsUrl(value: unknown): string {
  return normalizeWebRelayUrl(value || DEFAULT_SYNARA_WS_URL);
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function recordRelayLifecycleEvent(event: string, detail: Record<string, unknown> = {}): void {
  relayLifecycleEvents.push({
    at: Date.now(),
    event,
    ...detail,
  });
  if (relayLifecycleEvents.length > 80) relayLifecycleEvents.shift();
}

function positionInitialOverlayWhenReady(position: () => boolean): void {
  const deadline = Date.now() + INITIAL_OVERLAY_POSITION_TIMEOUT_MS;
  const attempt = () => {
    if (position() || Date.now() >= deadline) return;
    globalThis.setTimeout(attempt, INITIAL_OVERLAY_POSITION_RETRY_MS);
  };
  attempt();
}

function safeClose(socket: WebSocket | null): void {
  try {
    socket?.close();
  } catch {
    // The socket is already unusable.
  }
}

function cancelRelayRecovery(): void {
  relayRecoveryGeneration += 1;
  relayRecoveryActive = false;
}

function startRelayRecovery(baseUrl: string): void {
  if (relayRecoveryActive) return;
  const generation = ++relayRecoveryGeneration;
  relayRecoveryActive = true;

  void (async () => {
    while (generation === relayRecoveryGeneration) {
      publishRelayTransportState?.("reconnecting");
      try {
        await ensureRelaySocket(baseUrl);
        if (generation !== relayRecoveryGeneration) return;
        relayRecoveryActive = false;
        publishRelayTransportState?.("connected");
        return;
      } catch {
        if (generation !== relayRecoveryGeneration) return;
        publishRelayTransportState?.("offline");
        await sleep(OFFLINE_RETRY_DELAY_MS);
      }
    }
  })();
}

function connectWithPath(baseUrl: string, path: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const socket = new WebSocket(buildWebRelaySocketUrl(baseUrl, path));
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      safeClose(socket);
      reject(new Error(`WebSocket open timed out after ${SOCKET_OPEN_TIMEOUT_MS}ms`));
    }, SOCKET_OPEN_TIMEOUT_MS);
    socket.onopen = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(socket);
    };
    socket.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      safeClose(socket);
      reject(new Error(`WebSocket open failed for ${path}`));
    };
    socket.onclose = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`WebSocket closed before open for ${path}`));
    };
  });
}

async function negotiate(baseUrl: string): Promise<NativeRpcCompatibility> {
  const socket = await connectWithPath(baseUrl, "/ws/bootstrap");
  try {
    return await new Promise((resolve, reject) => {
      const id = String(++relaySequence);
      const timer = setTimeout(() => {
        reject(new Error("Synara bootstrap negotiation timed out"));
      }, SOCKET_OPEN_TIMEOUT_MS);
      socket.onmessage = (event) => {
        const message = parseWebRpcResponse(event.data);
        if (!message || message._tag !== "Exit" || message.requestId !== id) return;
        clearTimeout(timer);
        if (message.exit._tag === "Success") {
          const result = parseNativeRpcCompatibility(message.exit.value);
          if (result) resolve(result);
          else reject(new Error("Synara bootstrap negotiation returned an unreadable result"));
          return;
        }
        reject(
          new Error(`Synara bootstrap negotiation failed: ${JSON.stringify(message.exit.cause)}`),
        );
      };
      socket.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Synara bootstrap socket failed"));
      };
      socket.send(
        JSON.stringify({
          _tag: "Request",
          id,
          tag: "bootstrap.negotiate",
          payload: {
            protocolEpoch: PROTOCOL.epoch,
            minRevision: PROTOCOL.minRevision,
            maxRevision: PROTOCOL.maxRevision,
            clientBuild: CLIENT_BUILD,
            requiredCapabilities: [...PROTOCOL.capabilities],
          },
          headers: [],
        }),
      );
    });
  } finally {
    safeClose(socket);
  }
}

function rejectPendingRequests(error: Error): void {
  for (const pending of relayPending.values()) {
    if (pending.timer !== null) clearTimeout(pending.timer);
    pending.reject(error);
  }
  relayPending.clear();
}

function invalidateRelaySocket(socket: WebSocket, baseUrl: string, error: Error): void {
  recordRelayLifecycleEvent("invalidate", {
    activeSocket: relaySocket === socket,
    baseUrl,
    message: error.message,
    readyState: socket.readyState,
  });
  if (relaySocket && relaySocket !== socket) {
    safeClose(socket);
    return;
  }
  if (relaySocket === socket) {
    relaySocket = null;
    relaySocketBaseUrl = null;
  }
  safeClose(socket);
  rejectPendingRequests(error);
  startRelayRecovery(baseUrl);
}

function rejectPendingRpcDefect(error: SynaraRpcResponseError): void {
  relayLastRpcError = error.message;
  rejectPendingRequests(error);
}

async function openFeatureSocket(baseUrl: string): Promise<WebSocket> {
  const compatibility = await negotiate(baseUrl);
  // Published before the negotiated socket opens, so before it reports connected.
  relayCompatibility = compatibility;
  lynxView.sendGlobalEvent?.(NATIVE_RPC_COMPATIBILITY_EVENT, [compatibility]);
  const query = new URLSearchParams({
    "x-synara-client-build": CLIENT_BUILD,
    "x-synara-protocol-epoch": String(compatibility.protocolEpoch),
    "x-synara-protocol-revision": String(compatibility.negotiatedRevision),
    "x-synara-server-instance": compatibility.serverInstanceId,
  });
  const socket = await connectWithPath(baseUrl, `/ws?${query}`);
  recordRelayLifecycleEvent("feature-open", {
    baseUrl,
    serverInstanceId: compatibility.serverInstanceId,
  });
  socket.onmessage = (event) => {
    const message = parseWebRpcResponse(event.data);
    if (!message) return;
    if (message._tag === "Defect") {
      rejectPendingRpcDefect(
        new SynaraRpcResponseError(`Synara RPC defect: ${describeWebRpcDefect(message)}`),
      );
      return;
    }
    const pending = relayPending.get(message.requestId);
    if (!pending) return;
    if (message._tag === "Chunk") {
      if (pending.onItem) {
        for (const value of message.values) pending.onItem(value);
      } else {
        if (pending.tag !== "terminal.subscribeEvents") {
          pending.chunks?.push(...(message as WebRpcChunkFrame).values);
        }
        for (const value of message.values) {
          if (pending.tag === "terminal.subscribeEvents") {
            lynxView.sendGlobalEvent?.(TERMINAL_EVENT, [value]);
          } else {
            publishRelayGitActionProgress?.(value);
          }
        }
      }
      try {
        socket.send(
          JSON.stringify({
            _tag: "Ack",
            requestId: message.requestId,
          }),
        );
      } catch (error) {
        const transportError = new Error(
          `Synara RPC ${pending.tag} acknowledgement failed: ${describeError(error)}`,
        );
        relayLastTransportError = transportError.message;
        invalidateRelaySocket(socket, baseUrl, transportError);
      }
      return;
    }
    relayPending.delete(message.requestId);
    if (pending.timer !== null) clearTimeout(pending.timer);
    const exitMessage = message as WebRpcExitFrame;
    if (exitMessage.exit._tag === "Success") {
      relayLastRpcError = null;
      pending.resolve(pending.chunks ?? exitMessage.exit.value);
      return;
    }
    const error = new SynaraRpcResponseError(
      `Synara RPC ${pending.tag} failed: ${JSON.stringify(exitMessage.exit.cause)}`,
      describeRpcFailureCause(exitMessage.exit.cause),
    );
    relayLastRpcError = error.message;
    pending.reject(error);
  };
  socket.onerror = () => {
    recordRelayLifecycleEvent("feature-error", {
      baseUrl,
      readyState: socket.readyState,
    });
    relayLastTransportError = "Synara relay socket failed";
    invalidateRelaySocket(socket, baseUrl, new Error("Synara relay socket failed"));
  };
  socket.onclose = (event) => {
    recordRelayLifecycleEvent("feature-close", {
      baseUrl,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    relayLastTransportError = "Synara relay socket closed";
    invalidateRelaySocket(socket, baseUrl, new Error("Synara relay socket closed"));
  };
  return socket;
}

async function connectWithBackoff(baseUrl: string): Promise<WebSocket> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RECONNECT_ATTEMPTS; attempt += 1) {
    relayConnectionAttempts += 1;
    recordRelayLifecycleEvent("connect-attempt", {
      attempt,
      baseUrl,
    });
    try {
      const socket = await openFeatureSocket(baseUrl);
      recordRelayLifecycleEvent("connect-success", {
        attempt,
        baseUrl,
      });
      relayLastTransportError = null;
      return socket;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      recordRelayLifecycleEvent("connect-failure", {
        attempt,
        baseUrl,
        message: lastError.message,
      });
      relayLastTransportError = lastError.message;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) break;
      await sleep(Math.min(INITIAL_RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS));
    }
  }
  throw lastError ?? new Error("Synara relay connection failed");
}

async function ensureRelaySocket(baseUrl: string): Promise<WebSocket> {
  if (relaySocket && relaySocketBaseUrl === baseUrl && isWebSocketOpen(relaySocket)) {
    return relaySocket;
  }
  if (relayReady && relayReadyBaseUrl === baseUrl) return relayReady;

  if (relaySocketBaseUrl && relaySocketBaseUrl !== baseUrl) {
    cancelRelayRecovery();
    safeClose(relaySocket);
    relaySocket = null;
    relaySocketBaseUrl = null;
  }

  const pending = connectWithBackoff(baseUrl);
  relayReady = pending;
  relayReadyBaseUrl = baseUrl;
  try {
    const socket = await pending;
    if (!isWebSocketOpen(socket)) {
      safeClose(socket);
      throw new Error("Synara relay socket closed while connecting");
    }
    relaySocket = socket;
    relaySocketBaseUrl = baseUrl;
    recordRelayLifecycleEvent("socket-owned", {
      baseUrl,
    });
    return socket;
  } finally {
    if (relayReady === pending) {
      relayReady = null;
      relayReadyBaseUrl = null;
    }
  }
}

async function synaraRpc(
  baseUrlValue: unknown,
  tagValue: unknown,
  payload: unknown,
  stream = false,
  options: {
    /** `null` disables the watchdog; a number replaces the host default. */
    readonly timeoutMs?: number | null;
  } = {},
): Promise<unknown> {
  const baseUrl = normalizeSynaraWsUrl(
    resolveWebRelayEndpoint(
      globalThis.__SYNARA_LYNX_RUNTIME__?.wsUrl,
      readComponentsLabRelayUrl(),
      baseUrlValue,
      DEFAULT_SYNARA_WS_URL,
    ),
  );
  const tag = String(tagValue ?? "").trim();
  if (!tag) throw new Error("Synara RPC tag is required");
  relayRecentRpcTags.push(tag);
  if (relayRecentRpcTags.length > 40) relayRecentRpcTags.shift();
  const socket = await ensureRelaySocket(baseUrl);
  const id = String(++relaySequence);
  const timeoutMs = options.timeoutMs === undefined ? RPC_REQUEST_TIMEOUT_MS : options.timeoutMs;
  return new Promise((resolve, reject) => {
    const timer = stream
      ? undefined
      : timeoutMs === null
        ? undefined
        : setTimeout(() => {
            relayPending.delete(id);
            const error = new Error(`Synara RPC ${tag} timed out after ${timeoutMs}ms`);
            reject(error);
            invalidateRelaySocket(socket, baseUrl, error);
          }, timeoutMs);
    relayPending.set(id, {
      tag,
      resolve,
      reject,
      timer: timer ?? null,
      ...(stream ? { chunks: [] } : {}),
    });
    try {
      socket.send(JSON.stringify({ _tag: "Request", id, tag, payload, headers: [] }));
    } catch (error) {
      relayPending.delete(id);
      clearTimeout(timer);
      const transportError = new Error(`Synara RPC ${tag} send failed: ${describeError(error)}`);
      reject(transportError);
      invalidateRelaySocket(socket, baseUrl, transportError);
    }
  });
}

/**
 * Request-scoped stream for the shared WsTransport compat class. Ownership
 * (generation, cancel-before-open) lives in the registry; the opener only
 * talks to the relay socket. Items are relayed under the renderer's stream id.
 */
function runScopedRelayStream(
  baseUrlValue: unknown,
  streamId: string,
  tagValue: unknown,
  payload: unknown,
): Promise<void> {
  const baseUrl = normalizeSynaraWsUrl(
    resolveWebRelayEndpoint(
      globalThis.__SYNARA_LYNX_RUNTIME__?.wsUrl,
      readComponentsLabRelayUrl(),
      baseUrlValue,
      DEFAULT_SYNARA_WS_URL,
    ),
  );
  const tag = String(tagValue ?? "").trim();
  if (!tag) throw new Error("Synara RPC tag is required");
  relayRecentRpcTags.push(tag);
  if (relayRecentRpcTags.length > 40) relayRecentRpcTags.shift();
  return scopedStreams.run(streamId, (isCancelled) =>
    openWebRelayScopedStream(
      tag,
      payload,
      {
        ensureSocket: () => ensureRelaySocket(baseUrl),
        isSocketOpen: isWebSocketOpen,
        nextRequestId: () => String(++relaySequence),
        pending: relayPending,
        onItem: (item) => publishRelayStreamItem?.({ streamId, item }),
        onSendFailure: (socket, error) => invalidateRelaySocket(socket, baseUrl, error),
        describeError,
      },
      isCancelled,
    ),
  );
}

function relayTransportStateView(): string {
  if (relaySocket && isWebSocketOpen(relaySocket)) return "connected";
  return relayRecoveryActive || relayReady ? "reconnecting" : "idle";
}

function readStorageEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  const storage = globalThis.localStorage;
  for (let index = 0; index < storage.length; index += 1) {
    const persistedKey = storage.key(index);
    if (!persistedKey?.startsWith(STORAGE_PREFIX)) continue;
    const value = storage.getItem(persistedKey);
    if (value !== null) entries[persistedKey.slice(STORAGE_PREFIX.length)] = value;
  }
  return entries;
}

function clearStorageEntries(): void {
  const storage = globalThis.localStorage;
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
}

function readTranscriptScroll(): {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly listHeight: number;
  readonly previousScrollTop: number | null;
} | null {
  const lynxRoot = (webDocument.getElementById("root-view") as HTMLElement | null)?.shadowRoot;
  const list = lynxRoot?.querySelector<HTMLElement>(".TranscriptList");
  if (!list) {
    transcriptScrollElement = null;
    transcriptPreviousScrollTop = null;
    return null;
  }
  const previousScrollTop = transcriptScrollElement === list ? transcriptPreviousScrollTop : null;
  transcriptScrollElement = list;
  transcriptPreviousScrollTop = list.scrollTop;
  return {
    scrollTop: list.scrollTop,
    scrollHeight: list.scrollHeight,
    listHeight: list.clientHeight,
    previousScrollTop,
  };
}

async function renderSvgToPngBlob(svg: string): Promise<Blob> {
  if (!svg.startsWith("<svg") || svg.length > 1_000_000) {
    throw new Error("Profile share card SVG is invalid.");
  }
  const sourceUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const image = new Image();
  image.decoding = "sync";
  try {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error("The profile share card could not be decoded.")),
        { once: true },
      );
      image.src = sourceUrl;
    });
    const canvas = webDocument.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");
    context.drawImage(image, 0, 0);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG rendering failed."))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function handleBridgeCall(
  method: string,
  rawParams: Record<string, unknown> = {},
): Promise<unknown> {
  const params =
    method === "synaraRpc" || method === "synaraRpcStream"
      ? decodeBridgeRpcData(rawParams)
      : rawParams;
  try {
    if (method === "synaraRpc") {
      if (params.tag === NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG) {
        syntaxHighlightCallCount += 1;
        const payload =
          params.payload && typeof params.payload === "object"
            ? (params.payload as Record<string, unknown>)
            : {};
        const path = typeof payload.path === "string" ? payload.path : "";
        try {
          const { highlightCodeThemesForNativePreview } = await import("../syntaxHighlightingHost");
          const result = await highlightCodeThemesForNativePreview({
            code: typeof payload.code === "string" ? payload.code : "",
            path,
          });
          lastSyntaxHighlightResult = {
            error: null,
            language: result?.light.language ?? null,
            path,
            theme: "light+dark",
          };
          return result;
        } catch (error) {
          lastSyntaxHighlightResult = {
            error: describeError(error),
            language: null,
            path,
            theme: "light+dark",
          };
          throw error;
        }
      }
      const tag = String(params.tag ?? "");
      return await synaraRpc(
        params.baseUrl,
        tag,
        normalizeLynxRpcPayload(tag, params.payload),
        false,
        {
          timeoutMs:
            params.timeoutMs === null
              ? null
              : typeof params.timeoutMs === "number"
                ? params.timeoutMs
                : undefined,
        },
      );
    }
    if (method === "synaraRpcStream") {
      if (typeof params.streamId === "string") {
        await runScopedRelayStream(params.baseUrl, params.streamId, params.tag, params.payload);
        return null;
      }
      return await synaraRpc(params.baseUrl, params.tag, params.payload, true);
    }
    if (method === NATIVE_RPC_STREAM_CANCEL_METHOD) {
      return { cancelled: scopedStreams.cancel(String(params.streamId ?? "")) };
    }
    if (method === NATIVE_RPC_STREAM_RESET_METHOD) {
      const reply: NativeRpcStreamResetReply = {
        generation: scopedStreams.reset(),
        transportState: relayTransportStateView(),
        compatibility: relayCompatibility,
      };
      return reply;
    }
    if (method === "terminalOpen") {
      return await synaraRpc(params.baseUrl, "terminal.open", params);
    }
    if (method === "terminalWrite") {
      return await synaraRpc(params.baseUrl, "terminal.write", params);
    }
    if (method === "terminalResize") {
      return await synaraRpc(params.baseUrl, "terminal.resize", params);
    }
    if (method === "terminalAckOutput") {
      return await synaraRpc(params.baseUrl, "terminal.ackOutput", params);
    }
    if (method === "terminalClose") {
      return await synaraRpc(params.baseUrl, "terminal.close", params);
    }
    if (method === "timerSleep") {
      const milliseconds = Number(params.milliseconds ?? 0);
      if (Number.isFinite(milliseconds) && milliseconds > 0) {
        await sleep(milliseconds);
      }
      return null;
    }
    if (method === "windowGetViewport") {
      return {
        width: globalThis.innerWidth,
        height: globalThis.innerHeight,
      };
    }
    if (method === "runtimeGetSynaraWsUrl") {
      return {
        wsUrl: relaySocketBaseUrl ?? relayReadyBaseUrl ?? configuredRelayBaseUrl(),
      };
    }
    if (method === "runtimeGetSystemAppearance") {
      return { dark: systemAppearanceQuery.matches };
    }
    if (method === "runtimeGetEditorIcon") {
      const editorId = String(params.editorId ?? "").trim();
      if (!editorId) return { dataUrl: null };
      const endpoint = new URL(configuredRelayBaseUrl());
      endpoint.protocol = endpoint.protocol === "wss:" ? "https:" : "http:";
      endpoint.pathname = EDITOR_ICON_ROUTE_PATH;
      endpoint.hash = "";
      endpoint.searchParams.set("id", editorId);
      const response = await fetch(endpoint);
      if (!response.ok) return { dataUrl: null };
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) return { dataUrl: null };
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(String(reader.result ?? "")), { once: true });
        reader.addEventListener("error", () => reject(reader.error), { once: true });
        reader.readAsDataURL(blob);
      });
      return { dataUrl };
    }
    if (method === "shellRendererReady") {
      const route = pendingInitialRoute;
      pendingInitialRoute = null;
      lastRendererReadyRoute = route;
      return { ok: true, route };
    }
    if (method === "notificationsIsSupported") {
      return { supported: false };
    }
    if (method === "notificationsShow") {
      return { shown: false };
    }
    if (method === "appSnapGetState" || method === "appSnapRequestPermissions") {
      return {
        platform: "other",
        supported: false,
        enabled: false,
        status: "unsupported",
        shortcut: null,
        inputMonitoringPermission: "unknown",
        screenRecordingPermission: "unknown",
        message: "AppSnap is available only in the macOS desktop app.",
      };
    }
    if (method === "appSnapSetEnabled") {
      return {
        platform: "other",
        supported: false,
        enabled: false,
        status: "unsupported",
        shortcut: null,
        inputMonitoringPermission: "unknown",
        screenRecordingPermission: "unknown",
        message: "AppSnap is available only in the macOS desktop app.",
      };
    }
    if (method === "appSnapSetPlaySound") {
      return { supported: false, enabled: false, status: "unsupported" };
    }
    if (method === "appSnapPreviewSound") {
      return { played: false };
    }
    if (method === "appSnapListPendingCaptures") {
      return { captures: [] };
    }
    if (method === "appSnapAcknowledgeCapture") {
      return { ok: false };
    }
    if (method === "storageDump") {
      return { entries: readStorageEntries() };
    }
    if (method === "storageSet") {
      globalThis.localStorage.setItem(
        `${STORAGE_PREFIX}${String(params.key ?? "")}`,
        String(params.value ?? ""),
      );
      return null;
    }
    if (method === "storageRemove") {
      globalThis.localStorage.removeItem(`${STORAGE_PREFIX}${String(params.key ?? "")}`);
      return null;
    }
    if (method === "storageClear") {
      clearStorageEntries();
      return null;
    }
    if (method === "readTranscriptScroll") {
      return readTranscriptScroll();
    }
    if (method === "clipboardWriteText") {
      relayClipboardText = String(params.text ?? "");
      try {
        await globalThis.navigator.clipboard.writeText(relayClipboardText);
      } catch {
        // Native uses the real system clipboard. The fallback keeps only the
        // isolated Lynx-for-Web harness interaction deterministic.
      }
      return null;
    }
    if (method === "shellShowInFolder") {
      return { opened: false };
    }
    if (method === "clipboardReadText") {
      try {
        return { text: await globalThis.navigator.clipboard.readText() };
      } catch {
        return { text: relayClipboardText };
      }
    }
    if (method === "profileShareExport") {
      const blob = await renderSvgToPngBlob(String(params.svg ?? ""));
      if (typeof ClipboardItem !== "function") return { ok: false };
      await globalThis.navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return { ok: true };
    }
    if (method === "dialogsPickProfileImage") {
      return await new Promise((resolve) => {
        const input = webDocument.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif";
        input.style.display = "none";
        const finish = (image: { dataUrl: string; name: string } | null) => {
          input.remove();
          resolve({ image });
        };
        input.addEventListener(
          "change",
          () => {
            const file = input.files?.[0];
            if (!file || file.size > 10 * 1024 * 1024) {
              finish(null);
              return;
            }
            const reader = new FileReader();
            reader.addEventListener("load", () => {
              finish({
                dataUrl: String(reader.result ?? ""),
                name: file.name,
              });
            });
            reader.addEventListener("error", () => finish(null));
            reader.readAsDataURL(file);
          },
          { once: true },
        );
        webDocument.body.append(input);
        input.click();
      });
    }
    if (method === "dialogsConfirm") {
      return {
        confirmed: globalThis.confirm(String(params.message ?? "")),
      };
    }
    if (method === "dialogsSaveProfileShareCard") {
      const blob = await renderSvgToPngBlob(String(params.svg ?? ""));
      const url = URL.createObjectURL(blob);
      try {
        const anchor = webDocument.createElement("a");
        anchor.href = url;
        anchor.download = String(params.defaultFilename ?? "synara-stats.png");
        anchor.click();
        return { path: anchor.download };
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (method === "shellOpenExternal") {
      const url = String(params.url ?? "");
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return { opened: false };
      }
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { opened: false };
      }
      globalThis.open(parsed.toString(), "_blank", "noopener,noreferrer");
      return { opened: true };
    }
    if (method === "showDialog") {
      globalThis.alert(String(params.message ?? ""));
      return {};
    }
    return null;
  } catch (error) {
    if (error instanceof SynaraRpcResponseError) {
      relayLastRpcError = describeError(error);
    } else {
      relayLastTransportError = describeError(error);
      if (method === "synaraRpc" || method === "synaraRpcStream") {
        startRelayRecovery(configuredRelayBaseUrl());
      }
    }
    return {
      error: describeError(error),
      errorKind: error instanceof SynaraRpcResponseError ? "rpc" : "transport",
      ...rpcFailureReplyFields(error),
    };
  }
}

pendingInitialRoute = resolveWebInitialRoute(globalThis.location.search);
const initialEnvironmentOpen =
  new URLSearchParams(globalThis.location.search).get("environment") === "open";
const initialEditorOpen = new URLSearchParams(globalThis.location.search).get("editor") === "open";
const initialEditorCenterMode =
  new URLSearchParams(globalThis.location.search).get("editorMode") === "diff"
    ? "diff"
    : new URLSearchParams(globalThis.location.search).get("editorMode") === "file"
      ? "file"
      : null;
const initialEditorChatOpen =
  new URLSearchParams(globalThis.location.search).get("editorChat") === "hidden"
    ? false
    : new URLSearchParams(globalThis.location.search).get("editorChat") === "open"
      ? true
      : null;
const initialEditorSearchOpen =
  new URLSearchParams(globalThis.location.search).get("editorSearch") === "open";
const initialEditorProjectMenuOpen =
  new URLSearchParams(globalThis.location.search).get("editorProjectMenu") === "open";
const initialEditorHistoryOpen =
  new URLSearchParams(globalThis.location.search).get("editorHistory") === "open";
const initialEditorNewOpen =
  new URLSearchParams(globalThis.location.search).get("editorNew") === "open";
const initialEditorNewChatOpen =
  new URLSearchParams(globalThis.location.search).get("editorNewChat") === "open";
const initialRenameOpen = new URLSearchParams(globalThis.location.search).get("rename") === "open";
const initialTerminalOpen =
  new URLSearchParams(globalThis.location.search).get("terminal") === "open";
const initialTemporaryOpen =
  new URLSearchParams(globalThis.location.search).get("temporary") === "open";
const initialDiffFileTreeOpen =
  new URLSearchParams(globalThis.location.search).get("diffFileTree") === "open";
const initialDiffOpen = ["open", "1"].includes(
  new URLSearchParams(globalThis.location.search).get("diff") ?? "",
);
const initialDiffTurnId = new URLSearchParams(globalThis.location.search).get("diffTurnId");
const initialDiffFilePath = new URLSearchParams(globalThis.location.search).get("diffFilePath");
const initialExplorerOpen =
  new URLSearchParams(globalThis.location.search).get("explorer") === "open";
const initialExplorerPresentationMode =
  new URLSearchParams(globalThis.location.search).get("explorerMode") === "single-file"
    ? "single-file"
    : "dock";
const initialExplorerActionMenuOpen =
  new URLSearchParams(globalThis.location.search).get("explorerActionMenu") === "open";
const initialExplorerPath = new URLSearchParams(globalThis.location.search).get("explorerPath");
const initialExplorerQuery =
  new URLSearchParams(globalThis.location.search).get("explorerQuery") ?? "";
const initialExplorerCommentLineValue = Number(
  new URLSearchParams(globalThis.location.search).get("explorerCommentLine"),
);
const initialExplorerCommentLine =
  Number.isInteger(initialExplorerCommentLineValue) && initialExplorerCommentLineValue > 0
    ? initialExplorerCommentLineValue
    : null;
const initialExplorerExpandedDirectories = new URLSearchParams(globalThis.location.search).getAll(
  "explorerExpanded",
);
const initialExplorerWidthValue = Number(
  new URLSearchParams(globalThis.location.search).get("explorerWidth"),
);
const initialExplorerWidth =
  Number.isFinite(initialExplorerWidthValue) && initialExplorerWidthValue > 0
    ? initialExplorerWidthValue
    : null;
const initialComposerModelMenuOpen =
  new URLSearchParams(globalThis.location.search).get(COMPOSER_MODEL_MENU_QUERY) === "open";
const initialComposerModelSubmenuOpen =
  new URLSearchParams(globalThis.location.search).get("composerModelSubmenu") === "open";
const initialComposerModelProvider = new URLSearchParams(globalThis.location.search).get(
  COMPOSER_MODEL_PROVIDER_QUERY,
);
const systemAppearanceQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
const requestedLabTheme = new URLSearchParams(globalThis.location.search).get("theme");
const initialThemeMode =
  pendingInitialRoute?.startsWith("/components-lab") &&
  (requestedLabTheme === "light" || requestedLabTheme === "dark")
    ? requestedLabTheme
    : null;
const initialSystemDark =
  initialThemeMode !== null ? initialThemeMode === "dark" : systemAppearanceQuery.matches;
const reducedMotionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
const initialReducedMotion = reducedMotionQuery.matches;
webDocument.body.innerHTML = `
<lynx-view
  id="root-view"
  style="height:100vh; width:100vw;"
  init-data='${JSON.stringify({
    initialDiffOpen,
    initialThemeMode,
    initialDiffTurnId,
    initialDiffFilePath,
    initialDiffFileTreeOpen,
    initialEnvironmentOpen,
    initialEditorOpen,
    initialEditorCenterMode,
    initialEditorChatOpen,
    initialEditorSearchOpen,
    initialEditorProjectMenuOpen,
    initialEditorHistoryOpen,
    initialEditorNewOpen,
    initialEditorNewChatOpen,
    initialRenameOpen,
    initialTerminalOpen,
    initialTemporaryOpen,
    initialExplorerOpen,
    initialExplorerPresentationMode,
    initialExplorerActionMenuOpen,
    initialExplorerPath,
    initialExplorerCommentLine,
    initialExplorerQuery,
    initialExplorerExpandedDirectories,
    initialExplorerWidth,
    initialComposerModelMenuOpen,
    initialComposerModelSubmenuOpen,
    initialComposerModelProvider,
    initialReducedMotion,
    initialSystemDark,
    initialRoute: pendingInitialRoute,
  })}'
  url="${bundleUrl}">
</lynx-view>`;

const lynxView = webDocument.getElementById("root-view") as any;
lynxView.injectStyleRules = LYNX_WEB_STYLE_RULES;

publishRelayTransportState = (state) => {
  lynxView.sendGlobalEvent?.(TRANSPORT_STATE_EVENT, [state]);
};
publishRelayGitActionProgress = (event) => {
  lynxView.sendGlobalEvent?.(GIT_ACTION_PROGRESS_EVENT, [event]);
};
publishRelayStreamItem = (event) => {
  lynxView.sendGlobalEvent?.(NATIVE_RPC_STREAM_ITEM_EVENT, [event]);
};

globalThis.__SYNARA_LYNX_RELAY_DIAGNOSTICS__ = () => {
  const pending = summarizeRelayPendingRequests(
    [...relayPending.values()].map((request) => ({
      tag: request.tag,
      streaming: isRelayPendingStream(request),
    })),
  );
  return {
    configuredBaseUrl: relaySocketBaseUrl ?? relayReadyBaseUrl ?? configuredRelayBaseUrl(),
    activeBaseUrl: relaySocketBaseUrl,
    readyBaseUrl: relayReadyBaseUrl,
    socketState: relaySocket?.readyState ?? null,
    connectionAttempts: relayConnectionAttempts,
    ...pending,
    recentRpcTags: [...relayRecentRpcTags],
    rendererReadyRoute: lastRendererReadyRoute,
    lastTransportError: relayLastTransportError,
    lastRpcError: relayLastRpcError,
    lifecycleEvents: [...relayLifecycleEvents],
    explorerPreviewActionCount,
    lastExplorerPreviewAction,
    interactionEventCount,
    lastInteractionEvent,
    syntaxHighlightCallCount,
    lastSyntaxHighlightResult,
  };
};

setupSymmetricHost(lynxView, {
  bridge: {
    call: handleBridgeCall,
  },
  nodejs: {
    scriptURL: nodejsAdapterUrl,
  },
});

const interactionBridgeController = new AbortController();
const installInteractionBridge = () => {
  const root = lynxView.shadowRoot as ShadowRoot | null;
  if (!root) return false;
  const queryDeep = <T extends HTMLElement>(container: ParentNode, selector: string): T | null => {
    const direct = container.querySelector<T>(selector);
    if (direct) return direct;
    for (const element of container.querySelectorAll<HTMLElement>("*")) {
      if (!element.shadowRoot) continue;
      const nested = queryDeep<T>(element.shadowRoot, selector);
      if (nested) return nested;
    }
    return null;
  };
  const publishInteraction = (event: LynxWebInteractionEvent) => {
    interactionEventCount += 1;
    lastInteractionEvent = event;
  };
  installLynxWebInteractionStateBridge(
    root,
    interactionBridgeController.signal,
    (activation) => {
      publishInteraction({
        kind: "explorer-visibility",
        open: activation.open,
      });
    },
    (activation) => {
      publishInteraction({
        kind: "environment-visibility",
        open: activation.open,
      });
    },
    (navigation) => {
      publishInteraction({
        kind: "explorer-navigation",
        ...navigation,
      });
    },
    (resize) => {
      if (resize.panel !== "ExplorerDock") return;
      publishInteraction({
        kind: "explorer-resize",
        width: resize.width,
      });
    },
    (action) => {
      explorerPreviewActionCount += 1;
      lastExplorerPreviewAction = action;
      publishInteraction({
        kind: "explorer-preview-menu",
        path: action.path,
      });
    },
    (commentLine) => {
      publishInteraction({
        kind: "explorer-comment-line",
        lineNumber: commentLine.lineNumber,
      });
    },
    (activation) => {
      publishInteraction({
        kind: "composer-model-menu",
        ...(activation.provider ? { provider: activation.provider } : {}),
      });
    },
  );
  // See webTextareaConfirm.logic.ts: element keydown handlers do not run on
  // this host, so the host turns Enter in a send textarea into its `confirm`.
  root.addEventListener(
    "keydown",
    (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      const path = event.composedPath();
      const textarea = path.find(
        (target): target is HTMLElement =>
          target instanceof HTMLElement && target.tagName === "X-TEXTAREA",
      );
      if (!textarea || !isWebTextareaConfirmKey(event, textarea.getAttribute("confirm-type"))) {
        return;
      }
      event.preventDefault();
      const editor = path[0];
      textarea.dispatchEvent(
        new CustomEvent(
          WEB_TEXTAREA_CONFIRM_EVENT,
          webTextareaConfirmEventInit(editor instanceof HTMLTextAreaElement ? editor.value : ""),
        ),
      );
    },
    { capture: true, signal: interactionBridgeController.signal },
  );
  if (initialExplorerActionMenuOpen) {
    positionInitialOverlayWhenReady(() => {
      const trigger = queryDeep<HTMLElement>(root, ".ExplorerDockPreviewActions");
      const popup = queryDeep<HTMLElement>(root, ".ExplorerDockPreviewActionsPopup");
      if (!trigger || !popup) return false;
      const triggerRect = trigger.getBoundingClientRect();
      const popupWidth = popup.getBoundingClientRect().width || 208;
      popup.style.left = `${Math.max(4, triggerRect.right - popupWidth)}px`;
      popup.style.top = `${triggerRect.bottom + 4}px`;
      popup.style.visibility = "visible";
      return true;
    });
  }
  if (initialComposerModelMenuOpen) {
    positionInitialOverlayWhenReady(() => {
      const trigger = queryDeep<HTMLElement>(root, ".ComposerModelTriggerLynx");
      const popup = queryDeep<HTMLElement>(root, ".ComposerModelPopupLynx");
      const layer = popup?.closest<HTMLElement>(".LxMenuLayer");
      if (!trigger || !popup || !layer) return false;
      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      popup.style.left = `${Math.max(4, triggerRect.right - layerRect.left - popupRect.width)}px`;
      popup.style.top = `${Math.max(4, triggerRect.top - layerRect.top - popupRect.height - 6)}px`;
      popup.style.visibility = "visible";
      return true;
    });
  }
  return true;
};
if (!installInteractionBridge()) {
  lynxView.addEventListener("load", installInteractionBridge, { once: true });
}
const publishViewportSize = () => {
  lynxView.sendGlobalEvent?.("viewport:resize", [globalThis.innerWidth, globalThis.innerHeight]);
};
const publishSystemAppearance = (event: MediaQueryListEvent) => {
  if (
    pendingInitialRoute?.startsWith("/components-lab") &&
    (requestedLabTheme === "light" || requestedLabTheme === "dark")
  ) {
    return;
  }
  lynxView.sendGlobalEvent?.(SYSTEM_APPEARANCE_EVENT, [event.matches]);
};
const publishReducedMotion = (event: MediaQueryListEvent) => {
  lynxView.sendGlobalEvent?.(REDUCED_MOTION_EVENT, [event.matches]);
};
globalThis.addEventListener("resize", publishViewportSize);
systemAppearanceQuery.addEventListener("change", publishSystemAppearance);
reducedMotionQuery.addEventListener("change", publishReducedMotion);

globalThis.addEventListener("pagehide", () => {
  globalThis.removeEventListener("resize", publishViewportSize);
  systemAppearanceQuery.removeEventListener("change", publishSystemAppearance);
  reducedMotionQuery.removeEventListener("change", publishReducedMotion);
  interactionBridgeController.abort();
  safeClose(relaySocket);
  rejectPendingRequests(new Error("Synara relay page closed"));
});
