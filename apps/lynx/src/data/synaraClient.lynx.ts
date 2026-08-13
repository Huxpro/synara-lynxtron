import 'background-only';

import type {
  AutomationListResult,
  AutomationDefinition,
  AutomationCreateInput,
  AutomationDeleteInput,
  AutomationUpdateInput,
  ClientOrchestrationCommand,
  FilesystemBrowseInput,
  FilesystemBrowseResult,
  GitHubRepositoryResult,
  GitPullRequestSnapshotResult,
  GitPullResult,
  GitReadWorkingTreeDiffResult,
  GitListBranchesResult,
  GitActionProgressEvent,
  GitRunStackedActionInput,
  GitRunStackedActionResult,
  GitStatusLocalResult,
  GitStatusResult,
  ModelSelection,
  OrchestrationImportThreadInput,
  OrchestrationImportThreadResult,
  OrchestrationLatestTurn,
  OrchestrationMessage,
  OrchestrationReadModel,
  OrchestrationProposedPlan,
  OrchestrationShellSnapshot,
  OrchestrationSidebarSearchSnapshot,
  OrchestrationThreadDetailSnapshot,
  OrchestrationSession,
  OrchestrationThreadActivity,
  ProjectId,
  ProjectListDirectoriesInput,
  ProjectListDirectoriesResult,
  ProjectInspectPdfResult,
  ProjectReadFileInput,
  ProjectReadFileResult,
  ProjectSearchEntriesInput,
  ProjectSearchEntriesResult,
  PullRequestDetail,
  PullRequestDetailInput,
  PullRequestDiffResult,
  PullRequestActionInput,
  PullRequestActionResult,
  PullRequestCommentInput,
  PullRequestListEntry,
  PullRequestSetPinnedInput,
  PullRequestSetPinnedResult,
  PullRequestState,
  ProfileStats,
  ProfileTokenStats,
  ProviderKind,
  ProviderComposerCapabilities,
  ProviderListModelsResult,
  ProviderListSkillsResult,
  ProviderSkillsCatalogResult,
  ServerConfig,
  ServerGenerateThreadRecapInput,
  ServerGenerateThreadRecapResult,
  ServerListWorktreesResult,
  ServerListProviderUsageInput,
  ServerListProviderUsageResult,
  ServerListLocalServersResult,
  ServerRefreshProvidersResult,
  ServerStopLocalServerInput,
  ServerStopLocalServerResult,
  ServerSettingsPatch,
  ServerSettingsView,
  ServerProviderUpdateResult,
  EditorId,
  ExternalMcpCapability,
  ExternalMcpCreateIntegrationResult,
  ExternalMcpIntegration,
} from '@synara/contracts';
import { resolveDefaultSocketUrl } from '../platform/net.socket';
import { bridgeCall, onGlobalEvent } from '../platform/bridge';
import {
  RpcTransportError,
  type RpcTransportState,
} from './rpcTransport.logic';
import {
  NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG,
  type NativeSyntaxHighlightThemes,
} from '../main/syntaxHighlightingContract.logic';

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

const OFFLINE_RETRY_DELAY_MS = 5_000;
const TRANSPORT_STATE_EVENT = 'synara:transport-state';
const GIT_ACTION_PROGRESS_EVENT = 'synara:git-action-progress';

let relayState: RpcTransportState = 'idle';
let relayEverConnected = false;
let relayOfflineUntilMs = 0;
const relayStateListeners = new Set<(state: RpcTransportState) => void>();
const gitActionProgressListeners = new Map<
  string,
  (event: GitActionProgressEvent) => void
>();

function setRelayState(state: RpcTransportState): void {
  if (relayState === state) return;
  relayState = state;
  for (const listener of relayStateListeners) listener(state);
}

onGlobalEvent(TRANSPORT_STATE_EVENT, (state: unknown) => {
  if (
    state !== 'connected' &&
    state !== 'reconnecting' &&
    state !== 'offline'
  ) {
    return;
  }
  if (state === 'connected') {
    relayEverConnected = true;
    relayOfflineUntilMs = 0;
  } else if (state === 'offline') {
    relayOfflineUntilMs = Date.now() + OFFLINE_RETRY_DELAY_MS;
  }
  setRelayState(state);
});
onGlobalEvent(GIT_ACTION_PROGRESS_EVENT, (event: unknown) => {
  if (
    !event ||
    typeof event !== 'object' ||
    !('actionId' in event) ||
    typeof event.actionId !== 'string'
  ) {
    return;
  }
  gitActionProgressListeners.get(event.actionId)?.(
    event as GitActionProgressEvent
  );
});

function describeRelayError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface RelayBridgeError extends Error {
  readonly name: 'SynaraRpcResponseError' | 'RpcTransportError';
}

function relayBridgeRequest<A>(
  method: 'synaraRpc' | 'synaraRpcStream',
  tag: string,
  payload: unknown
): Promise<A> {
  return hostBridgeRequest(method, {
    tag,
    payload,
    baseUrl: resolveDefaultSocketUrl(null),
  });
}

function hostBridgeRequest<A>(
  method: string,
  params: Record<string, unknown>
): Promise<A> {
  return new Promise((resolve, reject) => {
    try {
      NativeModules.bridge.call(
        method,
        params,
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
            if (
              parsed &&
              typeof parsed === 'object' &&
              '_tag' in parsed &&
              parsed._tag === 'NativeRpcResult' &&
              'value' in parsed
            ) {
              resolve(parsed.value as A);
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

  try {
    const result = await relayBridgeRequest<A>('synaraRpc', tag, payload);
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

async function relayStreamRequest<A>(
  tag: string,
  payload: unknown
): Promise<readonly A[]> {
  try {
    const result = await relayBridgeRequest<readonly A[]>(
      'synaraRpcStream',
      tag,
      payload
    );
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
  return relayRequest<A>(tag, payload);
}

export function highlightExplorerCode(input: {
  readonly code: string;
  readonly path: string;
}): Promise<NativeSyntaxHighlightThemes | null> {
  return transportRequest<NativeSyntaxHighlightThemes | null>(
    NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG,
    input
  );
}

export function getSynaraTransportState(): RpcTransportState {
  return relayState;
}

export function subscribeSynaraTransportState(
  listener: (state: RpcTransportState) => void
): () => void {
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

export async function fetchAutomations(): Promise<AutomationListResult> {
  return transportRequest<AutomationListResult>('automation.list', {});
}

export async function createAutomation(
  input: AutomationCreateInput
): Promise<AutomationDefinition> {
  return transportRequest<AutomationDefinition>('automation.create', input);
}

export async function updateAutomation(
  input: AutomationUpdateInput
): Promise<AutomationDefinition> {
  return transportRequest<AutomationDefinition>('automation.update', input);
}

export async function deleteAutomation(
  input: AutomationDeleteInput
): Promise<void> {
  await transportRequest('automation.delete', input);
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

export async function fetchManagedWorktrees(): Promise<ServerListWorktreesResult> {
  return transportRequest<ServerListWorktreesResult>('server.listWorktrees', {});
}

export async function removeManagedWorktree(input: {
  readonly cwd: string;
  readonly path: string;
  readonly force?: boolean;
}): Promise<void> {
  await transportRequest('git.removeWorktree', input);
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

export async function fetchSkillsCatalog(): Promise<ProviderSkillsCatalogResult> {
  return transportRequest<ProviderSkillsCatalogResult>(
    'provider.listSkillsCatalog',
    {}
  );
}

export async function browseFilesystem(
  input: FilesystemBrowseInput
): Promise<FilesystemBrowseResult> {
  return transportRequest<FilesystemBrowseResult>('filesystem.browse', input);
}

export async function listProjectDirectories(
  input: ProjectListDirectoriesInput
): Promise<ProjectListDirectoriesResult> {
  return transportRequest<ProjectListDirectoriesResult>(
    'projects.listDirectories',
    input
  );
}

export async function searchProjectEntries(
  input: ProjectSearchEntriesInput
): Promise<ProjectSearchEntriesResult> {
  return transportRequest<ProjectSearchEntriesResult>(
    'projects.searchEntries',
    input
  );
}

export async function readProjectFile(
  input: ProjectReadFileInput
): Promise<ProjectReadFileResult> {
  return transportRequest<ProjectReadFileResult>('projects.readFile', input);
}

export async function inspectProjectPdf(input: {
  readonly cwd: string;
  readonly path: string;
}): Promise<ProjectInspectPdfResult> {
  return transportRequest<ProjectInspectPdfResult>('projects.inspectPdf', input);
}

export async function readProjectFileWithSyntax(input: {
  readonly cwd: string;
  readonly relativePath: string;
}): Promise<{
  readonly file: ProjectReadFileResult;
  readonly syntaxHighlight: NativeSyntaxHighlightThemes | null;
}> {
  const file = await readProjectFile(input);
  const syntaxHighlight = await highlightExplorerCode({
    code: file.contents,
    path: file.relativePath,
  }).catch(() => null);
  return { file, syntaxHighlight };
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

export async function refreshProviderStatuses(): Promise<ServerRefreshProvidersResult> {
  return transportRequest('server.refreshProviders', {});
}

export async function fetchFreshServerConfig(): Promise<ServerConfig> {
  const [config, providerStatuses] = await Promise.all([
    fetchServerConfig(),
    refreshProviderStatuses(),
  ]);
  return {
    ...config,
    providers: providerStatuses.providers,
  };
}

export async function generateThreadRecap(
  input: ServerGenerateThreadRecapInput
): Promise<ServerGenerateThreadRecapResult> {
  return transportRequest('server.generateThreadRecap', input);
}

export async function updateProvider(
  provider: ProviderKind
): Promise<ServerProviderUpdateResult> {
  return transportRequest('server.updateProvider', { provider });
}

export async function openPathInEditor(input: {
  readonly cwd: string;
  readonly editor: EditorId;
}): Promise<void> {
  await transportRequest('shell.openInEditor', input);
}

export async function fetchGitHubRepository(
  cwd: string
): Promise<GitHubRepositoryResult> {
  return transportRequest('git.githubRepository', { cwd });
}

export async function fetchGitPullRequestSnapshot(input: {
  readonly cwd: string;
  readonly reference: string;
}): Promise<GitPullRequestSnapshotResult> {
  return transportRequest('git.pullRequestSnapshot', input);
}

export async function fetchGitStatus(cwd: string): Promise<GitStatusResult> {
  return transportRequest('git.status', { cwd });
}

export async function fetchGitStatusLocal(
  cwd: string
): Promise<GitStatusLocalResult> {
  return transportRequest('git.statusLocal', { cwd });
}

export async function pullGitBranch(cwd: string): Promise<GitPullResult> {
  return transportRequest('git.pull', { cwd });
}

export async function fetchWorkingTreeDiff(
  cwd: string
): Promise<GitReadWorkingTreeDiffResult> {
  return transportRequest('git.readWorkingTreeDiff', {
    cwd,
    scope: 'workingTree',
  });
}

export async function fetchGitBranches(cwd: string): Promise<GitListBranchesResult> {
  return transportRequest('git.listBranches', { cwd });
}

export async function checkoutGitBranch(input: {
  readonly cwd: string;
  readonly branch: string;
}): Promise<void> {
  await transportRequest('git.checkout', input);
}

export async function runGitStackedAction(
  input: GitRunStackedActionInput,
  onProgress?: (event: GitActionProgressEvent) => void
): Promise<GitRunStackedActionResult> {
  let result: GitRunStackedActionResult | null = null;
  const accept = (event: GitActionProgressEvent) => {
    if (event.kind === 'action_finished') result = event.result;
  };
  if (onProgress) gitActionProgressListeners.set(input.actionId, onProgress);
  try {
    for (const event of await relayStreamRequest<GitActionProgressEvent>(
      'git.runStackedAction',
      input
    )) {
      accept(event);
    }
  } finally {
    gitActionProgressListeners.delete(input.actionId);
  }
  if (!result) {
    throw new RpcTransportError(
      'Git action stream completed without a final result'
    );
  }
  return result;
}

export async function repairSynaraState(): Promise<OrchestrationReadModel> {
  return transportRequest<OrchestrationReadModel>('orchestration.repairState', {});
}

export async function fetchExternalMcpIntegrations(): Promise<
  readonly ExternalMcpIntegration[]
> {
  return transportRequest<readonly ExternalMcpIntegration[]>(
    'server.listExternalMcpIntegrations',
    {}
  );
}

export async function createExternalMcpIntegration(input: {
  readonly name: string;
  readonly projectScope: 'all' | 'selected';
  readonly projectIds?: readonly string[];
  readonly capabilities: readonly ExternalMcpCapability[];
  readonly expiresInDays: number;
}): Promise<ExternalMcpCreateIntegrationResult> {
  return transportRequest<ExternalMcpCreateIntegrationResult>(
    'server.createExternalMcpIntegration',
    input
  );
}

export async function revokeExternalMcpIntegration(
  integrationId: string
): Promise<{ readonly revoked: boolean }> {
  return transportRequest('server.revokeExternalMcpIntegration', {
    integrationId,
  });
}

export async function refreshExternalMcpPairing(
  integrationId: string
): Promise<ExternalMcpCreateIntegrationResult> {
  return transportRequest<ExternalMcpCreateIntegrationResult>(
    'server.refreshExternalMcpPairing',
    { integrationId }
  );
}

export async function fetchProfileStats(
  utcOffsetMinutes: number
): Promise<ProfileStats> {
  return transportRequest<ProfileStats>('stats.getProfileStats', {
    utcOffsetMinutes,
  });
}

export async function fetchProfileTokenStats(
  utcOffsetMinutes: number
): Promise<ProfileTokenStats> {
  return transportRequest<ProfileTokenStats>('stats.getProfileTokenStats', {
    utcOffsetMinutes,
  });
}

export async function fetchAllProviderUsage(
  input: ServerListProviderUsageInput = {}
): Promise<ServerListProviderUsageResult> {
  return transportRequest<ServerListProviderUsageResult>(
    'server.listProviderUsage',
    input
  );
}

export async function fetchLocalServers(): Promise<ServerListLocalServersResult> {
  return transportRequest<ServerListLocalServersResult>(
    'server.listLocalServers',
    {}
  );
}

export async function stopLocalServer(
  input: ServerStopLocalServerInput
): Promise<ServerStopLocalServerResult> {
  return transportRequest<ServerStopLocalServerResult>(
    'server.stopLocalServer',
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

export async function postSynaraPullRequestComment(
  input: PullRequestCommentInput
): Promise<PullRequestActionResult> {
  return transportRequest<PullRequestActionResult>('pullRequests.comment', input);
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
  relayStateListeners.clear();
  gitActionProgressListeners.clear();
  relayOfflineUntilMs = 0;
  setRelayState('idle');
}
