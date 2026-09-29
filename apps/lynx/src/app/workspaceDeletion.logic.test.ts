import { describe, expect, it, rs } from "@rstest/core";

import { deleteWorkspaceWithTerminalCleanup } from "./workspaceDeletion.logic";

describe("deleteWorkspaceWithTerminalCleanup", () => {
  it("closes and clears the synthetic workspace terminal before deletion", async () => {
    const calls: string[] = [];
    const closeTerminal = rs.fn(async () => {
      calls.push("close");
    });
    const deleteWorkspace = rs.fn(() => {
      calls.push("delete");
    });

    await deleteWorkspaceWithTerminalCleanup({
      workspaceId: "workspace-1",
      terminalIds: ["default", "workspace-2"],
      closeTerminal,
      deleteWorkspace,
      writeTerminalExit: async () => undefined,
    });

    expect(closeTerminal).toHaveBeenCalledTimes(2);
    expect(closeTerminal).toHaveBeenCalledWith({
      threadId: "workspace:workspace-1",
      terminalId: "default",
      deleteHistory: true,
    });
    expect(closeTerminal).toHaveBeenCalledWith({
      threadId: "workspace:workspace-1",
      terminalId: "workspace-2",
      deleteHistory: true,
    });
    expect(calls).toEqual(["close", "close", "delete"]);
  });

  it("still deletes the page when terminal cleanup is already unavailable", async () => {
    const deleteWorkspace = rs.fn();
    const writeTerminalExit = rs.fn(async () => undefined);

    await deleteWorkspaceWithTerminalCleanup({
      workspaceId: "workspace-1",
      terminalIds: ["default"],
      closeTerminal: async () => {
        throw new Error("terminal already exited");
      },
      deleteWorkspace,
      writeTerminalExit,
    });

    expect(deleteWorkspace).toHaveBeenCalledWith("workspace-1");
    expect(writeTerminalExit).toHaveBeenCalledWith({
      threadId: "workspace:workspace-1",
      terminalId: "default",
      data: "exit\r",
    });
  });
});
