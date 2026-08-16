// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/web-core/client';
import { setupSymmetricHost } from '@lynx-js/lynxtron/web-host';
import { installLynxWebInteractionStateBridge } from './web-interaction-state';
import {
  type LynxWebInteractionEvent,
} from '../webInteractionEvent.logic';
import { resolveWebInitialRoute } from './webInitialRoute.logic';
import { resolveWebRelayEndpoint } from './webRelayEndpoint.logic';
import { NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG } from '../syntaxHighlightingContract.logic';
import { REDUCED_MOTION_EVENT } from '../reducedMotionEvent.logic';
import { SYSTEM_APPEARANCE_EVENT } from '../systemAppearanceEvent.logic';

const bundleUrl = './main.web.bundle';
const nodejsAdapterUrl = './nodejs-adapter-web.js';
const LYNX_WEB_STYLE_RULES = [
  '.SharedThemePackImportTextarea::part(textarea) { box-sizing: border-box; width: 100%; height: 100%; padding: 0; }',
  '.EnvironmentScroller { flex: 0 1 auto; height: auto; min-height: 0; max-height: 100%; }',
];
const webDocument = globalThis.document;
webDocument.documentElement.style.width = '100%';
webDocument.documentElement.style.height = '100%';
webDocument.body.style.width = '100%';
webDocument.body.style.height = '100%';
webDocument.body.style.margin = '0';
webDocument.body.style.overflow = 'hidden';
webDocument.documentElement.style.setProperty(
  '--engine-landing-heading-letter-spacing',
  '-0.45px'
);
const CLIENT_BUILD = '0.5.5-lynx-web';
const DEFAULT_SYNARA_WS_URL = 'ws://127.0.0.1:58090';
const SOCKET_OPEN_TIMEOUT_MS = 8_000;
const RPC_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 6;
const INITIAL_RECONNECT_DELAY_MS = 250;
const MAX_RECONNECT_DELAY_MS = 2_000;
const OFFLINE_RETRY_DELAY_MS = 5_000;
const INITIAL_OVERLAY_POSITION_RETRY_MS = 50;
const INITIAL_OVERLAY_POSITION_TIMEOUT_MS = 15_000;
const TRANSPORT_STATE_EVENT = 'synara:transport-state';
const GIT_ACTION_PROGRESS_EVENT = 'synara:git-action-progress';
const COMPOSER_MODEL_MENU_QUERY = 'composerModelMenu';
const COMPOSER_MODEL_PROVIDER_QUERY = 'composerModelProvider';
const STORAGE_PREFIX = 'synara.lynx.';
const PROTOCOL = {
  epoch: 1,
  minRevision: 1,
  maxRevision: 1,
  capabilities: ['orchestration.cursor-safe-streams', 'rpc.typed-errors'],
} as const;

interface RpcExit {
  readonly _tag: 'Exit';
  readonly requestId: string;
  readonly exit:
    | { readonly _tag: 'Success'; readonly value: unknown }
    | { readonly _tag: 'Failure'; readonly cause?: unknown };
}

interface RpcChunk {
  readonly _tag: 'Chunk';
  readonly requestId: string;
  readonly values: readonly unknown[];
}

interface PendingRelayRequest {
  readonly tag: string;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout> | null;
  readonly chunks?: unknown[];
}

class SynaraRpcResponseError extends Error {
  readonly name = 'SynaraRpcResponseError';
}

let relaySocket: WebSocket | null = null;
let relaySocketBaseUrl: string | null = null;
let relayReady: Promise<WebSocket> | null = null;
let relayReadyBaseUrl: string | null = null;
let relaySequence = 0;
// Browser clipboard permission is scoped to a same-realm trusted gesture. A
// Lynx background-thread bridge call can arrive after that activation expires,
// so preserve the last write as a harness-local fallback while still attempting
// the real Clipboard API first.
let relayClipboardText = '';
const relayPending = new Map<string, PendingRelayRequest>();
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
  readonly theme: 'light+dark';
} | null = null;
let relayConnectionAttempts = 0;
let relayRecoveryGeneration = 0;
let relayRecoveryActive = false;
let pendingInitialRoute: string | null = null;
let lastRendererReadyRoute: string | null = null;
let publishRelayTransportState:
  | ((state: 'connected' | 'reconnecting' | 'offline') => void)
  | null = null;
let publishRelayGitActionProgress: ((event: unknown) => void) | null = null;

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
        readonly recentRpcTags: readonly string[];
        readonly rendererReadyRoute: string | null;
        readonly lastTransportError: string | null;
        readonly lastRpcError: string | null;
      })
    | undefined;
}

function configuredRelayBaseUrl(): string {
  return normalizeSynaraWsUrl(
    resolveWebRelayEndpoint(
      globalThis.__SYNARA_LYNX_RUNTIME__?.wsUrl,
      buildTimeSynaraWsUrl(),
      DEFAULT_SYNARA_WS_URL
    )
  );
}

function normalizeSynaraWsUrl(value: unknown): string {
  const candidate = String(value ?? '').trim() || DEFAULT_SYNARA_WS_URL;
  const url = new URL(candidate);
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('Synara relay endpoint must use ws: or wss:');
  }
  return url.origin;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
      publishRelayTransportState?.('reconnecting');
      try {
        await ensureRelaySocket(baseUrl);
        if (generation !== relayRecoveryGeneration) return;
        relayRecoveryActive = false;
        publishRelayTransportState?.('connected');
        return;
      } catch {
        if (generation !== relayRecoveryGeneration) return;
        publishRelayTransportState?.('offline');
        await sleep(OFFLINE_RETRY_DELAY_MS);
      }
    }
  })();
}

function connectWithPath(baseUrl: string, path: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const socket = new WebSocket(`${baseUrl}${path}`);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      safeClose(socket);
      reject(
        new Error(`WebSocket open timed out after ${SOCKET_OPEN_TIMEOUT_MS}ms`)
      );
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

function parseResponse(data: unknown): RpcExit | RpcChunk | null {
  try {
    const parsed = JSON.parse(String(data)) as RpcExit | RpcChunk;
    return parsed?._tag === 'Exit' || parsed?._tag === 'Chunk' ? parsed : null;
  } catch {
    return null;
  }
}

async function negotiate(baseUrl: string): Promise<{
  readonly protocolEpoch: number;
  readonly negotiatedRevision: number;
  readonly serverInstanceId: string;
}> {
  const socket = await connectWithPath(baseUrl, '/ws/bootstrap');
  try {
    return await new Promise((resolve, reject) => {
      const id = String(++relaySequence);
      const timer = setTimeout(() => {
        reject(new Error('Synara bootstrap negotiation timed out'));
      }, SOCKET_OPEN_TIMEOUT_MS);
      socket.onmessage = (event) => {
        const message = parseResponse(event.data);
        if (!message || message._tag !== 'Exit' || message.requestId !== id) return;
        clearTimeout(timer);
        if (message.exit._tag === 'Success') {
          resolve(
            message.exit.value as {
              readonly protocolEpoch: number;
              readonly negotiatedRevision: number;
              readonly serverInstanceId: string;
            }
          );
          return;
        }
        reject(
          new Error(
            `Synara bootstrap negotiation failed: ${JSON.stringify(
              message.exit.cause
            )}`
          )
        );
      };
      socket.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Synara bootstrap socket failed'));
      };
      socket.send(
        JSON.stringify({
          _tag: 'Request',
          id,
          tag: 'bootstrap.negotiate',
          payload: {
            protocolEpoch: PROTOCOL.epoch,
            minRevision: PROTOCOL.minRevision,
            maxRevision: PROTOCOL.maxRevision,
            clientBuild: CLIENT_BUILD,
            requiredCapabilities: [...PROTOCOL.capabilities],
          },
          headers: [],
        })
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

async function openFeatureSocket(baseUrl: string): Promise<WebSocket> {
  const compatibility = await negotiate(baseUrl);
  const query = new URLSearchParams({
    'x-synara-client-build': CLIENT_BUILD,
    'x-synara-protocol-epoch': String(compatibility.protocolEpoch),
    'x-synara-protocol-revision': String(compatibility.negotiatedRevision),
    'x-synara-server-instance': compatibility.serverInstanceId,
  });
  const socket = await connectWithPath(baseUrl, `/ws?${query}`);
  socket.onmessage = (event) => {
    const message = parseResponse(event.data);
    if (!message) return;
    const pending = relayPending.get(message.requestId);
    if (!pending) return;
    if (message._tag === 'Chunk') {
      pending.chunks?.push(...message.values);
      for (const value of message.values) publishRelayGitActionProgress?.(value);
      try {
        socket.send(
          JSON.stringify({
            _tag: 'Ack',
            requestId: message.requestId,
          })
        );
      } catch (error) {
        const transportError = new Error(
          `Synara RPC ${pending.tag} acknowledgement failed: ${describeError(
            error
          )}`
        );
        relayLastTransportError = transportError.message;
        invalidateRelaySocket(socket, baseUrl, transportError);
      }
      return;
    }
    relayPending.delete(message.requestId);
    if (pending.timer !== null) clearTimeout(pending.timer);
    if (message.exit._tag === 'Success') {
      relayLastRpcError = null;
      pending.resolve(pending.chunks ?? message.exit.value);
      return;
    }
    const error = new SynaraRpcResponseError(
      `Synara RPC ${pending.tag} failed: ${JSON.stringify(
        message.exit.cause
      )}`
    );
    relayLastRpcError = error.message;
    pending.reject(error);
  };
  socket.onerror = () => {
    relayLastTransportError = 'Synara relay socket failed';
    invalidateRelaySocket(
      socket,
      baseUrl,
      new Error('Synara relay socket failed')
    );
  };
  socket.onclose = () => {
    relayLastTransportError = 'Synara relay socket closed';
    invalidateRelaySocket(
      socket,
      baseUrl,
      new Error('Synara relay socket closed')
    );
  };
  return socket;
}

async function connectWithBackoff(baseUrl: string): Promise<WebSocket> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RECONNECT_ATTEMPTS; attempt += 1) {
    relayConnectionAttempts += 1;
    try {
      const socket = await openFeatureSocket(baseUrl);
      relayLastTransportError = null;
      return socket;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      relayLastTransportError = lastError.message;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) break;
      await sleep(
        Math.min(
          INITIAL_RECONNECT_DELAY_MS * 2 ** attempt,
          MAX_RECONNECT_DELAY_MS
        )
      );
    }
  }
  throw lastError ?? new Error('Synara relay connection failed');
}

async function ensureRelaySocket(baseUrl: string): Promise<WebSocket> {
  if (
    relaySocket &&
    relaySocketBaseUrl === baseUrl &&
    relaySocket.readyState === WebSocket.OPEN
  ) {
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
    if (socket.readyState !== WebSocket.OPEN) {
      throw new Error('Synara relay socket closed while connecting');
    }
    relaySocket = socket;
    relaySocketBaseUrl = baseUrl;
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
  stream = false
): Promise<unknown> {
  const baseUrl = normalizeSynaraWsUrl(
    resolveWebRelayEndpoint(
      globalThis.__SYNARA_LYNX_RUNTIME__?.wsUrl,
      baseUrlValue,
      DEFAULT_SYNARA_WS_URL
    )
  );
  const tag = String(tagValue ?? '').trim();
  if (!tag) throw new Error('Synara RPC tag is required');
  relayRecentRpcTags.push(tag);
  if (relayRecentRpcTags.length > 40) relayRecentRpcTags.shift();
  const socket = await ensureRelaySocket(baseUrl);
  const id = String(++relaySequence);
  return new Promise((resolve, reject) => {
    const timer = stream
      ? undefined
      : setTimeout(() => {
          relayPending.delete(id);
          const error = new Error(
            `Synara RPC ${tag} timed out after ${RPC_REQUEST_TIMEOUT_MS}ms`
          );
          reject(error);
          invalidateRelaySocket(socket, baseUrl, error);
        }, RPC_REQUEST_TIMEOUT_MS);
    relayPending.set(id, {
      tag,
      resolve,
      reject,
      timer: timer ?? null,
      ...(stream ? { chunks: [] } : {}),
    });
    try {
      socket.send(
        JSON.stringify({ _tag: 'Request', id, tag, payload, headers: [] })
      );
    } catch (error) {
      relayPending.delete(id);
      clearTimeout(timer);
      const transportError = new Error(
        `Synara RPC ${tag} send failed: ${describeError(error)}`
      );
      reject(transportError);
      invalidateRelaySocket(socket, baseUrl, transportError);
    }
  });
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
  const lynxRoot = (
    webDocument.getElementById('root-view') as HTMLElement | null
  )?.shadowRoot;
  const list = lynxRoot?.querySelector<HTMLElement>('.TranscriptList');
  if (!list) {
    transcriptScrollElement = null;
    transcriptPreviousScrollTop = null;
    return null;
  }
  const previousScrollTop =
    transcriptScrollElement === list ? transcriptPreviousScrollTop : null;
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
  if (!svg.startsWith('<svg') || svg.length > 1_000_000) {
    throw new Error('Profile share card SVG is invalid.');
  }
  const sourceUrl = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml' })
  );
  const image = new Image();
  image.decoding = 'sync';
  try {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener(
        'error',
        () => reject(new Error('The profile share card could not be decoded.')),
        { once: true }
      );
      image.src = sourceUrl;
    });
    const canvas = webDocument.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable.');
    context.drawImage(image, 0, 0);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('PNG rendering failed.')),
        'image/png'
      )
    );
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function handleBridgeCall(
  method: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  try {
    if (method === 'synaraRpc') {
      if (params.tag === NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG) {
        syntaxHighlightCallCount += 1;
        const payload =
          params.payload && typeof params.payload === 'object'
            ? (params.payload as Record<string, unknown>)
            : {};
        const path = typeof payload.path === 'string' ? payload.path : '';
        try {
          const { highlightCodeThemesForNativePreview } = await import(
            '../syntaxHighlightingHost'
          );
          const result = await highlightCodeThemesForNativePreview({
            code: typeof payload.code === 'string' ? payload.code : '',
            path,
          });
          lastSyntaxHighlightResult = {
            error: null,
            language: result?.light.language ?? null,
            path,
            theme: 'light+dark',
          };
          return result;
        } catch (error) {
          lastSyntaxHighlightResult = {
            error: describeError(error),
            language: null,
            path,
            theme: 'light+dark',
          };
          throw error;
        }
      }
      return await synaraRpc(params.baseUrl, params.tag, params.payload);
    }
    if (method === 'synaraRpcStream') {
      return await synaraRpc(params.baseUrl, params.tag, params.payload, true);
    }
    if (method === 'terminalOpen') {
      return await synaraRpc(
        params.baseUrl,
        'terminal.open',
        params
      );
    }
    if (method === 'terminalWrite') {
      return await synaraRpc(
        params.baseUrl,
        'terminal.write',
        params
      );
    }
    if (method === 'terminalClose') {
      return await synaraRpc(
        params.baseUrl,
        'terminal.close',
        params
      );
    }
    if (method === 'timerSleep') {
      const milliseconds = Number(params.milliseconds ?? 0);
      if (Number.isFinite(milliseconds) && milliseconds > 0) {
        await sleep(milliseconds);
      }
      return null;
    }
    if (method === 'windowGetViewport') {
      return {
        width: globalThis.innerWidth,
        height: globalThis.innerHeight,
      };
    }
    if (method === 'runtimeGetSynaraWsUrl') {
      return {
        wsUrl:
          relaySocketBaseUrl ??
          relayReadyBaseUrl ??
          configuredRelayBaseUrl(),
      };
    }
    if (method === 'shellRendererReady') {
      const route = pendingInitialRoute;
      pendingInitialRoute = null;
      lastRendererReadyRoute = route;
      return { ok: true, route };
    }
    if (method === 'storageDump') {
      return { entries: readStorageEntries() };
    }
    if (method === 'storageSet') {
      globalThis.localStorage.setItem(
        `${STORAGE_PREFIX}${String(params.key ?? '')}`,
        String(params.value ?? '')
      );
      return null;
    }
    if (method === 'storageRemove') {
      globalThis.localStorage.removeItem(
        `${STORAGE_PREFIX}${String(params.key ?? '')}`
      );
      return null;
    }
    if (method === 'storageClear') {
      clearStorageEntries();
      return null;
    }
    if (method === 'readTranscriptScroll') {
      return readTranscriptScroll();
    }
    if (method === 'clipboardWriteText') {
      relayClipboardText = String(params.text ?? '');
      try {
        await globalThis.navigator.clipboard.writeText(relayClipboardText);
      } catch {
        // Native uses the real system clipboard. The fallback keeps only the
        // isolated Lynx-for-Web harness interaction deterministic.
      }
      return null;
    }
    if (method === 'clipboardReadText') {
      try {
        return { text: await globalThis.navigator.clipboard.readText() };
      } catch {
        return { text: relayClipboardText };
      }
    }
    if (method === 'profileShareExport') {
      const blob = await renderSvgToPngBlob(String(params.svg ?? ''));
      if (typeof ClipboardItem !== 'function') return { ok: false };
      await globalThis.navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return { ok: true };
    }
    if (method === 'dialogsPickProfileImage') {
      return await new Promise((resolve) => {
        const input = webDocument.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp,image/gif';
        input.style.display = 'none';
        const finish = (image: { dataUrl: string; name: string } | null) => {
          input.remove();
          resolve({ image });
        };
        input.addEventListener(
          'change',
          () => {
            const file = input.files?.[0];
            if (!file || file.size > 10 * 1024 * 1024) {
              finish(null);
              return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              finish({
                dataUrl: String(reader.result ?? ''),
                name: file.name,
              });
            });
            reader.addEventListener('error', () => finish(null));
            reader.readAsDataURL(file);
          },
          { once: true }
        );
        webDocument.body.append(input);
        input.click();
      });
    }
    if (method === 'dialogsConfirm') {
      return {
        confirmed: globalThis.confirm(String(params.message ?? '')),
      };
    }
    if (method === 'dialogsSaveProfileShareCard') {
      const blob = await renderSvgToPngBlob(String(params.svg ?? ''));
      const url = URL.createObjectURL(blob);
      try {
        const anchor = webDocument.createElement('a');
        anchor.href = url;
        anchor.download = String(
          params.defaultFilename ?? 'synara-stats.png'
        );
        anchor.click();
        return { path: anchor.download };
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (method === 'shellOpenExternal') {
      const url = String(params.url ?? '');
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return { opened: false };
      }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { opened: false };
      }
      globalThis.open(parsed.toString(), '_blank', 'noopener,noreferrer');
      return { opened: true };
    }
    if (method === 'showDialog') {
      globalThis.alert(String(params.message ?? ''));
      return {};
    }
    return null;
  } catch (error) {
    if (error instanceof SynaraRpcResponseError) {
      relayLastRpcError = describeError(error);
    } else {
      relayLastTransportError = describeError(error);
      if (method === 'synaraRpc' || method === 'synaraRpcStream') {
        startRelayRecovery(configuredRelayBaseUrl());
      }
    }
    return {
      error: describeError(error),
      errorKind: error instanceof SynaraRpcResponseError ? 'rpc' : 'transport',
    };
  }
}

pendingInitialRoute = resolveWebInitialRoute(globalThis.location.search);
const initialEnvironmentOpen =
  new URLSearchParams(globalThis.location.search).get('environment') === 'open';
const initialEditorOpen =
  new URLSearchParams(globalThis.location.search).get('editor') === 'open';
const initialEditorCenterMode =
  new URLSearchParams(globalThis.location.search).get('editorMode') === 'diff'
    ? 'diff'
    : 'file';
const initialEditorChatOpen =
  new URLSearchParams(globalThis.location.search).get('editorChat') === 'hidden'
    ? false
    : new URLSearchParams(globalThis.location.search).get('editorChat') === 'open'
      ? true
      : null;
const initialEditorSearchOpen =
  new URLSearchParams(globalThis.location.search).get('editorSearch') === 'open';
const initialEditorHistoryOpen =
  new URLSearchParams(globalThis.location.search).get('editorHistory') ===
  'open';
const initialEditorNewOpen =
  new URLSearchParams(globalThis.location.search).get('editorNew') === 'open';
const initialEditorNewChatOpen =
  new URLSearchParams(globalThis.location.search).get('editorNewChat') ===
  'open';
const initialRenameOpen =
  new URLSearchParams(globalThis.location.search).get('rename') === 'open';
const initialTerminalOpen =
  new URLSearchParams(globalThis.location.search).get('terminal') === 'open';
const initialTemporaryOpen =
  new URLSearchParams(globalThis.location.search).get('temporary') === 'open';
const initialWorkspaceSettingsOpen =
  new URLSearchParams(globalThis.location.search).get('workspaceSettings') ===
  'open';
const initialWorkspaceVisible =
  new URLSearchParams(globalThis.location.search).get('workspaceVisible') ===
  'open';
const initialExplorerOpen =
  new URLSearchParams(globalThis.location.search).get('explorer') === 'open';
const initialExplorerActionMenuOpen =
  new URLSearchParams(globalThis.location.search).get('explorerActionMenu') ===
  'open';
const initialExplorerPath =
  new URLSearchParams(globalThis.location.search).get('explorerPath');
const initialExplorerQuery =
  new URLSearchParams(globalThis.location.search).get('explorerQuery') ?? '';
const initialExplorerCommentLineValue = Number(
  new URLSearchParams(globalThis.location.search).get('explorerCommentLine')
);
const initialExplorerCommentLine =
  Number.isInteger(initialExplorerCommentLineValue) &&
  initialExplorerCommentLineValue > 0
    ? initialExplorerCommentLineValue
    : null;
const initialExplorerExpandedDirectories =
  new URLSearchParams(globalThis.location.search).getAll('explorerExpanded');
const initialExplorerWidthValue = Number(
  new URLSearchParams(globalThis.location.search).get('explorerWidth')
);
const initialExplorerWidth =
  Number.isFinite(initialExplorerWidthValue) && initialExplorerWidthValue > 0
    ? initialExplorerWidthValue
    : null;
const initialComposerModelMenuOpen =
  new URLSearchParams(globalThis.location.search).get(
    COMPOSER_MODEL_MENU_QUERY
  ) === 'open';
const initialComposerModelProvider =
  new URLSearchParams(globalThis.location.search).get(
    COMPOSER_MODEL_PROVIDER_QUERY
  );
const systemAppearanceQuery = globalThis.matchMedia(
  '(prefers-color-scheme: dark)'
);
const initialSystemDark = systemAppearanceQuery.matches;
const reducedMotionQuery = globalThis.matchMedia(
  '(prefers-reduced-motion: reduce)'
);
const initialReducedMotion = reducedMotionQuery.matches;
webDocument.body.innerHTML = `
<lynx-view
  id="root-view"
  style="height:100vh; width:100vw;"
  init-data='${JSON.stringify({
    initialEnvironmentOpen,
    initialEditorOpen,
    initialEditorCenterMode,
    initialEditorChatOpen,
    initialEditorSearchOpen,
    initialEditorHistoryOpen,
    initialEditorNewOpen,
    initialEditorNewChatOpen,
    initialRenameOpen,
    initialTerminalOpen,
    initialTemporaryOpen,
    initialWorkspaceSettingsOpen,
    initialWorkspaceVisible,
    initialExplorerOpen,
    initialExplorerActionMenuOpen,
    initialExplorerPath,
    initialExplorerCommentLine,
    initialExplorerQuery,
    initialExplorerExpandedDirectories,
    initialExplorerWidth,
    initialComposerModelMenuOpen,
    initialComposerModelProvider,
    initialReducedMotion,
    initialSystemDark,
    initialRoute: pendingInitialRoute,
  })}'
  url="${bundleUrl}">
</lynx-view>`;

const lynxView = webDocument.getElementById('root-view') as any;
lynxView.injectStyleRules = LYNX_WEB_STYLE_RULES;

publishRelayTransportState = (state) => {
  lynxView.sendGlobalEvent?.(TRANSPORT_STATE_EVENT, [state]);
};
publishRelayGitActionProgress = (event) => {
  lynxView.sendGlobalEvent?.(GIT_ACTION_PROGRESS_EVENT, [event]);
};

globalThis.__SYNARA_LYNX_RELAY_DIAGNOSTICS__ = () => ({
  configuredBaseUrl: configuredRelayBaseUrl(),
  activeBaseUrl: relaySocketBaseUrl,
  readyBaseUrl: relayReadyBaseUrl,
  socketState: relaySocket?.readyState ?? null,
  connectionAttempts: relayConnectionAttempts,
  pendingRequests: relayPending.size,
  recentRpcTags: [...relayRecentRpcTags],
  rendererReadyRoute: lastRendererReadyRoute,
  lastTransportError: relayLastTransportError,
  lastRpcError: relayLastRpcError,
  explorerPreviewActionCount,
  lastExplorerPreviewAction,
  interactionEventCount,
  lastInteractionEvent,
  syntaxHighlightCallCount,
  lastSyntaxHighlightResult,
});

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
  const queryDeep = <T extends HTMLElement>(
    container: ParentNode,
    selector: string
  ): T | null => {
    const direct = container.querySelector<T>(selector);
    if (direct) return direct;
    for (const element of container.querySelectorAll<HTMLElement>('*')) {
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
        kind: 'explorer-visibility',
        open: activation.open,
      });
    },
    (activation) => {
      publishInteraction({
        kind: 'environment-visibility',
        open: activation.open,
      });
    },
    (navigation) => {
      publishInteraction({
        kind: 'explorer-navigation',
        ...navigation,
      });
    },
    (resize) => {
      if (resize.panel !== 'ExplorerDock') return;
      publishInteraction({
        kind: 'explorer-resize',
        width: resize.width,
      });
    },
    (action) => {
      explorerPreviewActionCount += 1;
      lastExplorerPreviewAction = action;
      publishInteraction({
        kind: 'explorer-preview-menu',
        path: action.path,
      });
    },
    (commentLine) => {
      publishInteraction({
        kind: 'explorer-comment-line',
        lineNumber: commentLine.lineNumber,
      });
    },
    (activation) => {
      publishInteraction({
        kind: 'composer-model-menu',
        ...(activation.provider
          ? { provider: activation.provider }
          : {}),
      });
    }
  );
  if (initialExplorerActionMenuOpen) {
    positionInitialOverlayWhenReady(() => {
      const trigger = queryDeep<HTMLElement>(
        root,
        '.ExplorerDockPreviewActions'
      );
      const popup = queryDeep<HTMLElement>(
        root,
        '.ExplorerDockPreviewActionsPopup'
      );
      if (!trigger || !popup) return false;
      const triggerRect = trigger.getBoundingClientRect();
      const popupWidth = popup.getBoundingClientRect().width || 208;
      popup.style.left = `${Math.max(
        4,
        triggerRect.right - popupWidth
      )}px`;
      popup.style.top = `${triggerRect.bottom + 4}px`;
      popup.style.visibility = 'visible';
      return true;
    });
  }
  if (initialComposerModelMenuOpen) {
    positionInitialOverlayWhenReady(() => {
      const trigger = queryDeep<HTMLElement>(
        root,
        '.ComposerModelTriggerLynx'
      );
      const popup = queryDeep<HTMLElement>(
        root,
        '.ComposerModelPopupLynx'
      );
      const layer = popup?.closest<HTMLElement>('.LxMenuLayer');
      if (!trigger || !popup || !layer) return false;
      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      popup.style.left = `${Math.max(
        4,
        triggerRect.right - layerRect.left - popupRect.width
      )}px`;
      popup.style.top = `${Math.max(
        4,
        triggerRect.top - layerRect.top - popupRect.height - 6
      )}px`;
      popup.style.visibility = 'visible';
      return true;
    });
  }
  return true;
};
if (!installInteractionBridge()) {
  lynxView.addEventListener('load', installInteractionBridge, { once: true });
}
const publishViewportSize = () => {
  lynxView.sendGlobalEvent?.('viewport:resize', [
    globalThis.innerWidth,
    globalThis.innerHeight,
  ]);
};
const publishSystemAppearance = (event: MediaQueryListEvent) => {
  lynxView.sendGlobalEvent?.(SYSTEM_APPEARANCE_EVENT, [event.matches]);
};
const publishReducedMotion = (event: MediaQueryListEvent) => {
  lynxView.sendGlobalEvent?.(REDUCED_MOTION_EVENT, [event.matches]);
};
globalThis.addEventListener('resize', publishViewportSize);
systemAppearanceQuery.addEventListener('change', publishSystemAppearance);
reducedMotionQuery.addEventListener('change', publishReducedMotion);

globalThis.addEventListener('pagehide', () => {
  globalThis.removeEventListener('resize', publishViewportSize);
  systemAppearanceQuery.removeEventListener('change', publishSystemAppearance);
  reducedMotionQuery.removeEventListener('change', publishReducedMotion);
  interactionBridgeController.abort();
  safeClose(relaySocket);
  rejectPendingRequests(new Error('Synara relay page closed'));
});
