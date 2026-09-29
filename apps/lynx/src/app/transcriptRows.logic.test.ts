import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import type { ThreadTranscriptRow } from "./queries";
import {
  buildTranscriptScrollToBottomParams,
  estimateTranscriptRowMainAxisSize,
  resolveTranscriptPinnedFromScroll,
  resolveTranscriptPinnedFromSample,
  resolveMessageWorkPlacement,
  resolveTranscriptWorkEntryDisplayText,
  transcriptRowVersion,
  type MessageTranscriptRow,
  type WorkLogEntry,
} from "./transcriptRows.logic";

describe("transcript work-entry presentation", () => {
  it("uses the shared reasoning formatter instead of leaking markdown", () => {
    expect(
      resolveTranscriptWorkEntryDisplayText({
        id: "reasoning-1",
        label: "Reasoning trace",
        detail: "**Planning GitHub verification approach**",
        tone: "tool",
      } as never),
    ).toBe("Planning GitHub verification approach");
  });

  it("routes reasoning entries through rich Markdown while ordinary tools stay compact", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const workEntrySource = source.slice(
      source.indexOf("function TranscriptWorkEntry"),
      source.indexOf("function TranscriptWorkEntries"),
    );
    expect(workEntrySource).toContain("isReasoningUpdateWorkEntry(entry)");
    expect(workEntrySource).toContain("formatAgentActivityEntryPreview(entry)");
    expect(workEntrySource).toContain(
      "<ChatMarkdown cwd={workspaceRoot} preparsedTree={markdownTree} text={reasoningText} />",
    );
    expect(workEntrySource).toContain("<TimelineStatusRowComposition");
    expect(source).toContain("chunkCollapsedTurnItems(collapsedTurnItems).map");
    expect(source).toContain("summarizeToolCallGroup(props.entries)");
    expect(source).toContain('baseClassName: "TranscriptToolGroupTrigger"');
    expect(source).toContain("classifyToolCallSummaryCategory(props.entry)");
    expect(source).toContain('<TranscriptStatusIcon kind="search" tone={props.entry.tone} />');
    expect(source).toContain('<TranscriptStatusIcon kind="edit" tone={props.entry.tone} />');
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.TranscriptReasoningEntry\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*19px;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptReasoningEntry \.MdHeading,[\s\S]*?font-size:\s*inherit;[\s\S]*?line-height:\s*inherit;/,
    );
    expect(styles).toMatch(
      /\.TranscriptCollapsedNarration \.MdHeading,[\s\S]*?font-size:\s*12px;[\s\S]*?line-height:\s*19px;/,
    );
  });

  it("opens the end-of-turn changes card with the real provider turn id", () => {
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    expect(source).toContain(
      "accessibleLabel: turnSummary\n      ? `Review changes for turn ${turnSummary.turnId}`",
    );
    expect(source).toContain("if (turnSummary) onOpenTurnDiff?.(turnSummary.turnId);");
    expect(source).toContain("onOpenTurnDiff={onOpenTurnDiff}");
  });

  it("keeps ordinary work rows in label-detail form", () => {
    expect(
      resolveTranscriptWorkEntryDisplayText({
        id: "tool-1",
        label: "Read",
        detail: "src/index.ts",
        tone: "tool",
      } as never),
    ).toBe("Read src/index.ts");
  });

  it("uses Electron file-change wording and basenames for edit rows", () => {
    expect(
      resolveTranscriptWorkEntryDisplayText({
        id: "edit-1",
        label: "File change",
        tone: "tool",
        itemType: "file_change",
        changedFiles: ["/tmp/workspace/example.js"],
      } as never),
    ).toBe("Edited example.js");
    expect(
      resolveTranscriptWorkEntryDisplayText({
        id: "edit-2",
        label: "File change",
        tone: "tool",
        itemType: "file_change",
        changedFiles: ["/tmp/a.ts", "/tmp/b.ts"],
      } as never),
    ).toBe("Edited 2 files");
  });
});

describe("buildTranscriptScrollToBottomParams", () => {
  it("uses the Lynx list position contract and targets the final row", () => {
    expect(buildTranscriptScrollToBottomParams(0)).toBeNull();
    expect(buildTranscriptScrollToBottomParams(4)).toEqual({
      position: 3,
      offset: 0,
      alignTo: "bottom",
      smooth: false,
    });
  });

  it("includes explicit trailing list chrome in the target position", () => {
    expect(buildTranscriptScrollToBottomParams(4, 1)).toEqual({
      position: 4,
      offset: 0,
      alignTo: "bottom",
      smooth: false,
    });
  });
});

describe("resolveTranscriptPinnedFromScroll", () => {
  const base = {
    currentPinned: true,
    nativeUserEventSource: 2,
    bottomEpsilon: 30,
  } as const;

  it("keeps the Native event-source gate and derives the live edge", () => {
    expect(
      resolveTranscriptPinnedFromScroll({
        ...base,
        isWebRelayMode: false,
        detail: {
          eventSource: 2,
          scrollTop: 100,
          scrollHeight: 500,
          listHeight: 300,
        },
      }),
    ).toBe(false);
    expect(
      resolveTranscriptPinnedFromScroll({
        ...base,
        isWebRelayMode: false,
        detail: {
          eventSource: 0,
          scrollTop: 0,
          scrollHeight: 500,
          listHeight: 300,
        },
      }),
    ).toBe(true);
  });

  it("uses Lynx-for-Web delta only to detach from the live edge", () => {
    expect(
      resolveTranscriptPinnedFromScroll({
        ...base,
        isWebRelayMode: true,
        detail: { deltaY: -24, scrollTop: 80, scrollHeight: 500 },
      }),
    ).toBe(false);
    expect(
      resolveTranscriptPinnedFromScroll({
        ...base,
        currentPinned: false,
        isWebRelayMode: true,
        detail: { deltaY: 24, scrollTop: 104, scrollHeight: 500 },
      }),
    ).toBe(false);
  });
});

describe("resolveTranscriptPinnedFromSample", () => {
  const base = {
    currentPinned: true,
    previousScrollTop: 124,
    scrollHeight: 775,
    listHeight: 651,
    bottomEpsilon: 30,
  } as const;

  it("detaches only when the viewport moves upward", () => {
    expect(resolveTranscriptPinnedFromSample({ ...base, scrollTop: 40 })).toBe(false);
    expect(
      resolveTranscriptPinnedFromSample({
        ...base,
        previousScrollTop: null,
        scrollTop: 0,
        scrollHeight: 900,
      }),
    ).toBe(true);
  });

  it("reattaches at the live edge", () => {
    expect(
      resolveTranscriptPinnedFromSample({
        ...base,
        currentPinned: false,
        previousScrollTop: 40,
        scrollTop: 124,
      }),
    ).toBe(true);
  });
});

function entry(id: string, toolStatus: WorkLogEntry["toolStatus"] = "completed"): WorkLogEntry {
  return {
    id,
    label: id,
    tone: "tool",
    createdAt: "2026-07-29T00:00:00.000Z",
    toolStatus,
  };
}

function messageRow(overrides: Partial<MessageTranscriptRow> = {}): MessageTranscriptRow {
  return {
    kind: "message",
    id: "message-row",
    createdAt: "2026-07-29T00:00:00.000Z",
    message: {
      id: "assistant-message",
      role: "assistant",
      text: "answer",
      createdAt: "2026-07-29T00:00:00.000Z",
      turnId: null,
      streaming: false,
    },
    durationStart: "2026-07-29T00:00:00.000Z",
    showAssistantCopyButton: true,
    assistantCopyStreaming: false,
    ...overrides,
  } as MessageTranscriptRow;
}

describe("resolveMessageWorkPlacement", () => {
  it("keeps leading and inline work attached to a live assistant message", () => {
    const leading = entry("leading");
    const inline = entry("inline", "running");
    const placement = resolveMessageWorkPlacement(
      messageRow({ leadingWorkEntries: [leading], inlineWorkEntries: [inline] }),
    );

    expect(placement.hasCollapsedWork).toBe(false);
    expect(placement.leadingWorkEntries).toEqual([leading]);
    expect(placement.inlineWorkEntries).toEqual([inline]);
  });

  it("uses the settled collapsed turn as the single work presentation", () => {
    const collapsed = entry("collapsed");
    const placement = resolveMessageWorkPlacement(
      messageRow({
        leadingWorkEntries: [entry("leading")],
        inlineWorkEntries: [entry("inline")],
        collapsedTurnItems: [{ kind: "work", id: collapsed.id, entry: collapsed }],
      }),
    );

    expect(placement.hasCollapsedWork).toBe(true);
    expect(placement.collapsedTurnItems).toHaveLength(1);
    expect(placement.leadingWorkEntries).toEqual([]);
    expect(placement.inlineWorkEntries).toEqual([]);
  });
});

describe("estimateTranscriptRowMainAxisSize", () => {
  it("keeps short messages at the established row minimum", () => {
    expect(estimateTranscriptRowMainAxisSize(messageRow())).toBe(100);
    expect(
      estimateTranscriptRowMainAxisSize(
        messageRow({
          message: { ...messageRow().message, role: "user", text: "" },
        }),
      ),
    ).toBe(100);
  });

  it("gives long multiline Markdown enough virtual-list height", () => {
    const text = Array.from(
      { length: 120 },
      (_, index) => `${index + 1}. **Streaming output stays ordered.**`,
    ).join("\n");

    expect(
      estimateTranscriptRowMainAxisSize(messageRow({ message: { ...messageRow().message, text } })),
    ).toBeGreaterThan(5_000);
  });

  it("scales wrapping and line height with the configured chat font size", () => {
    const row = messageRow({
      message: {
        ...messageRow().message,
        text: "Configured transcript typography remains aligned with virtualization. ".repeat(12),
      },
    });

    expect(estimateTranscriptRowMainAxisSize(row, 20)).toBeGreaterThan(
      estimateTranscriptRowMainAxisSize(row, 11),
    );
  });
});

describe("transcriptRowVersion", () => {
  it("changes for streaming text and attached work status updates", () => {
    const running = messageRow({
      message: { ...messageRow().message, text: "", streaming: true },
      inlineWorkEntries: [entry("tool", "running")],
    });
    const completed = messageRow({
      message: { ...running.message, text: "done", streaming: false },
      inlineWorkEntries: [entry("tool", "completed")],
    });

    expect(transcriptRowVersion(running)).not.toBe(transcriptRowVersion(completed));
  });

  it("changes for standalone work status updates", () => {
    const row = (toolStatus: WorkLogEntry["toolStatus"]): ThreadTranscriptRow =>
      ({
        kind: "work",
        id: "work-row",
        createdAt: "2026-07-29T00:00:00.000Z",
        groupedEntries: [entry("tool", toolStatus)],
      }) as ThreadTranscriptRow;

    expect(transcriptRowVersion(row("running"))).not.toBe(transcriptRowVersion(row("completed")));
  });
});
