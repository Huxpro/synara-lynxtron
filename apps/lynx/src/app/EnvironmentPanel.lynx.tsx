import { useEffect, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import {
  THREAD_NOTES_MAX_CHARS,
  type EditorId,
  type ProviderKind,
} from '@synara/contracts';
import {
  mergeProjectInstructionsIntoThreadNotes,
  useProjectInstructionsStore,
} from '@synara-web/projectInstructionsStore';
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
import stopSvg from '@synara-central-icons/stop.svg?raw';

import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ChatMarkdown } from '../components/markdown/ChatMarkdown.lynx';
import {
  ChevronDownIcon,
  CopyIcon,
  DeviceLaptopIcon,
  GitBranchIcon,
  RefreshCwIcon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  dispatchSynaraCommand,
  fetchAllProviderUsage,
  fetchLocalServers,
  fetchServerConfig,
  fetchGitHubRepository,
  openPathInEditor,
  stopLocalServer,
} from '../data/synaraClient.lynx';
import { webStorage } from '../platform/storage';
import { sleepOnHost } from '../platform/timer';
import { platformWindow } from '../platform/window';
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
  readonly trailing?: string | null;
}) {
  return (
    <view className="EnvironmentRow">
      <view className="EnvironmentRowIcon">{props.icon}</view>
      <text className="EnvironmentRowLabel">{props.label}</text>
      {props.trailing ? (
        <text className="EnvironmentRowTrailing">{props.trailing}</text>
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
  readonly open: boolean;
  readonly projectId: string;
  readonly provider: ProviderKind;
  readonly recapRevision: string;
  readonly threadId: string;
  readonly workspaceRoot: string | null;
}) {
  const { svgColors } = useTheme();
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

            <EnvironmentRow
              icon={
                <GitBranchIcon
                  size={16}
                  color="var(--foreground)"
                />
              }
              label={props.branch ?? 'No branch'}
              trailing={props.envMode === 'worktree' ? 'Worktree' : 'Local'}
            />
            {props.workspaceRoot ? (
              <text className="EnvironmentWorkspace">{props.workspaceRoot}</text>
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
              <EnvironmentEditor
                open={props.open}
                workspaceRoot={props.workspaceRoot}
              />
            ) : null}

            {props.workspaceRoot ? (
              <EnvironmentRepository
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
