import { closeLynxTerminalSession } from './terminalSessionCleanup.logic';

export async function deleteWorkspaceWithTerminalCleanup(input: {
  readonly workspaceId: string;
  readonly closeTerminal: (input: {
    readonly threadId: string;
    readonly terminalId: string;
    readonly deleteHistory: true;
  }) => Promise<void>;
  readonly deleteWorkspace: (workspaceId: string) => void;
  readonly writeTerminalExit: (input: {
    readonly threadId: string;
    readonly terminalId: string;
    readonly data: string;
  }) => Promise<void>;
}): Promise<void> {
  await closeLynxTerminalSession({
    threadId: `workspace:${input.workspaceId}`,
    terminalId: 'default',
    close: input.closeTerminal,
    writeExit: input.writeTerminalExit,
  });
  input.deleteWorkspace(input.workspaceId);
}
