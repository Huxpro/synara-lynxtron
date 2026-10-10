import type {
  ChatAssistantSelectionAttachment,
  ClientOrchestrationCommand,
  ModelSelection,
  RuntimeMode,
  ThreadEnvironmentMode,
} from "@synara/contracts";
import { MessageId } from "@synara/contracts";
import { TRANSCRIPT_SELECTION_ACTION_HEIGHT_PX } from "../logic/selectionActionLayout";
import type { TranscriptAssistantSelection } from "@synara-web/components/chat/chatSelectionActions";
import { createAssistantSelectionAttachment } from "@synara-web/lib/assistantSelections";

/** Electron's selectionChat `requireSelection`: the attachment, or the reason there is none. */
export function requireSelectionAttachment(
  selection: TranscriptAssistantSelection,
): ChatAssistantSelectionAttachment {
  const attachment = createAssistantSelectionAttachment(selection);
  if (!attachment) throw new Error("Select between 1 and 4,000 characters.");
  return {
    ...attachment,
    assistantMessageId: MessageId.makeUnsafe(attachment.assistantMessageId),
  };
}

/** The new chat a selection opens: a regular project thread, like a landing "New chat". */
export function buildSelectionChatCreateCommand(input: {
  readonly commandId: string;
  readonly createdAt: string;
  readonly threadId: string;
  readonly projectId: string;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: RuntimeMode;
  readonly envMode: ThreadEnvironmentMode;
  readonly branch: string | null;
}): Extract<ClientOrchestrationCommand, { type: "thread.create" }> {
  return {
    type: "thread.create",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    projectId: input.projectId as never,
    title: "New chat",
    modelSelection: input.modelSelection,
    runtimeMode: input.runtimeMode,
    interactionMode: "default",
    envMode: input.envMode,
    branch: input.branch,
    worktreePath: null,
    createdAt: input.createdAt,
  };
}

/**
 * Electron's SelectionNewChatComposer placement: it opens where the toolbar stood, growing
 * upward from the toolbar's bottom edge when the toolbar sat above the selection, and stays
 * 8px inside the viewport.
 */
export function resolveSelectionChatComposerPosition(input: {
  readonly anchor: {
    readonly left: number;
    readonly top: number;
    readonly placement: "top" | "bottom";
  };
  readonly size: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
}): { readonly left: number; readonly top: number } {
  const top =
    input.anchor.placement === "top"
      ? input.anchor.top + TRANSCRIPT_SELECTION_ACTION_HEIGHT_PX - input.size.height
      : input.anchor.top;
  return {
    left: Math.max(8, Math.min(input.anchor.left, input.viewport.width - input.size.width - 8)),
    top: Math.max(8, Math.min(top, input.viewport.height - input.size.height - 8)),
  };
}
