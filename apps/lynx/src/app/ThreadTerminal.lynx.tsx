import { useEffect, useRef, useState } from '@lynx-js/react';
import type { InputRef } from '@lynx-js/lynx-ui';
import type { TerminalSessionSnapshot } from '@synara/contracts';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import { confirmTerminalTabClose } from '@synara-web/lib/terminalCloseConfirmation';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input.lynx';
import { dialogs } from '../platform/dialogs';
import { webStorage } from '../platform/storage';
import { sleepOnHost } from '../platform/timer';
import { platformTerminal } from '../platform/terminal';
import { resolveLynxTerminalTypography } from './terminalAppearance.logic';
import { closeLynxTerminalSession } from './terminalSessionCleanup.logic';
import './thread-terminal.css';

const DEFAULT_TERMINAL_ID = 'lynx-drawer';

export function ThreadTerminal({
  autoOpen = false,
  fontFamily,
  fontSizePx,
  open,
  presentationMode = 'drawer',
  terminalId = DEFAULT_TERMINAL_ID,
  threadId,
  workspaceRoot,
  onOpenChange,
}: {
  readonly autoOpen?: boolean;
  readonly fontFamily: string;
  readonly fontSizePx: number;
  readonly open: boolean;
  readonly presentationMode?: 'drawer' | 'workspace';
  readonly terminalId?: string;
  readonly threadId: string;
  readonly workspaceRoot: string;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [command, setCommand] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [snapshot, setSnapshot] = useState<TerminalSessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const commandInputRef = useRef<InputRef>(null);
  const autoOpenAttemptKeyRef = useRef<string | null>(null);
  const typography = resolveLynxTerminalTypography({
    fontFamily,
    fontSizePx,
  });

  const refresh = async () => {
    'background only';
    const next = await platformTerminal.open({
      threadId,
      terminalId,
      cwd: workspaceRoot,
      cols: 100,
      rows: 24,
      streamOutput: false,
    });
    setSnapshot(next);
    setError(null);
    return next;
  };

  useEffect(() => {
    if (!open || !autoOpen || snapshot || pending) return;
    const attemptKey = `${threadId}\0${terminalId}\0${workspaceRoot}`;
    if (autoOpenAttemptKeyRef.current === attemptKey) return;
    autoOpenAttemptKeyRef.current = attemptKey;
    setPending(true);
    void refresh()
      .catch((cause) => {
        autoOpenAttemptKeyRef.current = null;
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => setPending(false));
  }, [
    autoOpen,
    open,
    pending,
    snapshot,
    terminalId,
    threadId,
    workspaceRoot,
  ]);

  if (!open) return null;

  const submit = async () => {
    'background only';
    const value = command.trim();
    if (!value || pending) return;
    setPending(true);
    setError(null);
    try {
      await refresh();
      await platformTerminal.write({
        threadId,
        terminalId,
        data: `${value}\r`,
      });
      setCommand('');
      await commandInputRef.current?.setValue('');
      await sleepOnHost(120);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };

  const close = async () => {
    'background only';
    if (pending || confirmingClose) return;
    const confirmationEnabled = readSettingsBehaviorProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    ).confirmTerminalTabClose;
    if (snapshot?.status === 'running') {
      setConfirmingClose(true);
      try {
        if (
          !(await confirmTerminalTabClose({
            dialogs,
            enabled: confirmationEnabled,
            terminalTitle: 'Terminal',
          }))
        ) {
          return;
        }
      } finally {
        setConfirmingClose(false);
      }
    }
    setPending(true);
    onOpenChange(false);
    try {
      if (snapshot) {
        await closeLynxTerminalSession({
          threadId,
          terminalId,
          close: platformTerminal.close,
          writeExit: platformTerminal.write,
        });
      }
    } finally {
      autoOpenAttemptKeyRef.current = null;
      setSnapshot(null);
      setCommand('');
      await commandInputRef.current?.setValue('');
      setError(null);
      setPending(false);
    }
  };

  return (
    <view
      className={`ThreadTerminal ThreadTerminal--${presentationMode}`}
    >
      <view className="ThreadTerminalHeader">
        <text className="ThreadTerminalTitle">Terminal</text>
        <text className="ThreadTerminalStatus">
          {snapshot?.status ?? 'ready'}
        </text>
        <view className="ThreadTerminalSpacer" />
        <Button
          variant="ghost"
          size="xs"
          disabled={pending}
          onClick={() => void refresh().catch((cause) => {
            setError(cause instanceof Error ? cause.message : String(cause));
          })}
        >
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="xs"
          disabled={pending || confirmingClose}
          onClick={() => void close()}
        >
          Close
        </Button>
      </view>
      <scroll-view
        className="ThreadTerminalOutputScroller"
        scroll-orientation="vertical"
      >
        <text className="ThreadTerminalOutput" style={typography}>
          {snapshot?.replayPreamble ?? ''}
          {snapshot?.history || 'Terminal ready.'}
        </text>
      </scroll-view>
      {error ? (
        <text className="ThreadTerminalError">{error}</text>
      ) : null}
      <view className="ThreadTerminalCommandRow">
        <Input
          ref={commandInputRef}
          nativeInput
          className="ThreadTerminalCommandInput"
          style={typography}
          accessibility-label="Terminal command"
          disabled={pending}
          placeholder="Enter a command"
          onInput={(value) => setCommand(value)}
          onConfirm={() => void submit()}
        />
        <Button disabled={!command.trim() || pending} onClick={() => void submit()}>
          {pending ? 'Running...' : 'Run'}
        </Button>
      </view>
    </view>
  );
}
