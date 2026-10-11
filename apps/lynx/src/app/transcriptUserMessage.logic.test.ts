import { describe, expect, it } from "@rstest/core";
import { appendAssistantSelectionsToPrompt } from "@synara-web/lib/assistantSelections";
import { appendPastedTextsToPrompt } from "@synara-web/lib/composerPastedText";
import { appendPullRequestContextsToPrompt } from "@synara-web/lib/pullRequestContext";
import { appendBrowserAnnotationsToPrompt } from "@synara-web/lib/browserAnnotations";
import { appendTerminalContextsToPrompt } from "@synara-web/lib/terminalContext";
import {
  IMAGE_ONLY_BOOTSTRAP_PROMPT,
  IMAGE_ONLY_VISIBLE_PLACEHOLDER,
} from "@synara-web/lib/terminalContext";
import { MessageId } from "@synara/contracts";
import { resolveTranscriptUserMessage } from "./transcriptUserMessage.logic";
import { projectThreadTranscriptRows } from "./threadPageProjection.logic";
import { makeThread } from "@synara-web/storeTestFixtures";
const id = MessageId.makeUnsafe("context84");
describe("upstream visible user messages on Native", () => {
  it("strips all five context transports from the cached and rendered body while retaining their cards", () => {
    let text = appendAssistantSelectionsToPrompt("Inspect context", [
      { assistantMessageId: MessageId.makeUnsafe("assistant"), text: "quoted answer" },
    ]);
    text = appendTerminalContextsToPrompt(text, [
      {
        terminalId: "terminal",
        terminalLabel: "Terminal 1",
        lineStart: 2,
        lineEnd: 3,
        text: "output",
      },
    ]);
    text = appendPastedTextsToPrompt(text, [{ text: "pasted\ntext" }]);
    text = appendPullRequestContextsToPrompt(text, [
      {
        id: "pr",
        createdAt: "2026-10-11T00:00:00Z",
        scope: "checks",
        prNumber: 84,
        prUrl: "https://github.com/example/repo/pull/84",
        title: "One failing check",
        subtitle: "Tests",
        text: "Check failure details",
      },
    ]);
    text = appendBrowserAnnotationsToPrompt(
      text,
      [
        {
          id: "annotation",
          ordinal: 1,
          tabId: "tab",
          source: { url: "https://example.com/", pageTitle: "Page" },
          selector: "#save",
          tagName: "button",
          role: "button",
          name: "Save",
          text: "Save",
          fingerprint: "save",
          comment: "Inspect this",
          capturedAt: "2026-10-11T00:00:00Z",
        },
      ],
      id,
    );
    const message = {
      id,
      text,
      role: "user" as const,
      turnId: null,
      streaming: false,
      createdAt: "2026-10-11T00:00:00Z",
    };
    const state = resolveTranscriptUserMessage(message);
    expect(state.displayed.visibleText).toBe("Inspect context");
    expect(state.displayed.copyText).toBe("Inspect context");
    expect(state.markdownText).toBe("@terminal-1:2-3 Inspect context");
    expect(state.assistantSelections).toHaveLength(1);
    for (const entries of [
      state.displayed.contexts,
      state.displayed.pastedTexts,
      state.displayed.pullRequestContexts,
      state.displayed.browserAnnotations,
    ])
      expect(entries).toHaveLength(1);
    const rows = projectThreadTranscriptRows(makeThread({ messages: [message] }));
    const row = rows.find((r) => r.kind === "message");
    expect(JSON.stringify(row?.markdownTree)).toContain("@terminal-1:2-3 Inspect context");
    expect(JSON.stringify(row?.markdownTree)).not.toMatch(
      /browser_annotations|pasted_text|assistant_selection|pull_request_context/,
    );
  });
  it("uses persisted selections over legacy embedded selections and hides attachment-only bootstrap text", () => {
    const text = appendAssistantSelectionsToPrompt("Hello", [
      { assistantMessageId: MessageId.makeUnsafe("a"), text: "legacy" },
    ]);
    const selections = [
      {
        type: "assistant-selection" as const,
        id: "selection",
        assistantMessageId: MessageId.makeUnsafe("a"),
        text: "persisted",
      },
    ];
    expect(
      resolveTranscriptUserMessage({ id, text, attachments: selections }).assistantSelections.map(
        (s) => s.text,
      ),
    ).toEqual(["persisted"]);
    const bootstrap = resolveTranscriptUserMessage({
      id,
      text: IMAGE_ONLY_BOOTSTRAP_PROMPT,
      attachments: selections,
    });
    expect(bootstrap.displayed.visibleText).toBe(IMAGE_ONLY_VISIBLE_PLACEHOLDER);
    expect(bootstrap.displayed.copyText).toBe("");
    expect(bootstrap.showText).toBe(true);
    expect(bootstrap.assistantSelections).toEqual(selections);
  });
});
