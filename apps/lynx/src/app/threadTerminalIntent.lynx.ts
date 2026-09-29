export interface OpenThreadPathInTerminalIntent {
  readonly cwd: string;
  readonly threadId: string;
}

export interface OpenThreadPathTerminalTarget {
  readonly shouldCreateNewTerminal: boolean;
  readonly terminalId: string;
}

export async function executeOpenThreadPathInTerminal(input: {
  readonly activateTerminal: (terminalId: string) => void;
  readonly addTerminal: (terminalId: string) => void;
  readonly closeHostTerminal: (terminalId: string) => Promise<void>;
  readonly closeTerminal: (terminalId: string) => void;
  readonly flush: () => void;
  readonly openDock: () => void;
  readonly openHostTerminal: (terminalId: string) => Promise<void>;
  readonly restoreDock: () => void;
  readonly restoreTerminalState: () => void;
  readonly target: OpenThreadPathTerminalTarget;
  readonly writePath: (terminalId: string) => Promise<void>;
}): Promise<void> {
  input.openDock();
  if (input.target.shouldCreateNewTerminal) {
    input.addTerminal(input.target.terminalId);
  } else {
    input.activateTerminal(input.target.terminalId);
  }
  input.flush();

  try {
    if (input.target.shouldCreateNewTerminal) {
      await input.openHostTerminal(input.target.terminalId);
    }
    await input.writePath(input.target.terminalId);
  } catch (cause) {
    if (input.target.shouldCreateNewTerminal) {
      await input.closeHostTerminal(input.target.terminalId).catch(() => {});
      input.closeTerminal(input.target.terminalId);
    }
    input.restoreTerminalState();
    input.restoreDock();
    input.flush();
    throw cause;
  }
}

export function resolveOpenThreadPathTerminalTarget(input: {
  readonly activeTerminalId: string;
  readonly createTerminalId: () => string;
  readonly runningTerminalIds: readonly string[];
  readonly terminalIds: readonly string[];
  readonly terminalOpen: boolean;
}): OpenThreadPathTerminalTarget {
  const candidateId = input.activeTerminalId || input.terminalIds[0] || "default";
  const reuseExisting =
    input.terminalOpen &&
    input.terminalIds.includes(candidateId) &&
    !input.runningTerminalIds.includes(candidateId);
  return {
    shouldCreateNewTerminal: !reuseExisting,
    terminalId: reuseExisting ? candidateId : input.createTerminalId(),
  };
}

type Listener = (intent: OpenThreadPathInTerminalIntent) => void;

let pendingIntent: OpenThreadPathInTerminalIntent | null = null;
const listeners = new Set<Listener>();

export function requestOpenThreadPathInTerminal(intent: OpenThreadPathInTerminalIntent): void {
  pendingIntent = intent;
  for (const listener of listeners) listener(intent);
}

export function subscribeOpenThreadPathInTerminal(listener: Listener): () => void {
  listeners.add(listener);
  if (pendingIntent) listener(pendingIntent);
  return () => listeners.delete(listener);
}

export function consumeOpenThreadPathInTerminal(
  threadId: string,
): OpenThreadPathInTerminalIntent | null {
  if (pendingIntent?.threadId !== threadId) return null;
  const intent = pendingIntent;
  pendingIntent = null;
  return intent;
}
