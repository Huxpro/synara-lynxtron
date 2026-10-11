import type { ChatMessage } from "@synara-web/types";
import { deriveDisplayedUserMessageState } from "@synara-web/lib/terminalContext";
import { resolveUserMessageMarkdownText } from "@synara-web/components/chat/userMessageTerminalContexts";

/** One display projection for both cached markdown and Native transcript chrome. */
export function resolveTranscriptUserMessage(
  message: Pick<ChatMessage, "id" | "text" | "attachments">,
) {
  const selections = (message.attachments ?? []).filter(
    (attachment) => attachment.type === "assistant-selection",
  );
  const displayed = deriveDisplayedUserMessageState(message.text, {
    messageId: message.id,
    hideImageOnlyBootstrapPrompt: (message.attachments ?? []).some((attachment) =>
      ["image", "file", "assistant-selection"].includes(attachment.type),
    ),
  });
  return {
    displayed,
    markdownText: resolveUserMessageMarkdownText(displayed.visibleText, displayed.contexts),
    assistantSelections: selections.length
      ? selections
      : displayed.assistantSelections.map((selection, index) => ({
          type: "assistant-selection" as const,
          id: `fallback-selection-${message.id}-${index}`,
          assistantMessageId: selection.assistantMessageId,
          text: selection.text,
        })),
    showText: displayed.visibleText.trim().length > 0 || displayed.contexts.length > 0,
  };
}
