import { describe, expect, it, rs } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import type { ComponentProps } from "@lynx-js/react";
import { TranscriptRowContent } from "./Transcript";
import { recordTranscriptProfileRow } from "./transcriptProfile.lynx";

rs.mock("./transcriptProfile.lynx", () => ({
  recordTranscriptProfileRow: rs.fn(),
  useTranscriptProfile: () => undefined,
}));

function rowProps(): ComponentProps<typeof TranscriptRowContent> {
  return {
    row: { kind: "working", id: "history-row", createdAt: "2026-10-11T00:00:00Z" } as never,
    threadId: "thread",
    editDraft: "",
    editError: null,
    editingMessageId: null,
    editSubmitting: false,
    editableMessageId: null,
    selectedAssistantMessageId: null,
    textSelection: null,
    chatFontSizePx: 13,
    pinned: false,
    onCancelEdit: rs.fn(),
    onEditDraftChange: rs.fn(),
    onStartEdit: rs.fn(),
    onSubmitEdit: rs.fn(),
    onTextSelectionChange: rs.fn(),
    timestampFormat: "locale",
    selectionViewport: { left: 0, top: 0, width: 100, height: 100 },
    workspaceRoot: null,
  };
}

describe("transcript row memo", () => {
  it("skips unchanged history while honoring changed row, typography, pin and event props", () => {
    rs.mocked(recordTranscriptProfileRow).mockClear();
    const props = rowProps();
    const view = render(<TranscriptRowContent {...props} />);
    expect(recordTranscriptProfileRow).toHaveBeenCalledTimes(1);
    view.rerender(<TranscriptRowContent {...props} />);
    expect(recordTranscriptProfileRow).toHaveBeenCalledTimes(1);
    for (const change of [
      { row: { ...props.row, id: "updated-row" } },
      { chatFontSizePx: 16 },
      { pinned: true },
      { onStartEdit: rs.fn() },
    ]) {
      Object.assign(props, change);
      view.rerender(<TranscriptRowContent {...props} />);
    }
    expect(recordTranscriptProfileRow).toHaveBeenCalledTimes(5);
  });
});
