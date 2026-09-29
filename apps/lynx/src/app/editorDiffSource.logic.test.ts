import { describe, expect, it } from "@rstest/core";
import type { OrchestrationCheckpointSummary } from "@synara/contracts";

import { resolveEditorDiffRequest, sortEditorDiffCheckpoints } from "./editorDiffSource.logic";

function checkpoint(
  turnId: string,
  checkpointTurnCount: number,
  completedAt: string,
): OrchestrationCheckpointSummary {
  return {
    turnId: turnId as never,
    checkpointTurnCount,
    checkpointRef: `refs/checkpoints/${turnId}` as never,
    status: "ready",
    files: [],
    assistantMessageId: null,
    completedAt,
  };
}

const checkpoints = [
  checkpoint("turn-1", 1, "2026-08-24T10:00:00.000Z"),
  checkpoint("turn-3", 3, "2026-08-24T12:00:00.000Z"),
  checkpoint("turn-2", 2, "2026-08-24T11:00:00.000Z"),
];

describe("Editor diff source", () => {
  it("keeps repository scopes direct", () => {
    expect(resolveEditorDiffRequest("staged", checkpoints)).toEqual({
      kind: "repo",
      scope: "staged",
    });
  });

  it("uses the latest checkpoint for all-turn and last-turn requests", () => {
    expect(resolveEditorDiffRequest("allTurns", checkpoints)).toEqual({
      kind: "full-thread",
      toTurnCount: 3,
    });
    expect(resolveEditorDiffRequest("lastTurn", checkpoints)).toEqual({
      kind: "turn",
      fromTurnCount: 2,
      toTurnCount: 3,
    });
  });

  it("resolves a specific turn and rejects stale or empty selections", () => {
    expect(resolveEditorDiffRequest("turn:turn-2", checkpoints)).toEqual({
      kind: "turn",
      fromTurnCount: 1,
      toTurnCount: 2,
    });
    expect(resolveEditorDiffRequest("turn:missing", checkpoints)).toEqual({
      kind: "empty",
    });
    expect(resolveEditorDiffRequest("allTurns", [])).toEqual({ kind: "empty" });
  });

  it("orders checkpoints newest-first without mutating the snapshot", () => {
    expect(sortEditorDiffCheckpoints(checkpoints).map((item) => item.turnId)).toEqual([
      "turn-3",
      "turn-2",
      "turn-1",
    ]);
    expect(checkpoints.map((item) => item.turnId)).toEqual(["turn-1", "turn-3", "turn-2"]);
  });
});
