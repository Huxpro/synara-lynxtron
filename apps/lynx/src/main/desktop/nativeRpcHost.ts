import WebSocket from 'ws';

import {
  createRpcSocketManager,
  isRpcTransportError,
  openRpcSocketWithTimeout,
  type RpcTransportState,
  type StartRpcTimeout,
} from '../../data/rpcTransport.logic';
import { resolveSynaraWsUrl } from './runtimeEndpoint.logic';
import { normalizeLynxRpcPayload } from '../rpcPayload.logic';

const CLIENT_BUILD = '0.5.5-lynx-slice';
const SOCKET_OPEN_TIMEOUT_MS = 8_000;
const RPC_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 6;
const INITIAL_RECONNECT_DELAY_MS = 250;
const MAX_RECONNECT_DELAY_MS = 2_000;
const OFFLINE_RETRY_DELAY_MS = 5_000;
const PROTOCOL = {
  epoch: 1,
  minRevision: 1,
  maxRevision: 1,
  capabilities: ['orchestration.cursor-safe-streams', 'rpc.typed-errors'],
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

function createManager(
  connect: () => Promise<WebSocket>,
  options: {
    readonly maxReconnectAttempts?: number;
    readonly closeWhenIdle?: boolean;
  } = {}
) {
  return createRpcSocketManager({
    connect,
    sleep: (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    startTimeout,
    nextRequestId: () => String(++requestSequence),
    requestTimeoutMs: RPC_REQUEST_TIMEOUT_MS,
    maxReconnectAttempts:
      options.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS,
    initialReconnectDelayMs: INITIAL_RECONNECT_DELAY_MS,
    maxReconnectDelayMs: MAX_RECONNECT_DELAY_MS,
    offlineRetryDelayMs: OFFLINE_RETRY_DELAY_MS,
    closeWhenIdle: options.closeWhenIdle ?? true,
    autoReconnectOnFailure: true,
  });
}

async function negotiate(baseUrl: string): Promise<{
  readonly protocolEpoch: number;
  readonly negotiatedRevision: number;
  readonly serverInstanceId: string;
}> {
  const bootstrapUrl = new URL(baseUrl);
  bootstrapUrl.pathname = '/ws/bootstrap';
  bootstrapUrl.hash = '';
  const manager = createManager(
    () => openSocket(bootstrapUrl.toString()),
    { maxReconnectAttempts: 0 }
  );
  try {
    return await manager.request('bootstrap.negotiate', {
      protocolEpoch: PROTOCOL.epoch,
      minRevision: PROTOCOL.minRevision,
      maxRevision: PROTOCOL.maxRevision,
      clientBuild: CLIENT_BUILD,
      requiredCapabilities: [...PROTOCOL.capabilities],
    });
  } finally {
    manager.dispose();
  }
}

async function openFeatureSocket(): Promise<WebSocket> {
  const socketUrl = new URL(resolveSynaraWsUrl(process.env.SYNARA_WS_URL));
  const compatibility = await negotiate(socketUrl.toString());
  socketUrl.pathname = '/ws';
  socketUrl.hash = '';
  socketUrl.searchParams.set('x-synara-client-build', CLIENT_BUILD);
  socketUrl.searchParams.set(
    'x-synara-protocol-epoch',
    String(compatibility.protocolEpoch)
  );
  socketUrl.searchParams.set(
    'x-synara-protocol-revision',
    String(compatibility.negotiatedRevision)
  );
  socketUrl.searchParams.set(
    'x-synara-server-instance',
    compatibility.serverInstanceId
  );
  return openSocket(socketUrl.toString());
}

const featureManager = createManager(openFeatureSocket, {
  closeWhenIdle: false,
});

export function subscribeNativeRpcTransportState(
  listener: (state: RpcTransportState) => void
): () => void {
  return featureManager.subscribe(listener);
}

export async function handleNativeRpc(
  method: 'synaraRpc' | 'synaraRpcStream',
  data: {
    readonly tag?: unknown;
    readonly payload?: unknown;
  },
  onProgress?: (event: unknown) => void
): Promise<unknown> {
  const tag = String(data.tag ?? '').trim();
  if (!tag) throw new Error('Synara RPC tag is required');
  try {
    if (method === 'synaraRpcStream') {
      const events: unknown[] = [];
      await featureManager.requestStream(tag, data.payload, (event) => {
        if (tag !== 'terminal.subscribeEvents') events.push(event);
        onProgress?.(event);
      });
      return events;
    }
    return await featureManager.request(
      tag,
      normalizeLynxRpcPayload(tag, data.payload)
    );
  } catch (error) {
    const relayError = new Error(
      error instanceof Error ? error.message : String(error)
    ) as Error & { errorKind?: 'rpc' | 'transport' };
    relayError.errorKind = isRpcTransportError(error) ? 'transport' : 'rpc';
    throw relayError;
  }
}

export function disposeNativeRpcHost(): void {
  featureManager.dispose();
}
