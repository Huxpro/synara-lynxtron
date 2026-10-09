import "background-only";

import type {
  AutomationListResult,
  AutomationDefinition,
  AutomationCreateInput,
  AutomationDeleteInput,
  AutomationRunNowInput,
  AutomationRunNowResult,
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
  GitStageFilesResult,
  GitUnstageFilesResult,
  ModelSelection,
  OrchestrationImportThreadInput,
  OrchestrationImportThreadResult,
  OrchestrationShellStreamItem,
  OrchestrationGetFullThreadDiffResult,
  OrchestrationGetTurnDiffResult,
  OrchestrationLatestTurn,
  OrchestrationMessage,
  OrchestrationProposedPlan,
  OrchestrationShellSnapshot,
  OrchestrationSidebarSearchSnapshot,
  OrchestrationThreadDetailSnapshot,
  OrchestrationSession,
  OrchestrationThreadActivity,
  ProjectDiscoverScriptsInput,
  ProjectDiscoverScriptsResult,
  ProjectListDevServersResult,
  ProjectRunDevServerInput,
  ProjectRunDevServerResult,
  ProjectStopDevServerInput,
  ProjectStopDevServerResult,
  ProjectCreateLocalFilePreviewGrantResult,
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
  PullRequestSetPinnedInput,
  PullRequestSetPinnedResult,
  ProviderKind,
  ProviderComposerCapabilities,
  ProviderListPluginsInput,
  ProviderListPluginsResult,
  ProviderListModelsResult,
  ProviderListSkillsResult,
  ServerConfig,
  ServerGenerateThreadRecapInput,
  ServerGenerateThreadRecapResult,
  ServerListProviderUsageInput,
  ServerListProviderUsageResult,
  ServerListLocalServersResult,
  ServerRefreshProvidersResult,
  ServerVoiceTranscriptionInput,
  ServerVoiceTranscriptionResult,
  ServerStopLocalServerInput,
  ServerStopLocalServerResult,
  ServerSettingsView,
  ServerProviderUpdateResult,
  KeybindingRule,
  ServerUpsertKeybindingResult,
  TerminalEvent,
  EditorId,
  RuntimeMode,
} from "@synara/contracts";
import { resolveDefaultSocketUrl } from "../platform/net.socket";
import { bridgeCall, onGlobalEvent } from "../platform/bridge";
import { ensureNativeApi } from "../adapters/nativeApi.lynx";
import { hostBridgeRequest } from "./nativeRpcBridge";
import { RpcTransportError, type RpcTransportState } from "./rpcTransport.logic";
import {
  NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG,
  type NativeSyntaxHighlightThemes,
} from "../main/syntaxHighlightingContract.logic";

export interface SynaraThread {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: RuntimeMode;
  readonly interactionMode: "default" | "plan";
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
  readonly kind: "project" | "chat" | "studio" | "group";
  readonly title: string;
  readonly workspaceRoot: string;
}

export interface SynaraSnapshot {
  readonly snapshotSequence: number;
  readonly projects: readonly SynaraProject[];
  readonly threads: readonly SynaraThread[];
}

/** The server's `pullRequests.list` reply, as the contract defines it. */

const OFFLINE_RETRY_DELAY_MS = 5_000;
const TRANSPORT_STATE_EVENT = "synara:transport-state";
const GIT_ACTION_PROGRESS_EVENT = "synara:git-action-progress";

let relayState: RpcTransportState = "idle";
let relayEverConnected = false;
let relayOfflineUntilMs = 0;
const relayStateListeners = new Set<(state: RpcTransportState) => void>();
const gitActionProgressListeners = new Map<string, (event: GitActionProgressEvent) => void>();
const terminalEventListeners = new Set<(event: TerminalEvent) => void>();
let terminalEventStream: Promise<void> | null = null;
let terminalEventRetry: ReturnType<typeof setTimeout> | null = null;

function setRelayState(state: RpcTransportState): void {
  if (relayState === state) return;
  relayState = state;
  for (const listener of relayStateListeners) listener(state);
}

onGlobalEvent(TRANSPORT_STATE_EVENT, (state: unknown) => {
  if (state !== "connected" && state !== "reconnecting" && state !== "offline") {
    return;
  }
  if (state === "connected") {
    relayEverConnected = true;
    relayOfflineUntilMs = 0;
  } else if (state === "offline") {
    relayOfflineUntilMs = Date.now() + OFFLINE_RETRY_DELAY_MS;
  }
  setRelayState(state);
});
onGlobalEvent(GIT_ACTION_PROGRESS_EVENT, (event: unknown) => {
  if (
    !event ||
    typeof event !== "object" ||
    !("actionId" in event) ||
    typeof event.actionId !== "string"
  ) {
    return;
  }
  gitActionProgressListeners.get(event.actionId)?.(event as GitActionProgressEvent);
});
function describeRelayError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function relayBridgeRequest<A>(
  method: "synaraRpc" | "synaraRpcStream",
  tag: string,
  payload: unknown,
): Promise<A> {
  return hostBridgeRequest(method, {
    tag,
    // The bridge drops null-valued keys when it marshals objects, and commands need
    // explicit nulls (thread.fork.create's worktreePath), so the payload crosses as JSON.
    payloadJson: JSON.stringify(payload ?? null),
    baseUrl: resolveDefaultSocketUrl(null),
  });
}

async function relayRequest<A>(tag: string, payload: unknown): Promise<A> {
  if (relayState === "offline" && Date.now() < relayOfflineUntilMs) {
    throw new RpcTransportError("Synara is offline; reconnect cooling down");
  }

  try {
    const result = await relayBridgeRequest<A>("synaraRpc", tag, payload);
    relayEverConnected = true;
    relayOfflineUntilMs = 0;
    setRelayState("connected");
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "SynaraRpcResponseError") {
      relayEverConnected = true;
      relayOfflineUntilMs = 0;
      setRelayState("connected");
      throw error;
    }
    relayOfflineUntilMs = Date.now() + OFFLINE_RETRY_DELAY_MS;
    setRelayState("offline");
    throw new RpcTransportError(`Synara RPC ${tag} failed: ${describeRelayError(error)}`);
  }
}

async function relayStreamRequest<A>(tag: string, payload: unknown): Promise<readonly A[]> {
  try {
    const result = await relayBridgeRequest<readonly A[]>("synaraRpcStream", tag, payload);
    relayEverConnected = true;
    relayOfflineUntilMs = 0;
    setRelayState("connected");
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "SynaraRpcResponseError") {
      relayEverConnected = true;
      relayOfflineUntilMs = 0;
      setRelayState("connected");
      throw error;
    }
    relayOfflineUntilMs = Date.now() + OFFLINE_RETRY_DELAY_MS;
    setRelayState("offline");
    throw new RpcTransportError(`Synara RPC ${tag} failed: ${describeRelayError(error)}`);
  }
}

function ensureTerminalEventStream(): void {
  if (terminalEventStream || terminalEventListeners.size === 0) return;
  terminalEventStream = relayStreamRequest<TerminalEvent>("terminal.subscribeEvents", {})
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      terminalEventStream = null;
      if (terminalEventListeners.size === 0) return;
      terminalEventRetry = setTimeout(() => {
        terminalEventRetry = null;
        ensureTerminalEventStream();
      }, 1_000);
    });
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
    input,
  );
}

export function getSynaraTransportState(): RpcTransportState {
  return relayState;
}

export function subscribeSynaraTransportState(
  listener: (state: RpcTransportState) => void,
): () => void {
  relayStateListeners.add(listener);
  listener(relayState);
  return () => relayStateListeners.delete(listener);
}

export function subscribeTerminalEvents(listener: (event: TerminalEvent) => void): () => void {
  terminalEventListeners.add(listener);
  ensureTerminalEventStream();
  return () => {
    terminalEventListeners.delete(listener);
    if (terminalEventListeners.size === 0 && terminalEventRetry) {
      clearTimeout(terminalEventRetry);
      terminalEventRetry = null;
    }
  };
}

/**
 * Shell stream items (snapshot, then thread/project changes) as the upstream
 * facade publishes them. This only listens: the stream itself is opened and
 * kept alive by upstream's session sync (`EventRouter`, mounted in App.tsx).
 * The server admits one shell stream per socket, so a second opener here would
 * be rejected as a duplicate subscription.
 */
export function subscribeOrchestrationShellEvents(
  listener: (event: OrchestrationShellStreamItem) => void,
): () => void {
  return ensureNativeApi().orchestration.onShellEvent(listener);
}

export async function fetchSynaraSnapshot(): Promise<SynaraSnapshot> {
  return transportRequest<SynaraSnapshot>("orchestration.getSnapshot", {});
}

export async function fetchSynaraShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  return transportRequest<OrchestrationShellSnapshot>("orchestration.getShellSnapshot", {});
}

export async function fetchSynaraSidebarShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  return transportRequest<OrchestrationShellSnapshot>("orchestration.getSidebarShellSnapshot", {});
}

export async function fetchSynaraSidebarSearchSnapshot(): Promise<OrchestrationSidebarSearchSnapshot> {
  return transportRequest<OrchestrationSidebarSearchSnapshot>(
    "orchestration.getSidebarSearchSnapshot",
    {},
  );
}

export async function fetchAutomations(): Promise<AutomationListResult> {
  return transportRequest<AutomationListResult>("automation.list", {});
}

export async function createAutomation(
  input: AutomationCreateInput,
): Promise<AutomationDefinition> {
  return transportRequest<AutomationDefinition>("automation.create", input);
}

export async function updateAutomation(
  input: AutomationUpdateInput,
): Promise<AutomationDefinition> {
  return transportRequest<AutomationDefinition>("automation.update", input);
}

export async function deleteAutomation(input: AutomationDeleteInput): Promise<void> {
  await transportRequest("automation.delete", input);
}

export async function runAutomationNow(
  input: AutomationRunNowInput,
): Promise<AutomationRunNowResult> {
  return transportRequest<AutomationRunNowResult>("automation.runNow", input);
}

export async function fetchSynaraThreadDetailSnapshot(
  threadId: string,
): Promise<OrchestrationThreadDetailSnapshot | null> {
  return transportRequest<OrchestrationThreadDetailSnapshot | null>(
    "orchestration.getThreadDetailSnapshot",
    { threadId },
  );
}

export async function dispatchSynaraCommand(
  command: ClientOrchestrationCommand,
): Promise<{ readonly sequence: number }> {
  // The Effect-RPC wire payload is the command itself. Web's wsNativeApi adds
  // a local `{ command }` transport wrapper and unwraps it before the RPC call;
  // this raw Lynx client talks to Effect-RPC directly and must not reproduce
  // that browser-only wrapper.
  return transportRequest("orchestration.dispatchCommand", command);
}

export async function fetchProviderModels(input: {
  readonly provider: ProviderKind;
  readonly cwd?: string | null;
}): Promise<ProviderListModelsResult> {
  return transportRequest("provider.listModels", {
    provider: input.provider,
    ...(input.cwd ? { cwd: input.cwd } : {}),
  });
}

export async function fetchProviderComposerCapabilities(
  provider: ProviderKind,
): Promise<ProviderComposerCapabilities> {
  return transportRequest("provider.getComposerCapabilities", { provider });
}

export async function fetchProviderSkills(input: {
  readonly provider: ProviderKind;
  readonly cwd: string;
  readonly threadId?: string;
}): Promise<ProviderListSkillsResult> {
  return transportRequest("provider.listSkills", input);
}

export async function fetchProviderPlugins(
  input: ProviderListPluginsInput,
): Promise<ProviderListPluginsResult> {
  return transportRequest<ProviderListPluginsResult>("provider.listPlugins", input);
}

export async function browseFilesystem(
  input: FilesystemBrowseInput,
): Promise<FilesystemBrowseResult> {
  return transportRequest<FilesystemBrowseResult>("filesystem.browse", input);
}

export async function listProjectDirectories(
  input: ProjectListDirectoriesInput,
): Promise<ProjectListDirectoriesResult> {
  return transportRequest<ProjectListDirectoriesResult>("projects.listDirectories", input);
}

export async function searchProjectEntries(
  input: ProjectSearchEntriesInput,
): Promise<ProjectSearchEntriesResult> {
  return transportRequest<ProjectSearchEntriesResult>("projects.searchEntries", input);
}

export async function readProjectFile(input: ProjectReadFileInput): Promise<ProjectReadFileResult> {
  return transportRequest<ProjectReadFileResult>("projects.readFile", input);
}

export async function createLocalFilePreviewGrant(
  path: string,
): Promise<ProjectCreateLocalFilePreviewGrantResult> {
  return transportRequest<ProjectCreateLocalFilePreviewGrantResult>(
    "projects.createLocalFilePreviewGrant",
    { path },
  );
}

export async function inspectProjectPdf(input: {
  readonly cwd: string;
  readonly path: string;
}): Promise<ProjectInspectPdfResult> {
  return transportRequest<ProjectInspectPdfResult>("projects.inspectPdf", input);
}

export async function readProjectFileWithSyntax(input: {
  readonly cwd: string;
  readonly previewGrant?: string;
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
  input: OrchestrationImportThreadInput,
): Promise<OrchestrationImportThreadResult> {
  return transportRequest<OrchestrationImportThreadResult>("orchestration.importThread", input);
}

// Served by the upstream `NativeApi` facade: the first requests of the shared
// state layer to run on Lynx (plan step 1).
export async function fetchServerSettings(): Promise<ServerSettingsView> {
  return ensureNativeApi().server.getSettings();
}

export async function fetchServerConfig(): Promise<ServerConfig> {
  return ensureNativeApi().server.getConfig();
}

export async function upsertKeybinding(
  rule: KeybindingRule,
): Promise<ServerUpsertKeybindingResult> {
  return transportRequest("server.upsertKeybinding", rule);
}

/**
 * Drops every binding of one command. Upstream's `reset` edit restores the
 * shipped bindings for a command, which for a project-script command (none
 * shipped) leaves it unassigned.
 */
export async function removeKeybinding(
  command: KeybindingRule["command"],
): Promise<ServerUpsertKeybindingResult> {
  return ensureNativeApi().server.editKeybindings({ edits: [{ type: "reset", command }] });
}

export async function refreshProviderStatuses(): Promise<ServerRefreshProvidersResult> {
  return transportRequest("server.refreshProviders", {});
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

export async function transcribeVoice(
  input: ServerVoiceTranscriptionInput,
): Promise<ServerVoiceTranscriptionResult> {
  return transportRequest("server.transcribeVoice", input);
}

export async function generateThreadRecap(
  input: ServerGenerateThreadRecapInput,
): Promise<ServerGenerateThreadRecapResult> {
  return transportRequest("server.generateThreadRecap", input);
}

export async function updateProvider(provider: ProviderKind): Promise<ServerProviderUpdateResult> {
  return transportRequest("server.updateProvider", { provider });
}

export async function openPathInEditor(input: {
  readonly cwd: string;
  readonly editor: EditorId;
}): Promise<void> {
  await transportRequest("shell.openInEditor", input);
}

export async function fetchGitHubRepository(cwd: string): Promise<GitHubRepositoryResult> {
  return transportRequest("git.githubRepository", { cwd });
}

export async function fetchGitPullRequestSnapshot(input: {
  readonly cwd: string;
  readonly reference: string;
}): Promise<GitPullRequestSnapshotResult> {
  return transportRequest("git.pullRequestSnapshot", input);
}

export async function fetchGitStatus(cwd: string): Promise<GitStatusResult> {
  return transportRequest("git.status", { cwd });
}

export async function initializeGit(cwd: string): Promise<void> {
  await transportRequest("git.init", { cwd });
}

export async function fetchGitStatusLocal(cwd: string): Promise<GitStatusLocalResult> {
  return transportRequest("git.statusLocal", { cwd });
}

export async function pullGitBranch(cwd: string): Promise<GitPullResult> {
  return transportRequest("git.pull", { cwd });
}

export async function fetchWorkingTreeDiff(
  cwd: string,
  scope: "branch" | "staged" | "unstaged" | "workingTree" = "workingTree",
): Promise<GitReadWorkingTreeDiffResult> {
  return transportRequest("git.readWorkingTreeDiff", {
    cwd,
    scope,
  });
}

export async function stageGitFiles(
  cwd: string,
  paths: readonly string[],
): Promise<GitStageFilesResult> {
  return transportRequest("git.stageFiles", { cwd, paths: [...paths] });
}

export async function unstageGitFiles(
  cwd: string,
  paths: readonly string[],
): Promise<GitUnstageFilesResult> {
  return transportRequest("git.unstageFiles", { cwd, paths: [...paths] });
}

export async function fetchTurnDiff(input: {
  readonly fromTurnCount: number;
  readonly ignoreWhitespace: boolean;
  readonly threadId: string;
  readonly toTurnCount: number;
}): Promise<OrchestrationGetTurnDiffResult> {
  return transportRequest("orchestration.getTurnDiff", input);
}

export async function fetchFullThreadDiff(input: {
  readonly ignoreWhitespace: boolean;
  readonly threadId: string;
  readonly toTurnCount: number;
}): Promise<OrchestrationGetFullThreadDiffResult> {
  return transportRequest("orchestration.getFullThreadDiff", input);
}

export async function fetchGitBranches(cwd: string): Promise<GitListBranchesResult> {
  return transportRequest("git.listBranches", { cwd });
}

export async function checkoutGitBranch(input: {
  readonly cwd: string;
  readonly branch: string;
}): Promise<void> {
  await transportRequest("git.checkout", input);
}

export async function runGitStackedAction(
  input: GitRunStackedActionInput,
  onProgress?: (event: GitActionProgressEvent) => void,
): Promise<GitRunStackedActionResult> {
  let result: GitRunStackedActionResult | null = null;
  const accept = (event: GitActionProgressEvent) => {
    if (event.kind === "action_finished") result = event.result;
  };
  if (onProgress) gitActionProgressListeners.set(input.actionId, onProgress);
  try {
    for (const event of await relayStreamRequest<GitActionProgressEvent>(
      "git.runStackedAction",
      input,
    )) {
      accept(event);
    }
  } finally {
    gitActionProgressListeners.delete(input.actionId);
  }
  if (!result) {
    throw new RpcTransportError("Git action stream completed without a final result");
  }
  return result;
}

export async function fetchAllProviderUsage(
  input: ServerListProviderUsageInput = {},
): Promise<ServerListProviderUsageResult> {
  return transportRequest<ServerListProviderUsageResult>("server.listProviderUsage", input);
}

export async function fetchLocalServers(): Promise<ServerListLocalServersResult> {
  return transportRequest<ServerListLocalServersResult>("server.listLocalServers", {});
}

export async function fetchProjectDevServers(): Promise<ProjectListDevServersResult> {
  return transportRequest<ProjectListDevServersResult>("projects.listDevServers", {});
}

export async function discoverProjectScripts(
  input: ProjectDiscoverScriptsInput,
): Promise<ProjectDiscoverScriptsResult> {
  return transportRequest<ProjectDiscoverScriptsResult>("projects.discoverScripts", input);
}

export async function runProjectDevServer(
  input: ProjectRunDevServerInput,
): Promise<ProjectRunDevServerResult> {
  return transportRequest<ProjectRunDevServerResult>("projects.runDevServer", input);
}

export async function stopProjectDevServer(
  input: ProjectStopDevServerInput,
): Promise<ProjectStopDevServerResult> {
  return transportRequest<ProjectStopDevServerResult>("projects.stopDevServer", input);
}

export async function stopLocalServer(
  input: ServerStopLocalServerInput,
): Promise<ServerStopLocalServerResult> {
  return transportRequest<ServerStopLocalServerResult>("server.stopLocalServer", input);
}

export async function fetchSynaraPullRequestDetail(
  input: PullRequestDetailInput,
): Promise<PullRequestDetail> {
  return transportRequest<PullRequestDetail>("pullRequests.detail", input);
}

export async function fetchSynaraPullRequestDiff(
  input: PullRequestDetailInput,
): Promise<PullRequestDiffResult> {
  return transportRequest<PullRequestDiffResult>("pullRequests.diff", input);
}

export async function performSynaraPullRequestAction(
  input: PullRequestActionInput,
): Promise<PullRequestActionResult> {
  return transportRequest<PullRequestActionResult>("pullRequests.action", input);
}

export async function postSynaraPullRequestComment(
  input: PullRequestCommentInput,
): Promise<PullRequestActionResult> {
  return transportRequest<PullRequestActionResult>("pullRequests.comment", input);
}

export async function setSynaraPullRequestPinned(
  input: PullRequestSetPinnedInput,
): Promise<PullRequestSetPinnedResult> {
  return transportRequest<PullRequestSetPinnedResult>("pullRequests.setPinned", input);
}

export async function disposeSynaraClient(): Promise<void> {
  relayStateListeners.clear();
  gitActionProgressListeners.clear();
  relayOfflineUntilMs = 0;
  setRelayState("idle");
}
