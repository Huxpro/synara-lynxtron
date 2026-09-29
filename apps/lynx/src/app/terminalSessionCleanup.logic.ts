export async function closeLynxTerminalSession(input: {
  readonly threadId: string;
  readonly terminalId: string;
  readonly close: (input: {
    readonly threadId: string;
    readonly terminalId: string;
    readonly deleteHistory: true;
  }) => Promise<void>;
  readonly writeExit: (input: {
    readonly threadId: string;
    readonly terminalId: string;
    readonly data: string;
  }) => Promise<void>;
}): Promise<void> {
  try {
    await input.close({
      threadId: input.threadId,
      terminalId: input.terminalId,
      deleteHistory: true,
    });
  } catch {
    await input
      .writeExit({
        threadId: input.threadId,
        terminalId: input.terminalId,
        data: "exit\r",
      })
      .catch(() => undefined);
  }
}
