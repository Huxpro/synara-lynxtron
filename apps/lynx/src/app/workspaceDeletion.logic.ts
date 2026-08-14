import { closeLynxTerminalSession } from './terminalSessionCleanup.logic';

export async function deleteWorkspaceWithTerminalCleanup(input: {
  readonly workspaceId: string;
  readonly terminalIds: readonly string[];
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
  await Promise.all(
    input.terminalIds.map((terminalId) =>
      closeLynxTerminalSession({
        threadId: `workspace:${input.workspaceId}`,
        terminalId,
        close: input.closeTerminal,
        writeExit: input.writeTerminalExit,
      })
    )
  );
  input.deleteWorkspace(input.workspaceId);
}
