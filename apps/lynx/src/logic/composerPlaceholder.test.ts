import { describe, expect, it } from "@rstest/core";

import {
  DEFAULT_CHAT_COMPOSER_PLACEHOLDER,
  resolveChatComposerPlaceholder,
  resolveEmptyComposerEditorMinHeightPx,
  resolveSessionPhase,
} from "./composerPlaceholder";

describe("composer placeholder", () => {
  it("describes the shared mention and slash-command affordances", () => {
    expect(DEFAULT_CHAT_COMPOSER_PLACEHOLDER).toBe(
      "Ask anything, @tag files/folders, or use / to show available commands",
    );
  });

  it("reserves the wrapped placeholder height across pane widths", () => {
    expect(
      resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 1024, chatFontSizePx: 18 }),
    ).toBe(39);
    expect(
      resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 328, chatFontSizePx: 18 }),
    ).toBe(58.5);
    expect(
      resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 192, chatFontSizePx: 18 }),
    ).toBe(117);
    expect(resolveEmptyComposerEditorMinHeightPx({ availableWidthPx: 0, chatFontSizePx: 18 })).toBe(
      39,
    );
  });
});

describe("resolveChatComposerPlaceholder", () => {
  const idle = {
    approvalPending: false,
    pendingQuestion: null,
    planFollowUp: false,
    subagent: false,
    phase: "ready",
  } as const;

  it("prefers pending interactions over the session phase", () => {
    expect(resolveChatComposerPlaceholder({ ...idle, approvalPending: true })).toBe(
      "Resolve this approval request to continue",
    );
    expect(resolveChatComposerPlaceholder({ ...idle, pendingQuestion: { freeform: true } })).toBe(
      "Type your answer to continue",
    );
    expect(resolveChatComposerPlaceholder({ ...idle, pendingQuestion: { freeform: false } })).toBe(
      "Type your own answer, or leave this blank to use the selected option",
    );
    expect(resolveChatComposerPlaceholder({ ...idle, subagent: true })).toBe(
      "Message this subagent while it works",
    );
  });

  it("follows the session phase for an ordinary thread", () => {
    expect(resolveChatComposerPlaceholder({ ...idle, phase: "running" })).toBe(
      "Ask for follow-up changes",
    );
    expect(resolveChatComposerPlaceholder({ ...idle, phase: "disconnected" })).toBe(
      "Ask for follow-up changes or attach images",
    );
    expect(resolveChatComposerPlaceholder(idle)).toBe(DEFAULT_CHAT_COMPOSER_PLACEHOLDER);
  });

  it("reads a missing or closed session as disconnected", () => {
    expect(
      [null, "closed", "connecting", "running", "ready", "error"].map(resolveSessionPhase),
    ).toEqual(["disconnected", "disconnected", "connecting", "running", "ready", "ready"]);
  });

  it("maps raw orchestration statuses the way the web store's legacy mapping does", () => {
    expect(
      ["idle", "stopped", "starting", "running", "ready", "interrupted", "error"].map(
        resolveSessionPhase,
      ),
    ).toEqual(["disconnected", "disconnected", "connecting", "running", "ready", "ready", "ready"]);
  });
});
