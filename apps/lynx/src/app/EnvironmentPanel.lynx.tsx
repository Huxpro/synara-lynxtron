import { useEffect, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import {
  THREAD_NOTES_MAX_CHARS,
  type ProviderKind,
} from '@synara/contracts';
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
import stopSvg from '@synara-central-icons/stop.svg?raw';

import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ChevronDownIcon, GitBranchIcon } from '../lib/icons.lynx';
import { RefreshCwIcon } from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  dispatchSynaraCommand,
  fetchAllProviderUsage,
  fetchLocalServers,
  stopLocalServer,
} from '../data/synaraClient.lynx';
import { sleepOnHost } from '../platform/timer';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from '../components/ui/menu.lynx';

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
  readonly trailing?: string | null;
}) {
  return (
    <view className="EnvironmentRow">
      <view className="EnvironmentRowIcon">{props.icon}</view>
      <text className="EnvironmentRowLabel">{props.label}</text>
      {props.trailing ? (
        <text className="EnvironmentRowTrailing">{props.trailing}</text>
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
  readonly provider: ProviderKind;
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
