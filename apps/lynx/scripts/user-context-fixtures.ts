// Shared source for the paired fixture and its parser contract tests.
import { MessageId } from "@synara/contracts";
import { appendAssistantSelectionsToPrompt } from "../../web/src/lib/assistantSelections";
import { appendPastedTextsToPrompt } from "../../web/src/lib/composerPastedText";
import { appendPullRequestContextsToPrompt } from "../../web/src/lib/pullRequestContext";
import { appendBrowserAnnotationsToPrompt } from "../../web/src/lib/browserAnnotations";
import { appendTerminalContextsToPrompt } from "../../web/src/lib/terminalContext";
const createdAt = "2026-10-11T00:00:00.000Z";
const cases = ["terminal", "paste", "pull-request", "browser-annotation", "selection"] as const;
export function createUserContextFixtures(tag = "") {
  return cases.map((kind) => {
    const messageId = MessageId.makeUnsafe(`chat-84-${kind}${tag ? "-" + tag : ""}-message`),
      prompt = `CHAT-84 ${kind}: Inspect this context.`;
    let text = prompt;
    if (kind === "terminal")
      text = appendTerminalContextsToPrompt(prompt, [
        {
          terminalId: "terminal84",
          terminalLabel: "Terminal 1",
          lineStart: 2,
          lineEnd: 3,
          text: "npm test\nAll tests passed.",
        },
      ]);
    if (kind === "paste")
      text = appendPastedTextsToPrompt(prompt, [
        { text: "Configuration excerpt\nmode = reliable\nretry = enabled" },
      ]);
    if (kind === "pull-request")
      text = appendPullRequestContextsToPrompt(prompt, [
        {
          id: "context84",
          createdAt,
          scope: "checks",
          prNumber: 84,
          prUrl: "https://github.com/example/repo/pull/84",
          title: "One failing check",
          subtitle: "Unit tests",
          text: "Inspect the failing unit test.\nKeep existing behavior.",
        },
      ]);
    if (kind === "browser-annotation")
      text = appendBrowserAnnotationsToPrompt(
        prompt,
        [
          {
            id: "annotation84",
            ordinal: 1,
            tabId: "tab84",
            source: { url: "https://example.com/", pageTitle: "Fixture page" },
            selector: "#save",
            tagName: "button",
            role: "button",
            name: "Save",
            text: "Save",
            fingerprint: "save-button",
            comment: "Inspect this control",
            capturedAt: createdAt,
          },
        ],
        messageId,
      );
    if (kind === "selection")
      text = appendAssistantSelectionsToPrompt(prompt, [
        {
          assistantMessageId: MessageId.makeUnsafe("quoted84"),
          text: "Keep the existing cancellation behavior.",
        },
      ]);
    return { kind, threadId: `chat-84-${kind}${tag ? "-" + tag : ""}`, messageId, prompt, text };
  });
}
export const USER_CONTEXT_FIXTURES = createUserContextFixtures();
