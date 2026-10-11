import { afterEach, describe, expect, it, rs } from "@rstest/core";
import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import {
  canContinueFailedTurn,
  createPlanCardActions,
  createUndoTurnFiles,
  FAILED_TURN_CONTINUATION_PROMPT,
} from "./transcriptCardActions.generated";
afterEach(() => setNativeApiForTest(undefined));
const settled = {
  id: "thread-83",
  latestTurn: { turnId: "failed-83", state: "error" },
  session: { status: "ready" },
  hasPendingApprovals: false,
  hasPendingUserInput: false,
  activities: [],
};
describe("upstream transcript card actions over Native ports", () => {
  it("copies original markdown, downloads to .plan and settles cancellation", async () => {
    const writeFile = rs.fn().mockResolvedValue({ relativePath: ".plan/fixture.md" });
    const saveFile = rs.fn().mockResolvedValue(null);
    setNativeApiForTest({ projects: { writeFile }, dialogs: { saveFile } } as never);
    const downloading = rs.fn();
    const exporting = rs.fn();
    const copy = rs.fn();
    const actions = createPlanCardActions({
      filename: "fixture.md",
      markdown: "# Fixture\n",
      workspaceRoot: "/tmp/fixture",
      setIsDownloading: downloading,
      setIsExporting: exporting,
      copyToClipboard: copy,
    });
    actions.handleCopy();
    actions.handleDownload();
    actions.handleExport();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(copy).toHaveBeenCalledWith("# Fixture\n", undefined);
    expect(writeFile).toHaveBeenCalledWith({
      cwd: "/tmp/fixture",
      relativePath: ".plan/fixture.md",
      contents: "# Fixture\n",
    });
    expect(saveFile).toHaveBeenCalledWith({
      defaultFilename: "fixture.md",
      contents: "# Fixture\n",
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    expect(downloading.mock.calls.map((call) => call[0])).toEqual([true, false]);
    expect(exporting.mock.calls.map((call) => call[0])).toEqual([true, false]);
  });
  it("undoes unique checkpoints newest-first and stops on the first dispatch failure", async () => {
    const commands: any[] = [];
    const pending = rs.fn();
    const reverting = rs.fn();
    const error = rs.fn();
    setNativeApiForTest({
      dialogs: { confirm: async () => true },
      orchestration: {
        dispatchCommand: async (command: any) => {
          commands.push(command);
          if (command.turnCount === 2) throw new Error("checkpoint unavailable");
        },
      },
    } as never);
    await createUndoTurnFiles({
      activeThread: settled as never,
      isRevertingCheckpoint: false,
      hasLiveTurn: false,
      isSendBusy: false,
      isConnecting: false,
      setThreadError: error,
      setIsRevertingCheckpoint: reverting,
      setPendingFileUndo: pending,
    })([1, 3, 2, 3]);
    expect(commands.map((x) => x.turnCount)).toEqual([3, 2]);
    expect(commands.every((x) => x.scope === "files")).toBe(true);
    expect(commands[0].createdAt).toBe(commands[1].createdAt);
    expect(pending.mock.calls[0]?.[0]?.turnCounts).toEqual([3, 2, 1]);
    expect(pending).toHaveBeenLastCalledWith(null);
    expect(reverting).toHaveBeenLastCalledWith(false);
    expect(error).toHaveBeenLastCalledWith("thread-83", "checkpoint unavailable");
  });
  it("does not confirm while busy and respects cancellation", async () => {
    const confirm = rs.fn().mockResolvedValue(false);
    const dispatchCommand = rs.fn();
    setNativeApiForTest({ dialogs: { confirm }, orchestration: { dispatchCommand } } as never);
    const base = {
      activeThread: settled as never,
      isRevertingCheckpoint: false,
      hasLiveTurn: false,
      isSendBusy: false,
      isConnecting: false,
      setThreadError: rs.fn(),
      setIsRevertingCheckpoint: rs.fn(),
      setPendingFileUndo: rs.fn(),
    };
    await createUndoTurnFiles({ ...base, isSendBusy: true })([1]);
    expect(confirm).not.toHaveBeenCalled();
    await createUndoTurnFiles(base)([1]);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(dispatchCommand).not.toHaveBeenCalled();
  });
  it("only continues the latest settled failed turn with no pending decision", () => {
    expect(canContinueFailedTurn(settled as never, "failed-83" as never, true, true)).toBe(true);
    for (const changes of [
      { latestTurn: { turnId: "new-turn", state: "error" } },
      { latestTurn: { turnId: "failed-83", state: "completed" } },
      { session: { status: "running" } },
      { hasPendingApprovals: true },
      { hasPendingUserInput: true },
    ])
      expect(
        canContinueFailedTurn(
          { ...settled, ...changes } as never,
          "failed-83" as never,
          true,
          true,
        ),
      ).toBe(false);
    expect(FAILED_TURN_CONTINUATION_PROMPT).toContain("avoid repeating them");
  });
});
