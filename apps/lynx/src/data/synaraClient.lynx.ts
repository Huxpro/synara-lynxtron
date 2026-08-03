import 'background-only';

import type {
  ClientOrchestrationCommand,
  FilesystemBrowseInput,
  FilesystemBrowseResult,
  ModelSelection,
  OrchestrationImportThreadInput,
  OrchestrationImportThreadResult,
  OrchestrationLatestTurn,
  OrchestrationMessage,
  OrchestrationProposedPlan,
  OrchestrationShellSnapshot,
  OrchestrationSidebarSearchSnapshot,
  OrchestrationThreadDetailSnapshot,
  OrchestrationSession,
  OrchestrationThreadActivity,
  ProjectId,
  PullRequestDetail,
  PullRequestDetailInput,
  PullRequestDiffResult,
  PullRequestActionInput,
  PullRequestActionResult,
  PullRequestListEntry,
  PullRequestSetPinnedInput,
  PullRequestSetPinnedResult,
  PullRequestState,
  ProviderKind,
  ProviderComposerCapabilities,
  ProviderListModelsResult,
  ProviderListSkillsResult,
  ServerConfig,
  ServerListProviderUsageInput,
  ServerListProviderUsageResult,
  ServerSettingsPatch,
  ServerSettingsView,
} from '@synara/contracts';
import { createWebSocket, resolveDefaultSocketUrl, type WebSocketLike } from '../platform/net.socket';
import { sleepOnHost } from '../platform/timer';
import {
  createRpcSocketManager,
  openRpcSocketWithTimeout,
  RpcTransportError,
  type RpcTransportState,
  type StartRpcTimeout,
} from './rpcTransport.logic';

export interface SynaraThread {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: 'full-access' | 'approval-required';
  readonly interactionMode: 'default' | 'plan';
  readonly parentThreadId?: string | null;
  readonly subagentAgentId?: string | null;
  readonly subagentNickname?: string | null;
  readonly subagentRole?: string | null;
  readonly forkSourceThreadId?: string | null;
  readonly sidechatSourceThreadId?: string | null;
  readonly handoff?: {
    readonly sourceProvider: string;
  } | null;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
  readonly messages: readonly OrchestrationMessage[];
  readonly activities: readonly OrchestrationThreadActivity[];
  readonly proposedPlans: readonly OrchestrationProposedPlan[];
  readonly latestTurn: OrchestrationLatestTurn | null;
  readonly session: OrchestrationSession | null;
}

export interface SynaraProject {
  readonly id: string;
  readonly kind: 'project' | 'chat' | 'studio';
  readonly title: string;
  readonly workspaceRoot: string;
}

export interface SynaraSnapshot {
  readonly snapshotSequence: number;
  readonly projects: readonly SynaraProject[];
  readonly threads: readonly SynaraThread[];
}

export interface SynaraPullRequestListResult {
  readonly viewer: string | null;
  readonly entries: readonly PullRequestListEntry[];
  readonly errors: readonly {
    readonly projectId: string;
    readonly projectTitle: string;
    readonly message: string;
  }[];
  readonly repositoryBatches: readonly unknown[];
}

const PROTOCOL = {
  epoch: 1,
  minRevision: 1,
  maxRevision: 1,
  capabilities: ['orchestration.cursor-safe-streams', 'rpc.typed-errors'],
  bootstrapPath: '/ws/bootstrap',
  featurePath: '/ws',
} as const;
const IS_WEB_RELAY_MODE = process.env.SYNARA_LYNX_WEB_RELAY === '1';
const CLIENT_BUILD = IS_WEB_RELAY_MODE
  ? '0.5.5-lynx-web'
  : '0.5.5-lynx-slice';
const TRUSTED_APP_ORIGIN = 'synara://app';
const SOCKET_OPEN_TIMEOUT_MS = 8_000;
// Keep parity with Web's transport. Discovery and pull-request requests can
// legitimately cross a few seconds; 60s still bounds a missing close frame.
const RPC_REQUEST_TIMEOUT_MS = 60_000;
// Keep the reconnecting state long enough to be perceptible (and useful) while
// still bounding a hard outage to 7.75s of backoff before surfacing offline.
const MAX_RECONNECT_ATTEMPTS = 6;
const INITIAL_RECONNECT_DELAY_MS = 250;
const MAX_RECONNECT_DELAY_MS = 2_000;
const OFFLINE_RETRY_DELAY_MS = 5_000;

let requestSequence = 0;

function withPath(base: string, path: string): string {
  const origin = base.match(/^(wss?:\/\/[^/]+)/)?.[1];
  if (!origin) throw new Error(`Invalid Synara WebSocket URL: ${base}`);
  return `${origin}${path}`;
}

function withQuery(base: string, values: Readonly<Record<string, string>>): string {
  const query = Object.entries(values)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}?${query}`;
}

const startHostTimeout: StartRpcTimeout = (milliseconds, onTimeout) => {
  let cancelled = false;
  void sleepOnHost(milliseconds)
    .then(() => {
      if (!cancelled) onTimeout();
    })
    .catch(() => {
      if (!cancelled) onTimeout();
    });
  return () => {
    cancelled = true;
  };
};

function openSocket(url: string): Promise<WebSocketLike> {
  return openRpcSocketWithTimeout({
    timeoutMs: SOCKET_OPEN_TIMEOUT_MS,
    startTimeout: startHostTimeout,
    createSocket: () => {
    // Lynxtron otherwise supplies an opaque Origin for a native WebSocket.
    // Synara intentionally rejects opaque browser origins; use the existing
    // trusted desktop-app identity instead of weakening the server policy.
      return createWebSocket(url, undefined, {
        headers: { Origin: TRUSTED_APP_ORIGIN },
      });
    },
  });
}

function createManager(
  connect: () => Promise<WebSocketLike>,
  maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS
) {
  return createRpcSocketManager({
    connect,
    sleep: sleepOnHost,
    startTimeout: startHostTimeout,
    nextRequestId: () => String(++requestSequence),
    requestTimeoutMs: RPC_REQUEST_TIMEOUT_MS,
    maxReconnectAttempts,
    initialReconnectDelayMs: INITIAL_RECONNECT_DELAY_MS,
    maxReconnectDelayMs: MAX_RECONNECT_DELAY_MS,
    offlineRetryDelayMs: OFFLINE_RETRY_DELAY_MS,
    closeWhenIdle: true,
  });
}

async function negotiate(): Promise<{
  readonly protocolEpoch: number;
  readonly negotiatedRevision: number;
  readonly serverInstanceId: string;
}> {
  const manager = createManager(
    () =>
      openSocket(withPath(resolveDefaultSocketUrl(null), PROTOCOL.bootstrapPath)),
    0
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

async function openFeatureSocket(): Promise<WebSocketLike> {
  const compatibility = await negotiate();
  const url = withQuery(withPath(resolveDefaultSocketUrl(null), PROTOCOL.featurePath), {
    'x-synara-client-build': CLIENT_BUILD,
    'x-synara-protocol-epoch': String(compatibility.protocolEpoch),
    'x-synara-protocol-revision': String(compatibility.negotiatedRevision),
    'x-synara-server-instance': compatibility.serverInstanceId,
  });
  return openSocket(url);
}

const featureManager = createManager(openFeatureSocket);

let relayState: RpcTransportState = 'idle';
let relayEverConnected = false;
let relayOfflineUntilMs = 0;
const relayStateListeners = new Set<(state: RpcTransportState) => void>();

function setRelayState(state: RpcTransportState): void {
  if (relayState === state) return;
  relayState = state;
  for (const listener of relayStateListeners) listener(state);
}

function describeRelayError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface RelayBridgeError extends Error {
  readonly name: 'SynaraRpcResponseError' | 'RpcTransportError';
}

function relayBridgeRequest<A>(
  tag: string,
  payload: unknown
): Promise<A> {
  return new Promise((resolve, reject) => {
    try {
      NativeModules.bridge.call(
        'synaraRpc',
        {
          tag,
          payload,
          baseUrl: resolveDefaultSocketUrl(null),
        },
        (reply: unknown) => {
          try {
            const parsed =
              typeof reply === 'string' ? JSON.parse(reply) : reply;
            if (
              parsed &&
              typeof parsed === 'object' &&
              'error' in parsed &&
              parsed.error
            ) {
              const error = new Error(String(parsed.error)) as RelayBridgeError;
              error.name =
                'errorKind' in parsed && parsed.errorKind === 'rpc'
                  ? 'SynaraRpcResponseError'
                  : 'RpcTransportError';
              reject(error);
              return;
            }
            resolve(parsed as A);
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function relayRequest<A>(tag: string, payload: unknown): Promise<A> {
  if (relayState === 'offline' && Date.now() < relayOfflineUntilMs) {
    throw new RpcTransportError('Synara is offline; reconnect cooling down');
  }

  setRelayState(relayEverConnected ? 'reconnecting' : 'connecting');
  try {
    const result = await relayBridgeRequest<A>(tag, payload);
    relayEverConnected = true;
    relayOfflineUntilMs = 0;
    setRelayState('connected');
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'SynaraRpcResponseError') {
      relayEverConnected = true;
      relayOfflineUntilMs = 0;
      setRelayState('connected');
      throw error;
    }
    relayOfflineUntilMs = Date.now() + OFFLINE_RETRY_DELAY_MS;
    setRelayState('offline');
    throw new RpcTransportError(
      `Synara RPC ${tag} failed: ${describeRelayError(error)}`
    );
  }
}

function transportRequest<A>(tag: string, payload: unknown): Promise<A> {
  if (IS_WEB_RELAY_MODE) return relayRequest<A>(tag, payload);
  return featureManager.request<A>(tag, payload);
}

export function getSynaraTransportState(): RpcTransportState {
  return IS_WEB_RELAY_MODE ? relayState : featureManager.getState();
}

export function subscribeSynaraTransportState(
  listener: (state: RpcTransportState) => void
): () => void {
  if (!IS_WEB_RELAY_MODE) return featureManager.subscribe(listener);
  relayStateListeners.add(listener);
  listener(relayState);
  return () => relayStateListeners.delete(listener);
}

export async function fetchSynaraSnapshot(): Promise<SynaraSnapshot> {
  return transportRequest<SynaraSnapshot>('orchestration.getSnapshot', {});
}

export async function fetchSynaraShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  return transportRequest<OrchestrationShellSnapshot>(
    'orchestration.getShellSnapshot',
    {}
  );
}

export async function fetchSynaraSidebarShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  return transportRequest<OrchestrationShellSnapshot>(
    'orchestration.getSidebarShellSnapshot',
    {}
  );
}

export async function fetchSynaraSidebarSearchSnapshot(): Promise<OrchestrationSidebarSearchSnapshot> {
  return transportRequest<OrchestrationSidebarSearchSnapshot>(
    'orchestration.getSidebarSearchSnapshot',
    {}
  );
}

export async function fetchSynaraThreadDetailSnapshot(
  threadId: string
): Promise<OrchestrationThreadDetailSnapshot | null> {
  return transportRequest<OrchestrationThreadDetailSnapshot | null>(
    'orchestration.getThreadDetailSnapshot',
    { threadId }
  );
}

export async function dispatchSynaraCommand(
  command: ClientOrchestrationCommand
): Promise<{ readonly sequence: number }> {
  // The Effect-RPC wire payload is the command itself. Web's wsNativeApi adds
  // a local `{ command }` transport wrapper and unwraps it before the RPC call;
  // this raw Lynx client talks to Effect-RPC directly and must not reproduce
  // that browser-only wrapper.
  return transportRequest('orchestration.dispatchCommand', command);
}

export async function fetchProviderModels(input: {
  readonly provider: ProviderKind;
  readonly cwd?: string | null;
}): Promise<ProviderListModelsResult> {
  return transportRequest('provider.listModels', {
    provider: input.provider,
    ...(input.cwd ? { cwd: input.cwd } : {}),
  });
}

export async function fetchProviderComposerCapabilities(
  provider: ProviderKind
): Promise<ProviderComposerCapabilities> {
  return transportRequest('provider.getComposerCapabilities', { provider });
}

export async function fetchProviderSkills(input: {
  readonly provider: ProviderKind;
  readonly cwd: string;
  readonly threadId?: string;
}): Promise<ProviderListSkillsResult> {
  return transportRequest('provider.listSkills', input);
}

export async function browseFilesystem(
  input: FilesystemBrowseInput
): Promise<FilesystemBrowseResult> {
  return transportRequest<FilesystemBrowseResult>('filesystem.browse', input);
}

export async function importSynaraThread(
  input: OrchestrationImportThreadInput
): Promise<OrchestrationImportThreadResult> {
  return transportRequest<OrchestrationImportThreadResult>(
    'orchestration.importThread',
    input
  );
}

export async function fetchServerSettings(): Promise<ServerSettingsView> {
  return transportRequest<ServerSettingsView>('server.getSettings', {});
}

export async function updateServerSettings(
  patch: ServerSettingsPatch
): Promise<ServerSettingsView> {
  return transportRequest<ServerSettingsView>('server.updateSettings', patch);
}

export async function fetchServerConfig(): Promise<ServerConfig> {
  return transportRequest('server.getConfig', {});
}

export async function fetchAllProviderUsage(
  input: ServerListProviderUsageInput = {}
): Promise<ServerListProviderUsageResult> {
  return transportRequest<ServerListProviderUsageResult>(
    'server.listProviderUsage',
    input
  );
}

export async function fetchSynaraPullRequests(input: {
  readonly state: PullRequestState;
  readonly projectId: ProjectId | null;
}): Promise<SynaraPullRequestListResult> {
  return transportRequest<SynaraPullRequestListResult>('pullRequests.list', {
    involvement: 'all',
    state: input.state,
    projectId: input.projectId,
  });
}

export async function fetchSynaraPullRequestDetail(
  input: PullRequestDetailInput
): Promise<PullRequestDetail> {
  return transportRequest<PullRequestDetail>('pullRequests.detail', input);
}

export async function fetchSynaraPullRequestDiff(
  input: PullRequestDetailInput
): Promise<PullRequestDiffResult> {
  return transportRequest<PullRequestDiffResult>('pullRequests.diff', input);
}

export async function performSynaraPullRequestAction(
  input: PullRequestActionInput
): Promise<PullRequestActionResult> {
  return transportRequest<PullRequestActionResult>('pullRequests.action', input);
}

export async function setSynaraPullRequestPinned(
  input: PullRequestSetPinnedInput
): Promise<PullRequestSetPinnedResult> {
  return transportRequest<PullRequestSetPinnedResult>(
    'pullRequests.setPinned',
    input
  );
}

export async function disposeSynaraClient(): Promise<void> {
  if (IS_WEB_RELAY_MODE) {
    relayStateListeners.clear();
    relayOfflineUntilMs = 0;
    setRelayState('idle');
    return;
  }
  featureManager.dispose();
}
