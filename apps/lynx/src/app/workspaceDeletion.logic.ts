export async function deleteWorkspaceWithTerminalCleanup(input: {
  readonly workspaceId: string;
  readonly closeTerminal: (input: {
    readonly threadId: string;
    readonly terminalId: string;
    readonly deleteHistory: true;
  }) => Promise<void>;
  readonly deleteWorkspace: (workspaceId: string) => void;
}): Promise<void> {
  try {
    await input.closeTerminal({
      threadId: `workspace:${input.workspaceId}`,
      terminalId: 'default',
      deleteHistory: true,
    });
  } catch {
    // Deleting the local workspace page must remain available when the host
    // terminal already exited or cannot be reached.
  }
  input.deleteWorkspace(input.workspaceId);
}
