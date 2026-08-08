import { useEffect, useMemo, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import {
  THREAD_NOTES_MAX_CHARS,
  type EditorId,
  type GitPullRequestCheck,
  type GitStackedAction,
  type GitStatusResult,
  type OrchestrationThreadPullRequest,
  type PinnedMessage,
  type ProviderKind,
  type ThreadMarker,
} from '@synara/contracts';
import {
  mergeProjectInstructionsIntoThreadNotes,
  useProjectInstructionsStore,
} from '@synara-web/projectInstructionsStore';
import { displayLabelFor, normalizePinLabel } from '@synara-web/pinnedMessages';
import {
  deriveThreadMarkerLabel,
  normalizeThreadMarkerLabel,
} from '@synara-web/threadMarkers';
import { isThreadMarkerAvailable } from '@synara/shared/threadMarkers';
import {
  PULL_REQUEST_CHECK_STATUS_LABELS,
  summarizePullRequestChecks,
  summarizePullRequestComments,
} from '@synara-web/components/pullRequest/pullRequestSummary.logic';
import {
  providerUsageDisplayName,
  providerUsageNeedsAuthDetail,
} from '@synara/shared/providerUsage';
import { deriveProviderUsageLimitDisplay } from '@synara/shared/providerUsageDisplay';
import {
  localServerAddressLabel,
  localServerPrimaryLabel,
} from '@synara/shared/localServers';
import settingsSvg from '@synara-central-icons/settings-gear-4.svg?raw';
import windowSvg from '@synara-central-icons/window.svg?raw';
import globeSvg from '@synara-central-icons/globe.svg?raw';
import githubSvg from '@synara-central-icons/github.svg?raw';
import arrowUpRightSvg from '@synara-central-icons/arrow-up-right.svg?raw';
import bubbleAlertSvg from '@synara-central-icons/bubble-alert.svg?raw';
import circleCheckSvg from '@synara-central-icons/circle-check.svg?raw';
import checkmarkSvg from '@synara-central-icons/checkmark-2-small.svg?raw';
import differenceSvg from '@synara-central-icons/difference-modified.svg?raw';
import editSvg from '@synara-central-icons/edit-small-2.svg?raw';
import closeSvg from '@synara-central-icons/close-circle-dashed.svg?raw';
import mergeConflictSvg from '@synara-central-icons/merge-conflict.svg?raw';
import pullRequestSvg from '@synara-central-icons/pull-request.svg?raw';
import stopSvg from '@synara-central-icons/stop.svg?raw';
import pushSvg from '@synara-central-icons/cloud-simple-upload.svg?raw';

import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ChatMarkdown } from '../components/markdown/ChatMarkdown.lynx';
import {
  ChevronDownIcon,
  CheckIcon,
  CopyIcon,
  DeviceLaptopIcon,
  GitBranchIcon,
  RefreshCwIcon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  buildMenuItems,
  resolveDefaultBranchActionDialogCopy,
  requiresDefaultBranchConfirmation,
  summarizeGitResult,
} from '@synara-web/components/GitActionsControl.logic';
import {
  dispatchSynaraCommand,
  fetchAllProviderUsage,
  fetchLocalServers,
  fetchServerConfig,
  fetchGitHubRepository,
  fetchGitPullRequestSnapshot,
  fetchGitStatus,
  fetchGitBranches,
  openPathInEditor,
  checkoutGitBranch,
  runGitStackedAction,
  stopLocalServer,
} from '../data/synaraClient.lynx';
import { webStorage } from '../platform/storage';
import { sleepOnHost } from '../platform/timer';
import { platformWindow } from '../platform/window';
import { dialogs } from '../platform/dialogs';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '../components/ui/dialog.lynx';
import { Button } from '../components/ui/button.lynx';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import {
  environmentEditorOptions,
  LAST_EDITOR_STORAGE_KEY,
  resolveEnvironmentEditor,
} from './environmentEditor.logic';
import { resolveThreadRecapIdleMs } from '@synara-web/lib/threadRecap';
import {
  fetchThreadRecapSummary,
  generatePreparedThreadRecap,
  prepareThreadRecap,
  type ThreadRecapSummary,
} from './queries';

import './environment-panel.css';

const NOTES_SAVE_DELAY_MS = 500;
function environmentCommandId(): string {
  return `lynx-environment-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

export function EnvironmentToggle(props: {
  readonly open: boolean;
  readonly onChange: (open: boolean) => void;
}) {
  const { svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `EnvironmentToggle${
      props.open ? ' EnvironmentToggle--open' : ''
    }`,
    accessibleLabel: 'Toggle environment panel',
    accessibilityValue: props.open ? 'On' : 'Off',
    onActivate: () => props.onChange(!props.open),
  });
  return (
    <view
      className={interaction.className}
      aria-pressed={props.open}
      {...interaction.eventProps}
    >
      <svg
        className="EnvironmentToggleIcon"
        content={colorizeLynxSvg(windowSvg, svgColors.foreground)}
      />
    </view>
  );
}

function EnvironmentRow(props: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly trailingIcon?: React.ReactNode;
  readonly trailingContent?: React.ReactNode;
  readonly trailing?: string | null;
}) {
  return (
    <view className="EnvironmentRow">
      <view className="EnvironmentRowIcon">{props.icon}</view>
      <text className="EnvironmentRowLabel">{props.label}</text>
      {props.trailing ? (
        <text className="EnvironmentRowTrailing">{props.trailing}</text>
      ) : null}
      {props.trailingContent ? (
        <view className="EnvironmentRowTrailingContent">
          {props.trailingContent}
        </view>
      ) : null}
      {props.trailingIcon ? (
        <view className="EnvironmentRowTrailingIcon">{props.trailingIcon}</view>
      ) : null}
    </view>
  );
}

function EnvironmentSectionLabel({ children }: { readonly children: string }) {
  return <text className="EnvironmentSectionLabel">{children}</text>;
}

function EnvironmentLocalServers() {
  const { svgColors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stoppingPid, setStoppingPid] = useState<number | null>(null);
  const localServersQuery = useQuery({
    queryKey: ['environment-local-servers'],
    queryFn: () => {
      'background only';
      return fetchLocalServers();
    },
    refetchInterval: menuOpen ? 5_000 : false,
  });
  const servers = localServersQuery.data?.servers ?? [];
  const countLabel = `${servers.length}`;

  async function stop(server: (typeof servers)[number]) {
    'background only';
    if (!server.isStoppable || stoppingPid !== null) return;
    setStoppingPid(server.pid);
    try {
      await stopLocalServer({
        pid: server.pid,
        port: server.ports[0] ?? 1,
      });
      await localServersQuery.refetch();
    } finally {
      setStoppingPid(null);
    }
  }

  return (
    <Menu open={menuOpen} onOpenChange={setMenuOpen}>
      <MenuTrigger
        ariaLabel="Local Servers"
        className="EnvironmentLocalServersTrigger"
      >
        <EnvironmentRow
          icon={
            <svg
              className="EnvironmentCanonicalIcon"
              content={colorizeLynxSvg(globeSvg, svgColors.foreground)}
            />
          }
          label="Local Servers"
          trailing={localServersQuery.isFetching ? 'Scanning…' : countLabel}
        />
      </MenuTrigger>
      <MenuPopup
        align="start"
        side="bottom"
        className="EnvironmentLocalServersPopup"
      >
        <view className="EnvironmentLocalServersHeader">
          <text className="EnvironmentLocalServersHeaderText">
            {localServersQuery.isPending
              ? 'Scanning ports…'
              : servers.length === 0
                ? 'No servers running'
                : `${servers.length} server${
                    servers.length === 1 ? '' : 's'
                  } running`}
          </text>
          <MenuItem
            className="EnvironmentLocalServersRefresh"
            closeOnClick={false}
            disabled={localServersQuery.isFetching}
            onClick={() => void localServersQuery.refetch()}
          >
            <RefreshCwIcon
              size={12}
              color="var(--muted-foreground)"
            />
          </MenuItem>
        </view>
        {localServersQuery.isPending ? (
          <text className="EnvironmentLocalServersEmpty">
            Scanning local ports
          </text>
        ) : localServersQuery.isError ? (
          <text className="EnvironmentLocalServersEmpty">
            Couldn't scan local ports
          </text>
        ) : servers.length === 0 ? (
          <text className="EnvironmentLocalServersEmpty">
            Local dev servers will appear here.
          </text>
        ) : (
          <view className="EnvironmentLocalServersList">
            {servers.map((server) => (
              <view className="EnvironmentLocalServerRow" key={server.id}>
                <view className="EnvironmentLocalServerStatus">
                  <view className="EnvironmentLocalServerStatusDot" />
                </view>
                <view className="EnvironmentLocalServerCopy">
                  <text className="EnvironmentLocalServerTitle">
                    {localServerPrimaryLabel(server)}
                  </text>
                  <text className="EnvironmentLocalServerAddress">
                    {localServerAddressLabel(server)}
                  </text>
                </view>
                <MenuItem
                  className="EnvironmentLocalServerStop"
                  closeOnClick={false}
                  disabled={!server.isStoppable || stoppingPid !== null}
                  onClick={() => void stop(server)}
                >
                  {stoppingPid === server.pid ? (
                    <RefreshCwIcon
                      size={14}
                      color="var(--muted-foreground)"
                    />
                  ) : (
                    <svg
                      className="EnvironmentLocalServerStopIcon"
                      content={colorizeLynxSvg(
                        stopSvg,
                        server.isStoppable
                          ? 'var(--destructive)'
                          : svgColors.mutedForeground
                      )}
                    />
                  )}
                </MenuItem>
              </view>
            ))}
          </view>
        )}
      </MenuPopup>
    </Menu>
  );
}

function EnvironmentChanges(props: {
  readonly onOpenViewer: () => void;
  readonly open: boolean;
  readonly onStatusChange: (status: GitStatusResult | null) => void;
  readonly workspaceRoot: string;
}) {
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [statusState, setStatusState] = useState<{
    readonly data: Awaited<ReturnType<typeof fetchGitStatus>> | null;
    readonly error: boolean;
    readonly pending: boolean;
  }>({ data: null, error: false, pending: true });

  useEffect(() => {
    'background only';
    if (!props.open) return;
    let cancelled = false;
    async function pollGitStatus() {
      'background only';
      let first = true;
      while (!cancelled) {
        if (first) {
          setStatusState((current) => ({
            ...current,
            error: false,
            pending: true,
          }));
        }
        try {
          const data = await fetchGitStatus(props.workspaceRoot);
          if (!cancelled) {
            setStatusState({ data, error: false, pending: false });
            props.onStatusChange(data);
          }
        } catch {
          if (!cancelled) {
            setStatusState((current) => ({
              data: current.data,
              error: true,
              pending: false,
            }));
          }
        }
        first = false;
        if (!cancelled) await sleepOnHost(15_000);
      }
    }
    void pollGitStatus();
    return () => {
      cancelled = true;
    };
  }, [props.open, props.workspaceRoot, refreshGeneration]);

  const status = statusState.data;
  const files = status?.workingTree.files ?? [];
  const stats = status?.workingTree;
  return (
    <view
      className={`EnvironmentChangesTrigger${
        statusState.pending ? ' EnvironmentChangesTrigger--disabled' : ''
      }`}
      accessibility-element
      accessibility-label={
        statusState.error
          ? 'Retry changes'
          : status?.hasWorkingTreeChanges
            ? `${files.length} changed file${files.length === 1 ? '' : 's'}`
            : 'No changes'
      }
      bindtap={
        statusState.pending
          ? undefined
          : statusState.error
            ? () => setRefreshGeneration((current) => current + 1)
            : props.onOpenViewer
      }
    >
      <EnvironmentRow
        icon={
          statusState.error ? (
            <RefreshCwIcon
              size={16}
              color="var(--destructive)"
            />
          ) : (
            <svg
              className="EnvironmentCanonicalIcon"
              content={colorizeLynxSvg(
                differenceSvg,
                'var(--foreground)'
              )}
            />
          )
        }
        label={
          statusState.pending
            ? 'Loading changes…'
            : statusState.error
              ? "Couldn't load changes"
              : 'Changes'
        }
        trailingContent={
          stats && status?.hasWorkingTreeChanges ? (
            <>
              <text className="EnvironmentChangesAddition">
                +{stats.insertions}
              </text>
              <text className="EnvironmentChangesDeletion">
                −{stats.deletions}
              </text>
            </>
          ) : null
        }
      />
    </view>
  );
}

function EnvironmentGitAction(props: {
  readonly branch: string | null;
  readonly gitStatus: GitStatusResult | null;
  readonly open: boolean;
  readonly onCompleted: () => void;
  readonly workspaceRoot: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<GitStackedAction | null>(
    null
  );
  const [commitMessage, setCommitMessage] = useState('');
  const [editingFiles, setEditingFiles] = useState(false);
  const [excludedFiles, setExcludedFiles] = useState<ReadonlySet<string>>(
    new Set()
  );
  const [running, setRunning] = useState(false);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const branchesQuery = useQuery({
    queryKey: ['environment-git-action-branches', props.workspaceRoot],
    queryFn: () => {
      'background only';
      return fetchGitBranches(props.workspaceRoot);
    },
    enabled: props.open,
    staleTime: 15_000,
  });
  const branchList = branchesQuery.data;
  const defaultBranch =
    branchList?.branches.find(
      (branch) => !branch.isRemote && branch.isDefault
    )?.name ?? null;
  const activeBranch = props.gitStatus?.branch ?? props.branch;
  const isDefaultBranch =
    activeBranch !== null &&
    (activeBranch === defaultBranch ||
      (defaultBranch === null &&
        (activeBranch === 'main' || activeBranch === 'master')));
  const menuItems = useMemo(
    () =>
      buildMenuItems(
        props.gitStatus,
        running,
        branchList?.hasOriginRemote ?? false,
        isDefaultBranch,
        defaultBranch
      ),
    [
      branchList?.hasOriginRemote,
      defaultBranch,
      isDefaultBranch,
      props.gitStatus,
      running,
    ]
  );
  const hasRunnableCommitPushAction = menuItems.some(
    (item) =>
      (item.id === 'commit_push' || item.id === 'push') && !item.disabled
  );
  const files = props.gitStatus?.workingTree.files ?? [];
  const selectedFiles = files.filter((file) => !excludedFiles.has(file.path));
  const allSelected = excludedFiles.size === 0;
  const noneSelected = selectedFiles.length === 0;

  function resetDialogState(): void {
    setDialogAction(null);
    setCommitMessage('');
    setEditingFiles(false);
    setExcludedFiles(new Set());
    setError(null);
  }

  function toggleFile(path: string): void {
    setExcludedFiles((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function runAction(action: GitStackedAction): Promise<void> {
    'background only';
    if (!props.gitStatus || running) return;
    if (
      requiresDefaultBranchConfirmation(action, isDefaultBranch) &&
      activeBranch
    ) {
      const copy = resolveDefaultBranchActionDialogCopy({
        action,
        branchName: activeBranch,
        includesCommit:
          action === 'commit_push' || action === 'commit_push_pr',
      });
      const confirmed = await dialogs.confirm(
        `${copy.title}\n\n${copy.description}`
      );
      if (!confirmed) return;
    }
    setRunning(true);
    setError(null);
    setResultLabel(null);
    try {
      const result = await runGitStackedAction({
        actionId: environmentCommandId(),
        cwd: props.workspaceRoot,
        action,
        ...(commitMessage.trim()
          ? { commitMessage: commitMessage.trim() }
          : {}),
        ...(!allSelected
          ? { filePaths: selectedFiles.map((file) => file.path) }
          : {}),
      });
      const summary = summarizeGitResult(result);
      setResultLabel(
        summary.description
          ? `${summary.title}: ${summary.description}`
          : summary.title
      );
      setDialogOpen(false);
      resetDialogState();
      props.onCompleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Git action failed.');
    } finally {
      setRunning(false);
    }
  }

  function selectMenuItem(item: (typeof menuItems)[number]): void {
    'background only';
    if (item.disabled) return;
    if (item.kind === 'open_pr') {
      if (props.gitStatus?.pr?.url) {
        void platformWindow.openExternal(props.gitStatus.pr.url);
      }
      return;
    }
    const action = item.dialogAction;
    if (!action) return;
    if (action === 'commit' || action === 'commit_push') {
      setDialogAction(action);
      setDialogOpen(true);
      return;
    }
    void runAction(action);
  }

  return (
    <>
      <Menu open={menuOpen} onOpenChange={setMenuOpen}>
        <MenuTrigger
          ariaLabel="Commit and Push"
          className={`EnvironmentGitActionTrigger${
            running || !hasRunnableCommitPushAction
              ? ' EnvironmentGitActionTrigger--disabled'
              : ''
          }`}
        >
          <EnvironmentRow
            icon={
              <svg
                className="EnvironmentCanonicalIcon"
                content={colorizeLynxSvg(pushSvg, 'var(--foreground)')}
              />
            }
            label={running ? 'Working…' : 'Commit and Push'}
            trailingIcon={
              <ChevronDownIcon
                size={12}
                color="var(--muted-foreground)"
              />
            }
          />
        </MenuTrigger>
        <MenuPopup
          align="start"
          side="bottom"
          className="EnvironmentGitActionPopup"
        >
          <text className="EnvironmentGitActionMenuLabel">Git actions</text>
          {menuItems.length === 0 ? (
            <text className="EnvironmentGitActionMenuState">
              Git status is unavailable.
            </text>
          ) : (
            menuItems.map((item) => (
              <MenuItem
                className="EnvironmentGitActionMenuItem"
                disabled={item.disabled}
                key={item.id}
                onClick={() => selectMenuItem(item)}
                trailing={
                  item.disabled ? (
                    <text className="EnvironmentGitActionMenuUnavailable">
                      Unavailable
                    </text>
                  ) : undefined
                }
              >
                {item.label}
              </MenuItem>
            ))
          )}
        </MenuPopup>
      </Menu>
      {resultLabel ? (
        <text className="EnvironmentGitActionStatus EnvironmentGitActionStatus--success">
          {resultLabel}
        </text>
      ) : error ? (
        <text className="EnvironmentGitActionStatus EnvironmentGitActionStatus--error">
          {error}
        </text>
      ) : null}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDialogState();
        }}
      >
        <DialogPopup className="EnvironmentGitActionDialog">
          <DialogTitle>Commit changes</DialogTitle>
          <DialogDescription>
            Review the changed files and optionally provide a commit message.
          </DialogDescription>
          <DialogPanel className="EnvironmentGitActionDialogPanel">
            <view className="EnvironmentGitActionSummary">
              <text className="EnvironmentGitActionSummaryLabel">Branch</text>
              <text className="EnvironmentGitActionSummaryValue">
                {activeBranch ?? 'Detached HEAD'}
              </text>
              <text className="EnvironmentGitActionSummaryLabel">Files</text>
              <text className="EnvironmentGitActionSummaryValue">
                {allSelected
                  ? `${files.length}`
                  : `${selectedFiles.length} of ${files.length}`}
              </text>
              <Button
                variant="ghost"
                size="xs"
                disabled={running || files.length === 0}
                onClick={() => setEditingFiles((current) => !current)}
              >
                {editingFiles ? 'Done' : 'Edit'}
              </Button>
            </view>
            {editingFiles && files.length > 0 ? (
              <view
                className="EnvironmentGitActionSelectAll"
                accessibility-element
                accessibility-label={
                  allSelected ? 'Exclude all files' : 'Include all files'
                }
                accessibility-traits="button"
                aria-checked={allSelected}
                bindtap={() =>
                  setExcludedFiles(
                    allSelected
                      ? new Set(files.map((file) => file.path))
                      : new Set()
                  )
                }
              >
                <view
                  className={`EnvironmentGitActionCheckbox${
                    allSelected
                      ? ' EnvironmentGitActionCheckbox--checked'
                      : noneSelected
                        ? ''
                        : ' EnvironmentGitActionCheckbox--mixed'
                  }`}
                >
                  {allSelected ? (
                    <svg
                      className="EnvironmentGitActionCheckboxIcon"
                      content={colorizeLynxSvg(
                        checkmarkSvg,
                        'var(--primary-foreground)'
                      )}
                    />
                  ) : noneSelected ? null : (
                    <view className="EnvironmentGitActionCheckboxMixedBar" />
                  )}
                </view>
                <text className="EnvironmentGitActionSelectAllLabel">
                  {allSelected ? 'Exclude all' : 'Include all'}
                </text>
              </view>
            ) : null}
            <scroll-view
              className="EnvironmentGitActionFiles"
              scroll-y
              enable-scroll-bar
            >
              {files.map((file) => (
                <view
                  className={`EnvironmentGitActionFile${
                    excludedFiles.has(file.path)
                      ? ' EnvironmentGitActionFile--excluded'
                      : ''
                  }`}
                  key={file.path}
                  accessibility-element={editingFiles}
                  accessibility-label={
                    editingFiles
                      ? `${
                          excludedFiles.has(file.path) ? 'Include' : 'Exclude'
                        } ${file.path}`
                      : undefined
                  }
                  accessibility-traits={editingFiles ? 'button' : undefined}
                  aria-checked={!excludedFiles.has(file.path)}
                  bindtap={
                    editingFiles ? () => toggleFile(file.path) : undefined
                  }
                >
                  {editingFiles ? (
                    <view
                      className={`EnvironmentGitActionCheckbox${
                        excludedFiles.has(file.path)
                          ? ''
                          : ' EnvironmentGitActionCheckbox--checked'
                      }`}
                    >
                      {!excludedFiles.has(file.path) ? (
                        <svg
                          className="EnvironmentGitActionCheckboxIcon"
                          content={colorizeLynxSvg(
                            checkmarkSvg,
                            'var(--primary-foreground)'
                          )}
                        />
                      ) : null}
                    </view>
                  ) : null}
                  <text className="EnvironmentGitActionFilePath">
                    {file.path}
                  </text>
                  <text className="EnvironmentGitActionFileStats">
                    {excludedFiles.has(file.path)
                      ? 'Excluded'
                      : `+${file.insertions} −${file.deletions}`}
                  </text>
                </view>
              ))}
            </scroll-view>
            <textarea
              className="EnvironmentGitActionMessage"
              value={commitMessage}
              placeholder="Commit message (optional)"
              maxlength={10_000}
              bindinput={(event) =>
                setCommitMessage(event.detail.value.slice(0, 10_000))
              }
            />
            {error ? (
              <text className="EnvironmentGitActionDialogError">{error}</text>
            ) : null}
          </DialogPanel>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={() => {
                setDialogOpen(false);
                resetDialogState();
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={running || noneSelected || !dialogAction}
              onClick={() => {
                if (dialogAction) void runAction(dialogAction);
              }}
            >
              {running
                ? 'Working…'
                : dialogAction === 'commit_push'
                  ? 'Commit & push'
                  : 'Commit'}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}

function EnvironmentBranch(props: {
  readonly branch: string | null;
  readonly envMode: 'local' | 'worktree';
  readonly open: boolean;
  readonly threadId: string;
  readonly workspaceRoot: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchingBranch, setSwitchingBranch] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const branchesQuery = useQuery({
    queryKey: ['environment-git-branches', props.workspaceRoot],
    queryFn: () => {
      'background only';
      return fetchGitBranches(props.workspaceRoot);
    },
    enabled: props.open,
    staleTime: 15_000,
  });
  const branches = (branchesQuery.data?.branches ?? []).filter(
    (branch) => !branch.isRemote
  );
  const checkoutDisabled =
    props.envMode === 'worktree' || switchingBranch !== null;

  async function switchBranch(branch: string) {
    'background only';
    if (checkoutDisabled || branch === props.branch) return;
    setSwitchingBranch(branch);
    setError(false);
    try {
      await checkoutGitBranch({ cwd: props.workspaceRoot, branch });
      await dispatchSynaraCommand({
        type: 'thread.meta.update',
        commandId: environmentCommandId() as never,
        threadId: props.threadId as never,
        branch,
      });
      await branchesQuery.refetch();
      setMenuOpen(false);
    } catch {
      setError(true);
    } finally {
      setSwitchingBranch(null);
    }
  }

  return (
    <Menu open={menuOpen} onOpenChange={setMenuOpen}>
      <MenuTrigger
        ariaLabel="Choose branch"
        className="EnvironmentBranchTrigger"
        disabled={branchesQuery.isPending}
      >
        <EnvironmentRow
          icon={
            <GitBranchIcon
              size={16}
              color="var(--foreground)"
            />
          }
          label={props.branch ?? 'No branch'}
          trailing={props.envMode === 'worktree' ? 'Worktree' : 'Local'}
          trailingIcon={
            <ChevronDownIcon
              size={12}
              color="var(--muted-foreground)"
            />
          }
        />
      </MenuTrigger>
      <MenuPopup
        align="start"
        side="bottom"
        className="EnvironmentBranchPopup"
      >
        {props.envMode === 'worktree' ? (
          <text className="EnvironmentBranchState">
            Switch branches from the worktree environment controls.
          </text>
        ) : branches.length === 0 ? (
          <text className="EnvironmentBranchState">
            No local branches found.
          </text>
        ) : (
          <view className="EnvironmentBranchList">
            {branches.map((branch) => (
              <MenuItem
                className="EnvironmentBranchOption"
                closeOnClick={false}
                disabled={switchingBranch !== null}
                key={branch.name}
                onClick={() => void switchBranch(branch.name)}
                trailing={
                  branch.name === props.branch ? (
                    <CheckIcon className="EnvironmentBranchCheck" />
                  ) : undefined
                }
              >
                {branch.name}
              </MenuItem>
            ))}
          </view>
        )}
        {error ? (
          <text className="EnvironmentBranchError">
            Could not switch branch
          </text>
        ) : null}
      </MenuPopup>
    </Menu>
  );
}

function EnvironmentEditor(props: {
  readonly open: boolean;
  readonly workspaceRoot: string;
}) {
  const configQuery = useQuery({
    queryKey: ['server-config'],
    queryFn: () => {
      'background only';
      return fetchServerConfig();
    },
    enabled: props.open,
  });
  const options = environmentEditorOptions(
    configQuery.data?.availableEditors ?? []
  );
  const [preferredEditor, setPreferredEditor] = useState<EditorId | null>(() =>
    resolveEnvironmentEditor(
      options,
      webStorage.getItem(LAST_EDITOR_STORAGE_KEY)
    )
  );
  const [openingEditor, setOpeningEditor] = useState<EditorId | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const resolvedEditor = resolveEnvironmentEditor(
    options,
    preferredEditor ?? webStorage.getItem(LAST_EDITOR_STORAGE_KEY)
  );
  const activeOption =
    options.find((option) => option.value === resolvedEditor) ?? null;

  async function openEditor(editor: EditorId) {
    'background only';
    if (openingEditor !== null) return;
    setOpeningEditor(editor);
    setOpenError(null);
    try {
      await openPathInEditor({
        cwd: props.workspaceRoot,
        editor,
      });
      setPreferredEditor(editor);
      webStorage.setItem(LAST_EDITOR_STORAGE_KEY, editor);
    } catch (error) {
      setOpenError(
        error instanceof Error ? error.message : `Could not open ${editor}.`
      );
    } finally {
      setOpeningEditor(null);
    }
  }

  if (configQuery.isPending || options.length === 0 || !activeOption) {
    return null;
  }

  return (
    <view className="EnvironmentLabeledSection">
      <view className="EnvironmentDivider" />
      <EnvironmentSectionLabel>Editor</EnvironmentSectionLabel>
      <Menu>
        <MenuTrigger
          ariaLabel={`Open in ${activeOption.label}`}
          className="EnvironmentEditorTrigger"
          disabled={openingEditor !== null}
        >
          <EnvironmentRow
            icon={
              <DeviceLaptopIcon
                size={16}
                color="var(--foreground)"
              />
            }
            label={`Open in ${activeOption.label}`}
            trailingIcon={
              <ChevronDownIcon
                size={12}
                color="var(--muted-foreground)"
              />
            }
          />
        </MenuTrigger>
        <MenuPopup
          align="start"
          side="bottom"
          className="EnvironmentEditorPopup"
        >
          <MenuRadioGroup
            value={resolvedEditor ?? undefined}
            onValueChange={(value) => void openEditor(value as EditorId)}
          >
            {options.map((option) => (
              <MenuRadioItem
                className="EnvironmentEditorOption"
                disabled={openingEditor !== null}
                key={option.value}
                value={option.value}
              >
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuPopup>
      </Menu>
      {openError ? (
        <text className="EnvironmentEditorError">{openError}</text>
      ) : null}
    </view>
  );
}

function EnvironmentRepository(props: {
  readonly open: boolean;
  readonly workspaceRoot: string;
}) {
  const [openError, setOpenError] = useState(false);
  const repositoryQuery = useQuery({
    queryKey: ['environment-github-repository', props.workspaceRoot],
    queryFn: () => {
      'background only';
      return fetchGitHubRepository(props.workspaceRoot);
    },
    enabled: props.open,
    staleTime: 5 * 60_000,
  });
  const repository = repositoryQuery.data?.repository ?? null;
  const interaction = useLynxInteractiveState({
    baseClassName: 'EnvironmentRepositoryRow',
    accessibleLabel: repository
      ? `Open ${repository.nameWithOwner} on GitHub`
      : 'GitHub repository unavailable',
    disabled: repository === null,
    onActivate: repository
      ? () => {
          'background only';
          setOpenError(false);
          void platformWindow.openExternal(repository.url).then(
            (opened) => setOpenError(!opened),
            () => setOpenError(true)
          );
        }
      : undefined,
  });

  if (!repository) return null;

  return (
    <view className="EnvironmentLabeledSection">
      <view className="EnvironmentDivider" />
      <EnvironmentSectionLabel>Repository</EnvironmentSectionLabel>
      <view className={interaction.className} {...interaction.eventProps}>
        <EnvironmentRow
          icon={
            <svg
              className="EnvironmentCanonicalIcon"
              content={colorizeLynxSvg(githubSvg, 'var(--foreground)')}
            />
          }
          label={repository.nameWithOwner}
          trailingIcon={
            <svg
              className="EnvironmentRepositoryExternalIcon"
              content={colorizeLynxSvg(
                arrowUpRightSvg,
                'var(--muted-foreground)'
              )}
            />
          }
        />
      </view>
      {openError ? (
        <text className="EnvironmentRepositoryError">
          Could not open repository
        </text>
      ) : null}
    </view>
  );
}

function pullRequestCheckColor(check: GitPullRequestCheck): string {
  if (check.status === 'failure' || check.status === 'cancelled') {
    return 'var(--destructive)';
  }
  if (check.status === 'success') return 'var(--settings-usage-meter-healthy)';
  return 'var(--muted-foreground)';
}

function EnvironmentPullRequest(props: {
  readonly open: boolean;
  readonly pullRequest: OrchestrationThreadPullRequest;
  readonly workspaceRoot: string;
}) {
  const { svgColors } = useTheme();
  const [checksOpen, setChecksOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [snapshotState, setSnapshotState] = useState<{
    readonly data: Awaited<ReturnType<typeof fetchGitPullRequestSnapshot>> | null;
    readonly error: boolean;
    readonly pending: boolean;
  }>({
    data: null,
    error: false,
    pending: true,
  });
  const [refreshGeneration, setRefreshGeneration] = useState(0);

  useEffect(() => {
    'background only';
    if (!props.open) return;
    let cancelled = false;
    const generation = refreshGeneration;
    async function pollPullRequest() {
      'background only';
      let first = true;
      while (!cancelled) {
        if (first) {
          setSnapshotState((current) => ({
            ...current,
            error: false,
            pending: true,
          }));
        }
        try {
          const data = await fetchGitPullRequestSnapshot({
            cwd: props.workspaceRoot,
            reference: props.pullRequest.url,
          });
          if (!cancelled) {
            setSnapshotState({ data, error: false, pending: false });
          }
        } catch {
          if (!cancelled) {
            setSnapshotState((current) => ({
              data: current.data,
              error: true,
              pending: false,
            }));
          }
        }
        first = false;
        if (!cancelled) await sleepOnHost(60_000);
      }
    }
    void pollPullRequest();
    return () => {
      cancelled = true;
    };
  }, [
    props.open,
    props.pullRequest.url,
    props.workspaceRoot,
    refreshGeneration,
  ]);

  const livePullRequest = snapshotState.data?.pullRequest ?? props.pullRequest;
  const checks = snapshotState.data?.checks ?? [];
  const comments = snapshotState.data?.comments ?? [];
  const checksSummary = summarizePullRequestChecks(checks);
  const commentsSummary = summarizePullRequestComments(
    comments.length,
    snapshotState.data?.commentsTruncated ?? false
  );
  const diffLabel = [
    `+${livePullRequest.additions ?? 0}`,
    `−${livePullRequest.deletions ?? 0}`,
    livePullRequest.changedFiles == null
      ? null
      : `${livePullRequest.changedFiles} file${
          livePullRequest.changedFiles === 1 ? '' : 's'
        }`,
  ]
    .filter(Boolean)
    .join(' ');
  const openUrl = (url: string) => {
    'background only';
    void platformWindow.openExternal(url);
  };

  return (
    <view className="EnvironmentLabeledSection">
      <view className="EnvironmentDivider" />
      <EnvironmentSectionLabel>Pull request</EnvironmentSectionLabel>
      <view
        className="EnvironmentRepositoryRow"
        bindtap={() => openUrl(livePullRequest.url)}
        accessibility-element
        accessibility-label={`Open pull request #${livePullRequest.number}`}
      >
        <EnvironmentRow
          icon={
            <svg
              className="EnvironmentCanonicalIcon"
              content={colorizeLynxSvg(pullRequestSvg, svgColors.foreground)}
            />
          }
          label={`#${livePullRequest.number} ${livePullRequest.title}`}
          trailing={
            livePullRequest.isDraft ? 'Draft' : null
          }
          trailingIcon={
            <svg
              className="EnvironmentRepositoryExternalIcon"
              content={colorizeLynxSvg(
                arrowUpRightSvg,
                svgColors.mutedForeground
              )}
            />
          }
        />
      </view>
      <view
        className="EnvironmentRepositoryRow"
        bindtap={() => openUrl(`${livePullRequest.url}/files`)}
        accessibility-element
        accessibility-label={`Open changes for pull request #${livePullRequest.number}`}
      >
        <EnvironmentRow
          icon={
            <svg
              className="EnvironmentCanonicalIcon"
              content={colorizeLynxSvg(differenceSvg, svgColors.foreground)}
            />
          }
          label={diffLabel}
          trailingIcon={
            <svg
              className="EnvironmentRepositoryExternalIcon"
              content={colorizeLynxSvg(
                arrowUpRightSvg,
                svgColors.mutedForeground
              )}
            />
          }
        />
      </view>
      {livePullRequest.mergeability === 'conflicting' ? (
        <view
          className="EnvironmentRepositoryRow"
          bindtap={() => openUrl(livePullRequest.url)}
          accessibility-element
          accessibility-label={`Conflicts with ${livePullRequest.baseBranch}`}
        >
          <EnvironmentRow
            icon={
              <svg
                className="EnvironmentCanonicalIcon"
                content={colorizeLynxSvg(
                  mergeConflictSvg,
                  'var(--destructive)'
                )}
              />
            }
            label={`Conflicts with ${livePullRequest.baseBranch}`}
            trailingIcon={
              <svg
                className="EnvironmentRepositoryExternalIcon"
                content={colorizeLynxSvg(
                  arrowUpRightSvg,
                  svgColors.mutedForeground
                )}
              />
            }
          />
        </view>
      ) : null}
      <Menu open={checksOpen} onOpenChange={setChecksOpen}>
        <MenuTrigger
          ariaLabel={snapshotState.pending ? 'Loading checks' : checksSummary.label}
          className="EnvironmentPullRequestMenuTrigger"
          disabled={snapshotState.pending}
          onActivate={
            snapshotState.error
              ? () => setRefreshGeneration((current) => current + 1)
              : undefined
          }
        >
          <EnvironmentRow
            icon={
              snapshotState.error ? (
                <RefreshCwIcon
                  size={16}
                  color="var(--destructive)"
                />
              ) : (
                <svg
                  className="EnvironmentCanonicalIcon"
                  content={colorizeLynxSvg(
                    checksSummary.tone === 'failure'
                      ? bubbleAlertSvg
                      : circleCheckSvg,
                    checksSummary.tone === 'failure'
                      ? 'var(--destructive)'
                      : svgColors.mutedForeground
                  )}
                />
              )
            }
            label={
              snapshotState.pending
                ? 'Loading checks…'
                : snapshotState.error
                  ? "Couldn't load PR data"
                  : checksSummary.label
            }
            trailingIcon={
              <ChevronDownIcon
                size={12}
                color="var(--muted-foreground)"
              />
            }
          />
        </MenuTrigger>
        <MenuPopup
          align="start"
          side="bottom"
          className="EnvironmentPullRequestPopup"
        >
          {checks.length === 0 ? (
            <text className="EnvironmentPullRequestEmpty">
              No checks reported for this PR.
            </text>
          ) : (
            <view className="EnvironmentPullRequestList">
              {checks.map((check, index) => (
                <MenuItem
                  className="EnvironmentPullRequestCheck"
                  disabled={!check.url}
                  key={`${check.name}-${index}`}
                  onClick={check.url ? () => openUrl(check.url!) : undefined}
                >
                  <view
                    className="EnvironmentPullRequestCheckDot"
                    style={{ backgroundColor: pullRequestCheckColor(check) }}
                  />
                  <text className="EnvironmentPullRequestCheckName">
                    {check.name}
                  </text>
                  <text className="EnvironmentPullRequestCheckStatus">
                    {PULL_REQUEST_CHECK_STATUS_LABELS[check.status]}
                  </text>
                </MenuItem>
              ))}
            </view>
          )}
        </MenuPopup>
      </Menu>
      <Menu open={commentsOpen} onOpenChange={setCommentsOpen}>
        <MenuTrigger
          ariaLabel={commentsSummary}
          className="EnvironmentPullRequestMenuTrigger"
          disabled={snapshotState.pending}
        >
          <EnvironmentRow
            icon={
              <svg
                className="EnvironmentCanonicalIcon"
                content={colorizeLynxSvg(
                  bubbleAlertSvg,
                  svgColors.mutedForeground
                )}
              />
            }
            label={
              snapshotState.data?.commentsError
                ? 'Comments unavailable'
                : commentsSummary
            }
            trailingIcon={
              <ChevronDownIcon
                size={12}
                color="var(--muted-foreground)"
              />
            }
          />
        </MenuTrigger>
        <MenuPopup
          align="start"
          side="bottom"
          className="EnvironmentPullRequestPopup"
        >
          <text className="EnvironmentPullRequestEmpty">
            {snapshotState.data?.commentsError
              ? `Couldn't load review comments: ${snapshotState.data.commentsError}`
              : comments.length === 0
                ? 'No unresolved review comments.'
                : `${comments.length} unresolved review comment${
                    comments.length === 1 ? '' : 's'
                  }`}
          </text>
        </MenuPopup>
      </Menu>
    </view>
  );
}

function EnvironmentRecap(props: {
  readonly open: boolean;
  readonly revision: string;
  readonly threadId: string;
  readonly workspaceRoot: string;
}) {
  const [generatedRecap, setGeneratedRecap] =
    useState<ThreadRecapSummary | null>(null);
  const [generationState, setGenerationState] = useState<
    'idle' | 'pending' | 'error'
  >('idle');
  const generationRef = useRef(0);
  const cachedRecapQuery = useQuery({
    queryKey: ['environment-thread-recap', props.threadId],
    queryFn: () => {
      'background only';
      return fetchThreadRecapSummary(props.threadId);
    },
    enabled: props.open,
  });
  const recap = generatedRecap ?? cachedRecapQuery.data ?? null;
  const recapIdleMs = resolveThreadRecapIdleMs({
    hasExistingRecap: Boolean(recap?.text),
  });

  useEffect(() => {
    'background only';
    if (!props.open) {
      generationRef.current += 1;
      setGenerationState('idle');
      return;
    }
    const generation = ++generationRef.current;
    void prepareThreadRecap(props.threadId).then(async (plan) => {
      if (!plan || generationRef.current !== generation) return;
      await sleepOnHost(recapIdleMs);
      if (generationRef.current !== generation) return;
      setGenerationState('pending');
      try {
        const next = await generatePreparedThreadRecap({
          cwd: props.workspaceRoot,
          plan,
          threadId: props.threadId,
        });
        if (generationRef.current !== generation) return;
        if (next) setGeneratedRecap(next);
        setGenerationState('idle');
      } catch {
        if (generationRef.current === generation) {
          setGenerationState('error');
        }
      }
    });
    return () => {
      if (generationRef.current === generation) generationRef.current += 1;
    };
  }, [
    props.open,
    props.revision,
    props.threadId,
    props.workspaceRoot,
    recapIdleMs,
  ]);

  if (!recap && generationState !== 'pending') return null;

  return (
    <view className="EnvironmentRecapSection">
      <view className="EnvironmentDivider" />
      <EnvironmentSectionLabel>Recap</EnvironmentSectionLabel>
      {recap ? (
        <view className="EnvironmentRecapContent">
          <ChatMarkdown
            className="EnvironmentRecapMarkdown"
            text={recap.text}
          />
          {generationState === 'error' ? (
            <text className="EnvironmentRecapStatus">
              Could not refresh recap
            </text>
          ) : null}
        </view>
      ) : (
        <view className="EnvironmentRecapSkeleton" aria-hidden="true">
          <view className="EnvironmentRecapSkeletonLine" />
          <view className="EnvironmentRecapSkeletonLine EnvironmentRecapSkeletonLine--short" />
        </view>
      )}
    </view>
  );
}

function EnvironmentProjectInstructions(props: {
  readonly notes: string;
  readonly projectId: string;
  readonly threadId: string;
}) {
  const textareaRef = useRef<React.ElementRef<'textarea'>>(null);
  const storedInstructions = useProjectInstructionsStore(
    (state) => state.instructionsByProjectId[props.projectId] ?? ''
  );
  const setInstructions = useProjectInstructionsStore(
    (state) => state.setInstructions
  );
  const [value, setValue] = useState(storedInstructions);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'saving' | 'error'>(
    'idle'
  );
  const valueRef = useRef(value);
  const committedRef = useRef(storedInstructions);
  const copiedNotesRef = useRef<string | null>(null);
  const saveGenerationRef = useRef(0);
  const focusedRef = useRef(false);

  useEffect(() => {
    'background only';
    let active = true;
    void useProjectInstructionsStore.persist.rehydrate().then(() => {
      if (!active) return;
      const next =
        useProjectInstructionsStore.getState().instructionsByProjectId[
          props.projectId
        ] ?? '';
      valueRef.current = next;
      committedRef.current = next;
      setValue(next);
      setOpen(next.trim().length > 0);
      setHydrated(true);
      textareaRef.current
        ?.invoke({ method: 'setValue', params: { value: next } })
        .exec();
    });
    return () => {
      active = false;
    };
  }, [props.projectId]);

  useEffect(() => {
    if (
      hydrated &&
      !focusedRef.current &&
      valueRef.current === committedRef.current &&
      storedInstructions !== valueRef.current
    ) {
      valueRef.current = storedInstructions;
      committedRef.current = storedInstructions;
      setValue(storedInstructions);
      textareaRef.current
        ?.invoke({
          method: 'setValue',
          params: { value: storedInstructions },
        })
        .exec();
    }
  }, [hydrated, storedInstructions]);

  useEffect(() => {
    if (copiedNotesRef.current === props.notes) {
      copiedNotesRef.current = null;
    }
  }, [props.notes]);

  function flushInstructions() {
    'background only';
    saveGenerationRef.current += 1;
    const next = valueRef.current;
    if (next === committedRef.current) return;
    setInstructions(props.projectId as never, next);
    committedRef.current = next;
  }

  function scheduleInstructionsSave() {
    'background only';
    const generation = ++saveGenerationRef.current;
    void sleepOnHost(500).then(() => {
      if (saveGenerationRef.current === generation) flushInstructions();
    });
  }

  async function copyToNotepad() {
    'background only';
    if (copyState === 'saving') return;
    flushInstructions();
    const currentNotes = copiedNotesRef.current ?? props.notes;
    const nextNotes = mergeProjectInstructionsIntoThreadNotes({
      threadNotes: currentNotes,
      projectInstructions: valueRef.current,
    });
    if (nextNotes === currentNotes) return;
    setCopyState('saving');
    try {
      await dispatchSynaraCommand({
        type: 'thread.meta.update',
        commandId: environmentCommandId() as never,
        threadId: props.threadId as never,
        notes: nextNotes,
      });
      copiedNotesRef.current = nextNotes;
      setCopyState('idle');
    } catch {
      setCopyState('error');
    }
  }

  const disclosure = useLynxInteractiveState({
    baseClassName: 'EnvironmentDisclosure',
    accessibleLabel: 'Project instructions',
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => setOpen((current) => !current),
  });
  const copyInteraction = useLynxInteractiveState({
    baseClassName: 'EnvironmentInstructionsCopy',
    accessibleLabel:
      props.notes.trim().length === 0
        ? 'Copy project instructions to notepad'
        : 'Append project instructions to notepad',
    disabled: value.trim().length === 0 || copyState === 'saving',
    onActivate: () => void copyToNotepad(),
  });

  return (
    <view className="EnvironmentSection">
      <view
        className={disclosure.className}
        aria-expanded={open}
        {...disclosure.eventProps}
      >
        <text className="EnvironmentDisclosureLabel">
          Project instructions
        </text>
        <ChevronDownIcon
          className={`EnvironmentDisclosureChevron${
            open ? ' EnvironmentDisclosureChevron--open' : ''
          }`}
          size={12}
          color="var(--muted-foreground)"
        />
      </view>
      {open ? (
        <view className="EnvironmentInstructions">
          <textarea
            ref={textareaRef}
            className="EnvironmentInstructionsInput"
            aria-label="Project instructions"
            accessibility-element
            accessibility-label="Project instructions"
            focusable
            default-value={value}
            placeholder="Architecture notes, conventions, repo links"
            maxlength={THREAD_NOTES_MAX_CHARS}
            maxlines={8}
            enable-scroll-bar
            bindfocus={() => {
              focusedRef.current = true;
            }}
            bindinput={(event) => {
              'background only';
              valueRef.current = event.detail.value;
              setValue(event.detail.value);
              scheduleInstructionsSave();
            }}
            bindblur={() => {
              'background only';
              focusedRef.current = false;
              flushInstructions();
            }}
          />
          {value.trim().length > 0 ? (
            <view
              className={copyInteraction.className}
              {...copyInteraction.eventProps}
            >
              <CopyIcon
                size={14}
                color="var(--foreground)"
              />
              <text className="EnvironmentInstructionsCopyLabel">
                {props.notes.trim().length === 0
                  ? 'Copy to notepad'
                  : 'Append to notepad'}
              </text>
            </view>
          ) : null}
          {copyState === 'error' ? (
            <text className="EnvironmentInstructionsStatus">
              Could not update notepad
            </text>
          ) : null}
        </view>
      ) : null}
    </view>
  );
}

function EnvironmentPinnedRow(props: {
  readonly busy: boolean;
  readonly error: boolean;
  readonly messageText: string | undefined;
  readonly onDoneChange: (done: boolean) => void;
  readonly onJump: () => void;
  readonly onRemove: () => void;
  readonly onRename: (label: string | null) => void;
  readonly pin: PinnedMessage;
}) {
  const { svgColors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const editInputRef = useRef<React.ElementRef<'input'>>(null);
  const available = props.messageText !== undefined;
  const resolvedLabel = displayLabelFor(props.pin, props.messageText);
  const label =
    resolvedLabel.length > 0 ? resolvedLabel : '(message unavailable)';
  const done = props.pin.done === true;

  useEffect(() => {
    if (!editing) return;
    editInputRef.current
      ?.invoke({ method: 'focus', params: {} })
      .exec();
  }, [editing]);

  function beginRename() {
    setDraftLabel(resolvedLabel);
    setEditing(true);
  }

  function commitRename() {
    const nextLabel = normalizePinLabel(draftLabel);
    setEditing(false);
    if ((props.pin.label ?? null) !== nextLabel) props.onRename(nextLabel);
  }

  const checkbox = useLynxInteractiveState({
    baseClassName: `EnvironmentPinnedCheckbox${
      done ? ' EnvironmentPinnedCheckbox--checked' : ''
    }`,
    accessibleLabel: done ? 'Mark not done' : 'Mark done',
    disabled: props.busy,
    onActivate: () => props.onDoneChange(!done),
  });
  const labelInteraction = useLynxInteractiveState({
    baseClassName: `EnvironmentPinnedLabel${
      done ? ' EnvironmentPinnedLabel--done' : ''
    }${available ? '' : ' EnvironmentPinnedLabel--unavailable'}`,
    accessibleLabel: available
      ? `Jump to pinned message: ${label}`
      : `Pinned message unavailable: ${label}`,
    disabled: !available || props.busy,
    onActivate: available ? props.onJump : undefined,
  });
  const rename = useLynxInteractiveState({
    baseClassName: 'EnvironmentPinnedAction',
    accessibleLabel: `Rename pinned message: ${label}`,
    disabled: props.busy,
    onActivate: beginRename,
  });
  const remove = useLynxInteractiveState({
    baseClassName: 'EnvironmentPinnedAction',
    accessibleLabel: `Unpin message: ${label}`,
    disabled: props.busy,
    onActivate: props.onRemove,
  });

  return (
    <view className="EnvironmentPinnedRow">
      <view
        className={checkbox.className}
        aria-checked={done}
        {...checkbox.eventProps}
      >
        {done ? (
          <svg
            className="EnvironmentPinnedCheckIcon"
            content={colorizeLynxSvg(checkmarkSvg, svgColors.foreground)}
          />
        ) : null}
      </view>
      {editing ? (
        <input
          ref={editInputRef}
          className="EnvironmentPinnedEdit"
          aria-label="Pinned message label"
          accessibility-element
          accessibility-label="Pinned message label"
          focusable
          default-value={draftLabel}
          maxlength={80}
          bindinput={(event) => setDraftLabel(event.detail.value)}
          bindblur={commitRename}
          bindconfirm={commitRename}
        />
      ) : (
        <view
          className={labelInteraction.className}
          {...labelInteraction.eventProps}
        >
          <text className="EnvironmentPinnedLabelText">{label}</text>
        </view>
      )}
      <view className={rename.className} {...rename.eventProps}>
        <svg
          className="EnvironmentPinnedActionIcon"
          content={colorizeLynxSvg(editSvg, svgColors.mutedForeground)}
        />
      </view>
      <view className={remove.className} {...remove.eventProps}>
        <svg
          className="EnvironmentPinnedActionIcon"
          content={colorizeLynxSvg(closeSvg, svgColors.mutedForeground)}
        />
      </view>
      {props.error ? (
        <text className="EnvironmentPinnedError">Could not save</text>
      ) : null}
    </view>
  );
}

function EnvironmentPinned(props: {
  readonly messageTextById: Readonly<Record<string, string>>;
  readonly onJump: (messageId: string) => void;
  readonly pins: readonly PinnedMessage[];
  readonly threadId: string;
}) {
  const [open, setOpen] = useState(true);
  const [pins, setPins] = useState<readonly PinnedMessage[]>(props.pins);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const [errorMessageId, setErrorMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (busyMessageId === null) setPins(props.pins);
  }, [busyMessageId, props.pins]);

  async function dispatchPinCommand(
    messageId: string,
    nextPins: readonly PinnedMessage[],
    command:
      | {
          readonly type: 'thread.pinned-message.remove';
          readonly messageId: never;
        }
      | {
          readonly type: 'thread.pinned-message.done.set';
          readonly messageId: never;
          readonly done: boolean;
        }
      | {
          readonly type: 'thread.pinned-message.label.set';
          readonly messageId: never;
          readonly label: string | null;
        }
  ) {
    'background only';
    if (busyMessageId !== null) return;
    const previous = pins;
    setPins(nextPins);
    setBusyMessageId(messageId);
    setErrorMessageId(null);
    try {
      await dispatchSynaraCommand({
        ...command,
        commandId: environmentCommandId() as never,
        threadId: props.threadId as never,
      });
    } catch {
      setPins(previous);
      setErrorMessageId(messageId);
    } finally {
      setBusyMessageId(null);
    }
  }

  const disclosure = useLynxInteractiveState({
    baseClassName: 'EnvironmentDisclosure',
    accessibleLabel: 'Pinned',
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => setOpen((current) => !current),
  });

  if (pins.length === 0) return null;

  return (
    <view className="EnvironmentSection">
      <view
        className={disclosure.className}
        aria-expanded={open}
        {...disclosure.eventProps}
      >
        <text className="EnvironmentDisclosureLabel">Pinned</text>
        <ChevronDownIcon
          className={`EnvironmentDisclosureChevron${
            open ? ' EnvironmentDisclosureChevron--open' : ''
          }`}
          size={12}
          color="var(--muted-foreground)"
        />
      </view>
      {open ? (
        <view className="EnvironmentPinnedList">
          {pins.map((pin) => (
            <EnvironmentPinnedRow
              busy={busyMessageId !== null}
              error={errorMessageId === pin.messageId}
              key={pin.messageId}
              messageText={props.messageTextById[pin.messageId]}
              pin={pin}
              onJump={() => props.onJump(pin.messageId)}
              onDoneChange={(done) =>
                void dispatchPinCommand(
                  pin.messageId,
                  pins.map((candidate) =>
                    candidate.messageId === pin.messageId
                      ? { ...candidate, done }
                      : candidate
                  ),
                  {
                    type: 'thread.pinned-message.done.set',
                    messageId: pin.messageId as never,
                    done,
                  }
                )
              }
              onRename={(label) =>
                void dispatchPinCommand(
                  pin.messageId,
                  pins.map((candidate) =>
                    candidate.messageId === pin.messageId
                      ? { ...candidate, label }
                      : candidate
                  ),
                  {
                    type: 'thread.pinned-message.label.set',
                    messageId: pin.messageId as never,
                    label,
                  }
                )
              }
              onRemove={() =>
                void dispatchPinCommand(
                  pin.messageId,
                  pins.filter(
                    (candidate) => candidate.messageId !== pin.messageId
                  ),
                  {
                    type: 'thread.pinned-message.remove',
                    messageId: pin.messageId as never,
                  }
                )
              }
            />
          ))}
        </view>
      ) : null}
    </view>
  );
}

function EnvironmentMarkerRow(props: {
  readonly busy: boolean;
  readonly error: boolean;
  readonly marker: ThreadMarker;
  readonly messageText: string | undefined;
  readonly onDoneChange: (done: boolean) => void;
  readonly onJump: () => void;
  readonly onRemove: () => void;
  readonly onRename: (label: string | null) => void;
}) {
  const { svgColors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const editInputRef = useRef<React.ElementRef<'input'>>(null);
  const available =
    props.messageText !== undefined &&
    isThreadMarkerAvailable(props.marker, props.messageText);
  const resolvedLabel =
    props.marker.label?.trim() || deriveThreadMarkerLabel(props.marker);
  const label = available ? resolvedLabel : `${resolvedLabel} (unavailable)`;
  const done = props.marker.done === true;

  useEffect(() => {
    if (!editing) return;
    editInputRef.current
      ?.invoke({ method: 'focus', params: {} })
      .exec();
  }, [editing]);

  function beginRename() {
    setDraftLabel(props.marker.label ?? resolvedLabel);
    setEditing(true);
  }

  function commitRename() {
    const nextLabel = normalizeThreadMarkerLabel(draftLabel);
    setEditing(false);
    if ((props.marker.label ?? null) !== nextLabel) props.onRename(nextLabel);
  }

  const checkbox = useLynxInteractiveState({
    baseClassName: `EnvironmentPinnedCheckbox${
      done ? ' EnvironmentPinnedCheckbox--checked' : ''
    }`,
    accessibleLabel: done ? 'Mark marker not done' : 'Mark marker done',
    disabled: props.busy,
    onActivate: () => props.onDoneChange(!done),
  });
  const labelInteraction = useLynxInteractiveState({
    baseClassName: `EnvironmentPinnedLabel${
      done ? ' EnvironmentPinnedLabel--done' : ''
    }${available ? '' : ' EnvironmentPinnedLabel--unavailable'}`,
    accessibleLabel: available
      ? `Jump to marker: ${label}`
      : `Marker unavailable: ${label}`,
    disabled: !available || props.busy,
    onActivate: available ? props.onJump : undefined,
  });
  const rename = useLynxInteractiveState({
    baseClassName: 'EnvironmentPinnedAction',
    accessibleLabel: `Rename marker: ${label}`,
    disabled: props.busy,
    onActivate: beginRename,
  });
  const remove = useLynxInteractiveState({
    baseClassName: 'EnvironmentPinnedAction',
    accessibleLabel: `Remove marker: ${label}`,
    disabled: props.busy,
    onActivate: props.onRemove,
  });

  return (
    <view className="EnvironmentPinnedRow">
      <view
        className={checkbox.className}
        aria-checked={done}
        {...checkbox.eventProps}
      >
        {done ? (
          <svg
            className="EnvironmentPinnedCheckIcon"
            content={colorizeLynxSvg(checkmarkSvg, svgColors.foreground)}
          />
        ) : null}
      </view>
      <view
        className={`EnvironmentMarkerSwatch EnvironmentMarkerSwatch--${props.marker.color}`}
      />
      {editing ? (
        <input
          ref={editInputRef}
          className="EnvironmentPinnedEdit"
          aria-label="Marker label"
          accessibility-element
          accessibility-label="Marker label"
          focusable
          default-value={draftLabel}
          maxlength={60}
          bindinput={(event) => setDraftLabel(event.detail.value)}
          bindblur={commitRename}
          bindconfirm={commitRename}
        />
      ) : (
        <view
          className={labelInteraction.className}
          {...labelInteraction.eventProps}
        >
          <text className="EnvironmentPinnedLabelText">{label}</text>
        </view>
      )}
      <view className={rename.className} {...rename.eventProps}>
        <svg
          className="EnvironmentPinnedActionIcon"
          content={colorizeLynxSvg(editSvg, svgColors.mutedForeground)}
        />
      </view>
      <view className={remove.className} {...remove.eventProps}>
        <svg
          className="EnvironmentPinnedActionIcon"
          content={colorizeLynxSvg(closeSvg, svgColors.mutedForeground)}
        />
      </view>
      {props.error ? (
        <text className="EnvironmentPinnedError">Could not save</text>
      ) : null}
    </view>
  );
}

function EnvironmentMarkers(props: {
  readonly markers: readonly ThreadMarker[];
  readonly messageTextById: Readonly<Record<string, string>>;
  readonly onJump: (messageId: string) => void;
  readonly threadId: string;
}) {
  const [open, setOpen] = useState(true);
  const [markers, setMarkers] = useState<readonly ThreadMarker[]>(props.markers);
  const [busyMarkerId, setBusyMarkerId] = useState<string | null>(null);
  const [errorMarkerId, setErrorMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (busyMarkerId === null) setMarkers(props.markers);
  }, [busyMarkerId, props.markers]);

  async function dispatchMarkerCommand(
    markerId: string,
    nextMarkers: readonly ThreadMarker[],
    command:
      | {
          readonly type: 'thread.marker.remove';
          readonly markerId: never;
        }
      | {
          readonly type: 'thread.marker.done.set';
          readonly markerId: never;
          readonly done: boolean;
        }
      | {
          readonly type: 'thread.marker.label.set';
          readonly markerId: never;
          readonly label: string | null;
        }
  ) {
    'background only';
    if (busyMarkerId !== null) return;
    const previous = markers;
    setMarkers(nextMarkers);
    setBusyMarkerId(markerId);
    setErrorMarkerId(null);
    try {
      await dispatchSynaraCommand({
        ...command,
        commandId: environmentCommandId() as never,
        threadId: props.threadId as never,
      });
    } catch {
      setMarkers(previous);
      setErrorMarkerId(markerId);
    } finally {
      setBusyMarkerId(null);
    }
  }

  const disclosure = useLynxInteractiveState({
    baseClassName: 'EnvironmentDisclosure',
    accessibleLabel: 'Markers',
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => setOpen((current) => !current),
  });

  if (markers.length === 0) return null;

  return (
    <view className="EnvironmentSection">
      <view
        className={disclosure.className}
        aria-expanded={open}
        {...disclosure.eventProps}
      >
        <text className="EnvironmentDisclosureLabel">Markers</text>
        <ChevronDownIcon
          className={`EnvironmentDisclosureChevron${
            open ? ' EnvironmentDisclosureChevron--open' : ''
          }`}
          size={12}
          color="var(--muted-foreground)"
        />
      </view>
      {open ? (
        <view className="EnvironmentPinnedList">
          {markers.map((marker) => (
            <EnvironmentMarkerRow
              busy={busyMarkerId !== null}
              error={errorMarkerId === marker.id}
              key={marker.id}
              marker={marker}
              messageText={props.messageTextById[marker.messageId]}
              onJump={() => props.onJump(marker.messageId)}
              onDoneChange={(done) =>
                void dispatchMarkerCommand(
                  marker.id,
                  markers.map((candidate) =>
                    candidate.id === marker.id
                      ? {
                          ...candidate,
                          done,
                          updatedAt: new Date().toISOString(),
                        }
                      : candidate
                  ),
                  {
                    type: 'thread.marker.done.set',
                    markerId: marker.id as never,
                    done,
                  }
                )
              }
              onRename={(label) =>
                void dispatchMarkerCommand(
                  marker.id,
                  markers.map((candidate) =>
                    candidate.id === marker.id
                      ? {
                          ...candidate,
                          label,
                          updatedAt: new Date().toISOString(),
                        }
                      : candidate
                  ),
                  {
                    type: 'thread.marker.label.set',
                    markerId: marker.id as never,
                    label,
                  }
                )
              }
              onRemove={() =>
                void dispatchMarkerCommand(
                  marker.id,
                  markers.filter((candidate) => candidate.id !== marker.id),
                  {
                    type: 'thread.marker.remove',
                    markerId: marker.id as never,
                  }
                )
              }
            />
          ))}
        </view>
      ) : null}
    </view>
  );
}

function EnvironmentNotepad(props: {
  readonly notes: string;
  readonly threadId: string;
}) {
  const textareaRef = useRef<React.ElementRef<'textarea'>>(null);
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState(props.notes);
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const valueRef = useRef(value);
  const committedRef = useRef(props.notes);
  const lastObservedServerNotesRef = useRef(props.notes);
  const pendingLocalEchoRef = useRef<{
    readonly staleServerValue: string;
    readonly value: string;
  } | null>(null);
  const saveGenerationRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const retryAfterSaveRef = useRef(false);

  useEffect(() => {
    'background only';
    lastObservedServerNotesRef.current = props.notes;
    const pendingLocalEcho = pendingLocalEchoRef.current;
    if (pendingLocalEcho && props.notes === pendingLocalEcho.value) {
      pendingLocalEchoRef.current = null;
    }
    const waitingForLocalEcho =
      pendingLocalEchoRef.current !== null &&
      valueRef.current === pendingLocalEchoRef.current.value &&
      props.notes === pendingLocalEchoRef.current.staleServerValue;
    if (
      valueRef.current === committedRef.current &&
      !waitingForLocalEcho &&
      props.notes !== valueRef.current
    ) {
      pendingLocalEchoRef.current = null;
      valueRef.current = props.notes;
      committedRef.current = props.notes;
      setValue(props.notes);
      textareaRef.current
        ?.invoke({
          method: 'setValue',
          params: { value: props.notes },
        })
        .exec();
    }
  }, [props.notes]);

  async function flushNotes(): Promise<void> {
    'background only';
    if (saveInFlightRef.current) {
      retryAfterSaveRef.current = true;
      return;
    }
    const next = valueRef.current;
    if (next === committedRef.current) return;
    saveInFlightRef.current = true;
    setSaveState('saving');
    try {
      await dispatchSynaraCommand({
        type: 'thread.meta.update',
        commandId: environmentCommandId() as never,
        threadId: props.threadId as never,
        notes: next,
      });
      committedRef.current = next;
      pendingLocalEchoRef.current = {
        value: next,
        staleServerValue: lastObservedServerNotesRef.current,
      };
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      saveInFlightRef.current = false;
      if (
        retryAfterSaveRef.current &&
        valueRef.current !== committedRef.current
      ) {
        retryAfterSaveRef.current = false;
        scheduleSave(0);
      } else {
        retryAfterSaveRef.current = false;
      }
    }
  }

  function scheduleSave(delayMs = NOTES_SAVE_DELAY_MS) {
    'background only';
    const generation = ++saveGenerationRef.current;
    void sleepOnHost(delayMs).then(() => {
      if (saveGenerationRef.current !== generation) return;
      return flushNotes();
    });
  }

  const disclosure = useLynxInteractiveState({
    baseClassName: 'EnvironmentDisclosure',
    accessibleLabel: 'Notepad',
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => setOpen((current) => !current),
  });

  return (
    <view className="EnvironmentSection">
      <view
        className={disclosure.className}
        aria-expanded={open}
        {...disclosure.eventProps}
      >
        <text className="EnvironmentDisclosureLabel">Notepad</text>
        <ChevronDownIcon
          className={`EnvironmentDisclosureChevron${
            open ? ' EnvironmentDisclosureChevron--open' : ''
          }`}
          size={12}
          color="var(--muted-foreground)"
        />
      </view>
      {open ? (
        <view className="EnvironmentNotepad">
          <textarea
            ref={textareaRef}
            className="EnvironmentNotepadInput"
            aria-label="Thread notepad"
            accessibility-element
            accessibility-label="Thread notepad"
            focusable
            default-value={value}
            placeholder="Type here"
            maxlength={THREAD_NOTES_MAX_CHARS}
            maxlines={8}
            enable-scroll-bar
            bindinput={(event) => {
              'background only';
              valueRef.current = event.detail.value;
              setValue(event.detail.value);
              scheduleSave();
            }}
            bindblur={() => {
              'background only';
              saveGenerationRef.current += 1;
              void flushNotes();
            }}
          />
          <text
            className={`EnvironmentNotepadStatus EnvironmentNotepadStatus--${saveState}`}
          >
            {saveState === 'error' ? 'Could not save' : ''}
          </text>
        </view>
      ) : null}
    </view>
  );
}

export function EnvironmentPanel(props: {
  readonly branch: string | null;
  readonly envMode: 'local' | 'worktree';
  readonly notes: string;
  readonly onOpenSettings: () => void;
  readonly onJumpToPinnedMessage: (messageId: string) => void;
  readonly onOpenChanges: () => void;
  readonly open: boolean;
  readonly pinnedMessages: readonly PinnedMessage[];
  readonly pinnedMessageTextById: Readonly<Record<string, string>>;
  readonly projectId: string;
  readonly provider: ProviderKind;
  readonly pullRequest: OrchestrationThreadPullRequest | null;
  readonly recapRevision: string;
  readonly threadId: string;
  readonly threadMarkers: readonly ThreadMarker[];
  readonly workspaceRoot: string | null;
}) {
  const { svgColors } = useTheme();
  const [gitStatus, setGitStatus] = useState<GitStatusResult | null>(null);
  const [gitRefreshGeneration, setGitRefreshGeneration] = useState(0);
  const usageQuery = useQuery({
    queryKey: ['environment-provider-usage', props.provider],
    queryFn: () => {
      'background only';
      return fetchAllProviderUsage({});
    },
    staleTime: 30_000,
    enabled: props.open,
  });
  const usage = usageQuery.data?.find(
    (snapshot) => snapshot.provider === props.provider
  );
  const primaryLimit = usage?.limits[0];
  const usageLabel = primaryLimit
    ? deriveProviderUsageLimitDisplay(primaryLimit).leftText
    : usage?.status === 'needs-auth'
      ? providerUsageNeedsAuthDetail(props.provider)
      : usage?.detail ?? 'Usage is currently unavailable.';

  const settingsInteraction = useLynxInteractiveState({
    baseClassName: 'EnvironmentSettings',
    accessibleLabel: 'Panel sections',
    onActivate: props.onOpenSettings,
  });

  return (
    <view
      className={`EnvironmentOverlay${
        props.open ? ' EnvironmentOverlay--open' : ''
      }`}
      aria-hidden={!props.open}
    >
      <view className="EnvironmentSurface">
        <scroll-view className="EnvironmentScroller" scroll-y>
          <view className="EnvironmentContent">
            <view className="EnvironmentHeader">
              <text className="EnvironmentTitle">Environment</text>
              <view
                className={settingsInteraction.className}
                {...settingsInteraction.eventProps}
              >
                <svg
                  className="EnvironmentSettingsIcon"
                  content={colorizeLynxSvg(
                    settingsSvg,
                    svgColors.mutedForeground
                  )}
                />
              </view>
            </view>

            {props.workspaceRoot ? (
              <EnvironmentChanges
                onOpenViewer={props.onOpenChanges}
                open={props.open}
                onStatusChange={setGitStatus}
                workspaceRoot={props.workspaceRoot}
                key={`changes-${gitRefreshGeneration}`}
              />
            ) : null}

            {props.workspaceRoot ? (
              <EnvironmentBranch
                branch={props.branch}
                envMode={props.envMode}
                open={props.open}
                threadId={props.threadId}
                workspaceRoot={props.workspaceRoot}
              />
            ) : null}
            {props.workspaceRoot ? (
              <text className="EnvironmentWorkspace">{props.workspaceRoot}</text>
            ) : null}

            {props.workspaceRoot ? (
              <EnvironmentGitAction
                branch={props.branch}
                gitStatus={gitStatus}
                open={props.open}
                workspaceRoot={props.workspaceRoot}
                onCompleted={() =>
                  setGitRefreshGeneration((current) => current + 1)
                }
              />
            ) : null}

            <EnvironmentLocalServers />

            <view className="EnvironmentDivider" />
            <EnvironmentSectionLabel>Usage</EnvironmentSectionLabel>
            <EnvironmentRow
              icon={
                <OpenAIProviderIcon provider={props.provider} />
              }
              label={providerUsageDisplayName(props.provider)}
              trailing={usageQuery.isPending ? 'Loading…' : usageLabel}
            />

            {props.workspaceRoot ? (
              <EnvironmentRepository
                open={props.open}
                workspaceRoot={props.workspaceRoot}
              />
            ) : null}

            {props.workspaceRoot && props.pullRequest?.state === 'open' ? (
              <EnvironmentPullRequest
                open={props.open}
                pullRequest={props.pullRequest}
                workspaceRoot={props.workspaceRoot}
              />
            ) : null}

            {props.workspaceRoot ? (
              <EnvironmentEditor
                open={props.open}
                workspaceRoot={props.workspaceRoot}
              />
            ) : null}

            {props.workspaceRoot ? (
              <EnvironmentRecap
                open={props.open}
                revision={props.recapRevision}
                threadId={props.threadId}
                workspaceRoot={props.workspaceRoot}
              />
            ) : null}

            {props.pinnedMessages.length > 0 ? (
              <>
                <view className="EnvironmentDivider" />
                <EnvironmentPinned
                  messageTextById={props.pinnedMessageTextById}
                  onJump={props.onJumpToPinnedMessage}
                  pins={props.pinnedMessages}
                  threadId={props.threadId}
                />
              </>
            ) : null}

            {props.threadMarkers.length > 0 ? (
              <>
                <view className="EnvironmentDivider" />
                <EnvironmentMarkers
                  markers={props.threadMarkers}
                  messageTextById={props.pinnedMessageTextById}
                  onJump={props.onJumpToPinnedMessage}
                  threadId={props.threadId}
                />
              </>
            ) : null}

            <view className="EnvironmentDivider" />
            <EnvironmentProjectInstructions
              key={props.projectId}
              projectId={props.projectId}
              threadId={props.threadId}
              notes={props.notes}
            />

            <view className="EnvironmentDivider" />
            <EnvironmentNotepad
              key={props.threadId}
              threadId={props.threadId}
              notes={props.notes}
            />
          </view>
        </scroll-view>
      </view>
    </view>
  );
}
