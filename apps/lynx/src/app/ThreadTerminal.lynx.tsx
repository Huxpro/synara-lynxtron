import { useRef, useState } from '@lynx-js/react';
import type { InputRef } from '@lynx-js/lynx-ui';
import type { TerminalSessionSnapshot } from '@synara/contracts';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input.lynx';
import { sleepOnHost } from '../platform/timer';
import { platformTerminal } from '../platform/terminal';
import './thread-terminal.css';

const TERMINAL_ID = 'lynx-drawer';

export function ThreadTerminal({
  open,
  threadId,
  workspaceRoot,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly threadId: string;
  readonly workspaceRoot: string;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [command, setCommand] = useState('');
  const [pending, setPending] = useState(false);
  const [snapshot, setSnapshot] = useState<TerminalSessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const commandInputRef = useRef<InputRef>(null);

  if (!open) return null;

  const refresh = async () => {
    'background only';
    const next = await platformTerminal.open({
      threadId,
      terminalId: TERMINAL_ID,
      cwd: workspaceRoot,
      cols: 100,
      rows: 24,
      streamOutput: false,
    });
    setSnapshot(next);
    setError(null);
    return next;
  };

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
        terminalId: TERMINAL_ID,
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
    setPending(true);
    onOpenChange(false);
    try {
      if (snapshot) {
        await platformTerminal.close({
          threadId,
          terminalId: TERMINAL_ID,
          deleteHistory: true,
        });
      }
    } finally {
      setSnapshot(null);
      setCommand('');
      await commandInputRef.current?.setValue('');
      setError(null);
      setPending(false);
    }
  };

  return (
    <view className="ThreadTerminal">
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
        <Button variant="ghost" size="xs" onClick={() => void close()}>
          Close
        </Button>
      </view>
      <scroll-view
        className="ThreadTerminalOutputScroller"
        scroll-orientation="vertical"
      >
        <text className="ThreadTerminalOutput">
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
