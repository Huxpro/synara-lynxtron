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
import settingsSvg from '@synara-central-icons/settings-gear-4.svg?raw';
import windowSvg from '@synara-central-icons/window.svg?raw';

import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ChevronDownIcon, GitBranchIcon } from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  dispatchSynaraCommand,
  fetchAllProviderUsage,
} from '../data/synaraClient.lynx';
import { sleepOnHost } from '../platform/timer';

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
