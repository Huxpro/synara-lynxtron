import 'background-only';

import type {
  ClientOrchestrationCommand,
  ModelSelection,
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
  ProviderListModelsResult,
  ServerConfig,
  ServerSettingsPatch,
  ServerSettingsView,
} from '@synara/contracts';
import { createWebSocket, resolveDefaultSocketUrl, type WebSocketLike } from '../platform/net.socket';
import { sleepOnHost } from '../platform/timer';
import {
  createRpcSocketManager,
  openRpcSocketWithTimeout,
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
const CLIENT_BUILD = '0.5.5-lynx-slice';
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

export function getSynaraTransportState(): RpcTransportState {
  return featureManager.getState();
}

export function subscribeSynaraTransportState(
  listener: (state: RpcTransportState) => void
): () => void {
  return featureManager.subscribe(listener);
}

export async function fetchSynaraSnapshot(): Promise<SynaraSnapshot> {
  return featureManager.request<SynaraSnapshot>('orchestration.getSnapshot', {});
}

export async function fetchSynaraShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  return featureManager.request<OrchestrationShellSnapshot>(
    'orchestration.getShellSnapshot',
    {}
  );
}

export async function fetchSynaraSidebarShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  return featureManager.request<OrchestrationShellSnapshot>(
    'orchestration.getSidebarShellSnapshot',
    {}
  );
}

export async function fetchSynaraSidebarSearchSnapshot(): Promise<OrchestrationSidebarSearchSnapshot> {
  return featureManager.request<OrchestrationSidebarSearchSnapshot>(
    'orchestration.getSidebarSearchSnapshot',
    {}
  );
}

export async function fetchSynaraThreadDetailSnapshot(
  threadId: string
): Promise<OrchestrationThreadDetailSnapshot | null> {
  return featureManager.request<OrchestrationThreadDetailSnapshot | null>(
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
  return featureManager.request('orchestration.dispatchCommand', command);
}

export async function fetchProviderModels(input: {
  readonly provider: ProviderKind;
  readonly cwd?: string | null;
}): Promise<ProviderListModelsResult> {
  return featureManager.request('provider.listModels', {
    provider: input.provider,
    ...(input.cwd ? { cwd: input.cwd } : {}),
  });
}

export async function fetchServerSettings(): Promise<ServerSettingsView> {
  return featureManager.request<ServerSettingsView>('server.getSettings', {});
}

export async function updateServerSettings(
  patch: ServerSettingsPatch
): Promise<ServerSettingsView> {
  return featureManager.request<ServerSettingsView>('server.updateSettings', patch);
}

export async function fetchServerConfig(): Promise<ServerConfig> {
  return featureManager.request('server.getConfig', {});
}

export async function fetchSynaraPullRequests(input: {
  readonly state: PullRequestState;
  readonly projectId: ProjectId | null;
}): Promise<SynaraPullRequestListResult> {
  return featureManager.request<SynaraPullRequestListResult>('pullRequests.list', {
    involvement: 'all',
    state: input.state,
    projectId: input.projectId,
  });
}

export async function fetchSynaraPullRequestDetail(
  input: PullRequestDetailInput
): Promise<PullRequestDetail> {
  return featureManager.request<PullRequestDetail>('pullRequests.detail', input);
}

export async function fetchSynaraPullRequestDiff(
  input: PullRequestDetailInput
): Promise<PullRequestDiffResult> {
  return featureManager.request<PullRequestDiffResult>('pullRequests.diff', input);
}

export async function performSynaraPullRequestAction(
  input: PullRequestActionInput
): Promise<PullRequestActionResult> {
  return featureManager.request<PullRequestActionResult>('pullRequests.action', input);
}

export async function setSynaraPullRequestPinned(
  input: PullRequestSetPinnedInput
): Promise<PullRequestSetPinnedResult> {
  return featureManager.request<PullRequestSetPinnedResult>(
    'pullRequests.setPinned',
    input
  );
}

export async function disposeSynaraClient(): Promise<void> {
  featureManager.dispose();
}
