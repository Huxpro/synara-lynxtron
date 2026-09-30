import { describe, expect, it } from "@rstest/core";

import type { ModelSelection } from "@synara/contracts";

import {
  buildSelectionChatCreateCommand,
  requireSelectionAttachment,
  resolveSelectionChatComposerPosition,
} from "./selectionChat.logic";

describe("selection chat logic", () => {
  it("turns a selection into an assistant-selection attachment or explains why not", () => {
    expect(requireSelectionAttachment({ assistantMessageId: "m1", text: "Use const" })).toEqual(
      expect.objectContaining({ type: "assistant-selection", assistantMessageId: "m1" }),
    );
    expect(() => requireSelectionAttachment({ assistantMessageId: "m1", text: "   " })).toThrow(
      "Select between 1 and 4,000 characters.",
    );
  });

  it("opens the new chat as a regular project thread", () => {
    const modelSelection = { provider: "codex", model: "gpt-5.6-luna" } as ModelSelection;
    expect(
      buildSelectionChatCreateCommand({
        commandId: "c1",
        createdAt: "2026-09-30T00:00:00.000Z",
        threadId: "t1",
        projectId: "p1",
        modelSelection,
        runtimeMode: "full-access",
        envMode: "worktree",
        branch: "main",
      }),
    ).toEqual({
      type: "thread.create",
      commandId: "c1",
      threadId: "t1",
      projectId: "p1",
      title: "New chat",
      modelSelection,
      runtimeMode: "full-access",
      interactionMode: "default",
      envMode: "worktree",
      branch: "main",
      worktreePath: null,
      createdAt: "2026-09-30T00:00:00.000Z",
    });
  });

  it("grows the composer up from the toolbar's bottom edge when the toolbar sat above", () => {
    const viewport = { width: 1079, height: 803 };
    const size = { width: 320, height: 101 };
    // Toolbar at top 49 (30px tall): the composer's bottom lands on the toolbar's bottom.
    expect(
      resolveSelectionChatComposerPosition({
        anchor: { left: 243, top: 149, placement: "top" },
        size,
        viewport,
      }),
    ).toEqual({ left: 243, top: 78 });
    // Below the selection it opens at the toolbar's top.
    expect(
      resolveSelectionChatComposerPosition({
        anchor: { left: 243, top: 149, placement: "bottom" },
        size,
        viewport,
      }),
    ).toEqual({ left: 243, top: 149 });
  });

  it("keeps the composer 8px inside the viewport", () => {
    expect(
      resolveSelectionChatComposerPosition({
        anchor: { left: 900, top: 20, placement: "top" },
        size: { width: 320, height: 101 },
        viewport: { width: 1079, height: 803 },
      }),
    ).toEqual({ left: 751, top: 8 });
  });
});
