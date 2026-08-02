// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/web-core/client';
import { setupSymmetricHost } from '@lynx-js/lynxtron/web-host';

const bundleUrl = './main.web.bundle';
const nodejsAdapterUrl = './nodejs-adapter-web.js';
const webDocument = globalThis.document;
const CLIENT_BUILD = '0.5.5-lynx-web';
const DEFAULT_SYNARA_WS_URL = 'ws://127.0.0.1:58090';
const SOCKET_OPEN_TIMEOUT_MS = 8_000;
const RPC_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 6;
const INITIAL_RECONNECT_DELAY_MS = 250;
const MAX_RECONNECT_DELAY_MS = 2_000;
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

interface PendingRelayRequest {
  readonly tag: string;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

class SynaraRpcResponseError extends Error {
  readonly name = 'SynaraRpcResponseError';
}

let relaySocket: WebSocket | null = null;
let relaySocketBaseUrl: string | null = null;
let relayReady: Promise<WebSocket> | null = null;
let relayReadyBaseUrl: string | null = null;
let relaySequence = 0;
const relayPending = new Map<string, PendingRelayRequest>();
let transcriptScrollElement: HTMLElement | null = null;
let transcriptPreviousScrollTop: number | null = null;

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

function safeClose(socket: WebSocket | null): void {
  try {
    socket?.close();
  } catch {
    // The socket is already unusable.
  }
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

function parseExit(data: unknown): RpcExit | null {
  try {
    const parsed = JSON.parse(String(data)) as RpcExit;
    return parsed?._tag === 'Exit' ? parsed : null;
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
        const message = parseExit(event.data);
        if (!message || message.requestId !== id) return;
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
    clearTimeout(pending.timer);
    pending.reject(error);
  }
  relayPending.clear();
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
    const message = parseExit(event.data);
    if (!message) return;
    const pending = relayPending.get(message.requestId);
    if (!pending) return;
    relayPending.delete(message.requestId);
    clearTimeout(pending.timer);
    if (message.exit._tag === 'Success') {
      pending.resolve(message.exit.value);
      return;
    }
    pending.reject(
      new SynaraRpcResponseError(
        `Synara RPC ${pending.tag} failed: ${JSON.stringify(
          message.exit.cause
        )}`
      )
    );
  };
  socket.onerror = () => {
    rejectPendingRequests(new Error('Synara relay socket failed'));
  };
  socket.onclose = () => {
    if (relaySocket === socket) {
      relaySocket = null;
      relaySocketBaseUrl = null;
    }
    rejectPendingRequests(new Error('Synara relay socket closed'));
  };
  return socket;
}

async function connectWithBackoff(baseUrl: string): Promise<WebSocket> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RECONNECT_ATTEMPTS; attempt += 1) {
    try {
      return await openFeatureSocket(baseUrl);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
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
    safeClose(relaySocket);
    relaySocket = null;
    relaySocketBaseUrl = null;
  }

  const pending = connectWithBackoff(baseUrl);
  relayReady = pending;
  relayReadyBaseUrl = baseUrl;
  try {
    const socket = await pending;
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
  payload: unknown
): Promise<unknown> {
  const baseUrl = normalizeSynaraWsUrl(baseUrlValue);
  const tag = String(tagValue ?? '').trim();
  if (!tag) throw new Error('Synara RPC tag is required');
  const socket = await ensureRelaySocket(baseUrl);
  const id = String(++relaySequence);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      relayPending.delete(id);
      reject(
        new Error(
          `Synara RPC ${tag} timed out after ${RPC_REQUEST_TIMEOUT_MS}ms`
        )
      );
    }, RPC_REQUEST_TIMEOUT_MS);
    relayPending.set(id, { tag, resolve, reject, timer });
    try {
      socket.send(
        JSON.stringify({ _tag: 'Request', id, tag, payload, headers: [] })
      );
    } catch (error) {
      relayPending.delete(id);
      clearTimeout(timer);
      reject(new Error(`Synara RPC ${tag} send failed: ${describeError(error)}`));
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

async function handleBridgeCall(
  method: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  try {
    if (method === 'synaraRpc') {
      return await synaraRpc(params.baseUrl, params.tag, params.payload);
    }
    if (method === 'timerSleep') {
      const milliseconds = Number(params.milliseconds ?? 0);
      if (Number.isFinite(milliseconds) && milliseconds > 0) {
        await sleep(milliseconds);
      }
      return null;
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
    if (method === 'showDialog') {
      globalThis.alert(String(params.message ?? ''));
      return {};
    }
    return null;
  } catch (error) {
    return {
      error: describeError(error),
      errorKind: error instanceof SynaraRpcResponseError ? 'rpc' : 'transport',
    };
  }
}

webDocument.body.innerHTML = `
<lynx-view
  id="root-view"
  style="height:100vh; width:100vw;"
  url="${bundleUrl}">
</lynx-view>`;

const lynxView = webDocument.getElementById('root-view') as any;

setupSymmetricHost(lynxView, {
  bridge: {
    call: handleBridgeCall,
  },
  nodejs: {
    scriptURL: nodejsAdapterUrl,
  },
});

globalThis.addEventListener('pagehide', () => {
  safeClose(relaySocket);
  rejectPendingRequests(new Error('Synara relay page closed'));
});
