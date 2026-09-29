import { describe, expect, it, rs } from "@rstest/core";

import { closeLynxTerminalSession } from "./terminalSessionCleanup.logic";

describe("closeLynxTerminalSession", () => {
  it("uses structured close with history deletion", async () => {
    const close = rs.fn(async () => undefined);
    const writeExit = rs.fn(async () => undefined);

    await closeLynxTerminalSession({
      threadId: "thread-1",
      terminalId: "default",
      close,
      writeExit,
    });

    expect(close).toHaveBeenCalledWith({
      threadId: "thread-1",
      terminalId: "default",
      deleteHistory: true,
    });
    expect(writeExit).not.toHaveBeenCalled();
  });

  it("falls back to exit and contains both transport failures", async () => {
    const writeExit = rs.fn(async () => {
      throw new Error("offline");
    });

    await expect(
      closeLynxTerminalSession({
        threadId: "thread-1",
        terminalId: "default",
        close: async () => {
          throw new Error("close unsupported");
        },
        writeExit,
      }),
    ).resolves.toBeUndefined();
    expect(writeExit).toHaveBeenCalledWith({
      threadId: "thread-1",
      terminalId: "default",
      data: "exit\r",
    });
  });
});
