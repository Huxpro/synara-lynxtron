import { describe, expect, it } from "@rstest/core";

import {
  buildComposerSendText,
  buildComposerInteractionModeSetCommand,
  buildComposerRuntimeModeSetCommand,
  buildComposerTurnInterruptCommand,
  buildComposerTurnStartCommand,
  isConnectingComposerSession,
  isRunningComposerSession,
  runComposerSendTransaction,
} from "./composerDispatch.logic";
import { createPastedTextDraft } from "@synara-web/lib/composerPastedText";

describe("composer dispatch logic", () => {
  it("materializes terminal context placeholders into the canonical send block", () => {
    expect(
      buildComposerSendText({
        prompt: "\uFFFC Explain the failure",
        pastedTexts: [],
        fileComments: [],
        terminalContexts: [
          {
            terminalId: "terminal-1",
            terminalLabel: "Terminal 1",
            lineStart: 7,
            lineEnd: 8,
            text: "error: failed\nexit 1",
          },
        ],
      }),
    ).toBe(
      "@terminal-1:7-8 Explain the failure\n\n<terminal_context>\n- Terminal 1 lines 7-8:\n  7 | error: failed\n  8 | exit 1\n</terminal_context>",
    );
  });

  it("serializes file comments into the canonical prompt block on send", () => {
    expect(
      buildComposerSendText({
        prompt: "Please review",
        pastedTexts: [
          createPastedTextDraft({
            id: "paste-1",
            createdAt: "2026-08-10T00:00:00.000Z",
            text: "context",
          }),
        ],
        fileComments: [
          {
            path: "src/example.ts",
            startLine: 5,
            endLine: 5,
            text: "Rename this exported constant.",
          },
        ],
      }),
    ).toBe(
      'Please review\n\n<pasted_text>\n[{"text":"context"}]\n</pasted_text>\n\n<file_comments>\n- src/example.ts line 5:\n  Rename this exported constant.\n</file_comments>',
    );
  });

  it("matches Web connecting versus interruptible session states", () => {
    expect(isConnectingComposerSession("starting")).toBe(true);
    expect(isConnectingComposerSession("running")).toBe(false);
    expect(isRunningComposerSession("starting")).toBe(false);
    expect(isRunningComposerSession("running")).toBe(true);
    expect(isRunningComposerSession("ready")).toBe(false);
    expect(isRunningComposerSession(null)).toBe(false);
  });

  it("builds the real thread interaction-mode command", () => {
    expect(
      buildComposerInteractionModeSetCommand({
        commandId: "command-plan",
        createdAt: "2026-07-29T08:00:00.000Z",
        interactionMode: "plan",
        threadId: "thread-1",
      }),
    ).toEqual({
      type: "thread.interaction-mode.set",
      commandId: "command-plan",
      threadId: "thread-1",
      interactionMode: "plan",
      createdAt: "2026-07-29T08:00:00.000Z",
    });
  });

  it("builds the real thread runtime-mode command", () => {
    expect(
      buildComposerRuntimeModeSetCommand({
        commandId: "command-access",
        createdAt: "2026-07-29T08:01:00.000Z",
        runtimeMode: "approval-required",
        threadId: "thread-1",
      }),
    ).toEqual({
      type: "thread.runtime-mode.set",
      commandId: "command-access",
      threadId: "thread-1",
      runtimeMode: "approval-required",
      createdAt: "2026-07-29T08:01:00.000Z",
    });
  });

  it("builds the same orchestration turn-start shape used by Web", () => {
    expect(
      buildComposerTurnStartCommand({
        assistantDeliveryMode: "streaming",
        commandId: "command-1",
        createdAt: "2026-07-29T12:00:00.000Z",
        interactionMode: "default",
        messageId: "message-1",
        modelSelection: { provider: "opencode", model: "deepseek-v4-flash-free" },
        mentions: [
          {
            name: "Release prep",
            path: "thread://thread-2",
          },
        ],
        skills: [
          {
            name: "review",
            path: "/workspace/.codex/skills/review/SKILL.md",
          },
        ],
        runtimeMode: "full-access",
        text: "Ship it",
        threadId: "thread-1",
      }),
    ).toEqual({
      type: "thread.turn.start",
      commandId: "command-1",
      threadId: "thread-1",
      message: {
        messageId: "message-1",
        role: "user",
        text: "Ship it",
        attachments: [],
        mentions: [
          {
            name: "Release prep",
            path: "thread://thread-2",
          },
        ],
        skills: [
          {
            name: "review",
            path: "/workspace/.codex/skills/review/SKILL.md",
          },
        ],
      },
      modelSelection: { provider: "opencode", model: "deepseek-v4-flash-free" },
      runtimeMode: "full-access",
      interactionMode: "default",
      // Without it the server buffers the reply and Native shows no live text.
      assistantDeliveryMode: "streaming",
      createdAt: "2026-07-29T12:00:00.000Z",
    });
  });

  it("preserves runtime trait options in the turn model selection", () => {
    const command = buildComposerTurnStartCommand({
      assistantDeliveryMode: "streaming",
      commandId: "command-1",
      createdAt: "2026-07-29T12:00:00.000Z",
      interactionMode: "default",
      messageId: "message-1",
      modelSelection: {
        provider: "codex",
        model: "gpt-5.6-sol",
        options: { reasoningEffort: "high", fastMode: true },
      },
      runtimeMode: "full-access",
      text: "Reply with only TRAIT-OK.",
      threadId: "thread-1",
    });

    expect(command).toMatchObject({
      type: "thread.turn.start",
      modelSelection: {
        provider: "codex",
        model: "gpt-5.6-sol",
        options: { reasoningEffort: "high", fastMode: true },
      },
    });
  });

  it("carries server-staged file attachments into the real turn command", () => {
    const command = buildComposerTurnStartCommand({
      assistantDeliveryMode: "streaming",
      attachments: [
        {
          type: "file",
          id: "attachment-1",
          name: "notes.txt",
          mimeType: "text/plain",
          sizeBytes: 12,
        },
      ],
      commandId: "command-attachment",
      createdAt: "2026-07-29T12:00:00.000Z",
      interactionMode: "default",
      messageId: "message-attachment",
      modelSelection: { provider: "opencode", model: "deepseek-v4-flash-free" },
      runtimeMode: "full-access",
      text: "Read this file",
      threadId: "thread-1",
    });

    expect(command).toMatchObject({
      type: "thread.turn.start",
      message: {
        attachments: [
          {
            type: "file",
            id: "attachment-1",
            name: "notes.txt",
            mimeType: "text/plain",
            sizeBytes: 12,
          },
        ],
      },
    });
  });

  it("carries assistant message references into the canonical turn command", () => {
    const command = buildComposerTurnStartCommand({
      assistantDeliveryMode: "streaming",
      attachments: [
        {
          type: "assistant-selection",
          id: "selection-1",
          assistantMessageId: "assistant-message-1",
          text: "The complete assistant response.",
        },
      ],
      commandId: "command-selection",
      createdAt: "2026-08-08T12:00:00.000Z",
      interactionMode: "default",
      messageId: "message-selection",
      modelSelection: { provider: "codex", model: "gpt-5.6-sol" },
      runtimeMode: "full-access",
      text: "Continue from this response",
      threadId: "thread-1",
    });

    expect(command).toMatchObject({
      type: "thread.turn.start",
      message: {
        attachments: [
          {
            type: "assistant-selection",
            id: "selection-1",
            assistantMessageId: "assistant-message-1",
            text: "The complete assistant response.",
          },
        ],
      },
    });
  });

  it("includes the active turn id only when the server exposes one", () => {
    const base = {
      commandId: "command-1",
      createdAt: "2026-07-29T12:00:00.000Z",
      threadId: "thread-1",
    };
    expect(buildComposerTurnInterruptCommand({ ...base, activeTurnId: "turn-1" })).toMatchObject({
      type: "thread.turn.interrupt",
      turnId: "turn-1",
    });
    expect(buildComposerTurnInterruptCommand({ ...base, activeTurnId: null })).not.toHaveProperty(
      "turnId",
    );
  });

  it("clears the draft only after a successful dispatch", async () => {
    const calls: string[] = [];

    await runComposerSendTransaction({
      prepare: () => {
        calls.push("prepare");
      },
      dispatch: async () => {
        calls.push("dispatch");
      },
      clearDraft: () => {
        calls.push("clear");
      },
      onSucceeded: () => {
        calls.push("succeeded");
      },
    });

    expect(calls).toEqual(["prepare", "dispatch", "clear", "succeeded"]);
  });

  it("retains the draft and structured context when dispatch fails", async () => {
    const calls: string[] = [];
    const error = new Error("dispatch failed");

    await expect(
      runComposerSendTransaction({
        dispatch: async () => {
          calls.push("dispatch");
          throw error;
        },
        clearDraft: () => {
          calls.push("clear");
        },
        onSucceeded: () => {
          calls.push("succeeded");
        },
      }),
    ).rejects.toBe(error);

    expect(calls).toEqual(["dispatch"]);
  });
});
