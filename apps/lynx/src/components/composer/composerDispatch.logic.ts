import type {
  AssistantDeliveryMode,
  ChatAttachment,
  ClientOrchestrationCommand,
  ModelSelection,
  ProviderInteractionMode,
  ProviderMentionReference,
  ProviderSkillReference,
  RuntimeMode,
} from "@synara/contracts";
import {
  appendPastedTextsToPrompt,
  type PastedTextDraft,
} from "@synara-web/lib/composerPastedText";
import {
  appendFileCommentsToPrompt,
  type FileCommentSelection,
} from "@synara-web/lib/fileComments";
import {
  appendTerminalContextsToPrompt,
  type TerminalContextSelection,
} from "@synara-web/lib/terminalContext";

export function buildComposerSendText(input: {
  readonly fileComments: ReadonlyArray<FileCommentSelection>;
  readonly pastedTexts: ReadonlyArray<PastedTextDraft>;
  readonly terminalContexts?: ReadonlyArray<TerminalContextSelection>;
  readonly prompt: string;
}): string {
  return appendFileCommentsToPrompt(
    appendPastedTextsToPrompt(
      appendTerminalContextsToPrompt(input.prompt, input.terminalContexts ?? []),
      input.pastedTexts,
    ),
    input.fileComments,
  ).trim();
}

export function isRunningComposerSession(status: string | null): boolean {
  return status === "running";
}

export function isConnectingComposerSession(status: string | null): boolean {
  return status === "starting";
}

export async function runComposerSendTransaction(input: {
  readonly clearDraft: () => void;
  readonly dispatch: () => Promise<void>;
  readonly onSucceeded?: () => void | Promise<void>;
  readonly prepare?: () => void | Promise<void>;
}): Promise<void> {
  await input.prepare?.();
  await input.dispatch();
  input.clearDraft();
  await input.onSucceeded?.();
}

export function buildComposerTurnStartCommand(input: {
  /** Omitting it makes the server buffer the reply (no live text), so it is required. */
  readonly assistantDeliveryMode: AssistantDeliveryMode;
  readonly attachments?: ReadonlyArray<ChatAttachment>;
  readonly commandId: string;
  readonly createdAt: string;
  readonly interactionMode: ProviderInteractionMode;
  readonly messageId: string;
  readonly modelSelection: ModelSelection;
  readonly mentions?: ReadonlyArray<ProviderMentionReference>;
  readonly skills?: ReadonlyArray<ProviderSkillReference>;
  readonly runtimeMode: RuntimeMode;
  readonly text: string;
  readonly threadId: string;
}): ClientOrchestrationCommand {
  return {
    type: "thread.turn.start",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    message: {
      messageId: input.messageId as never,
      role: "user",
      text: input.text,
      attachments: input.attachments ? [...input.attachments] : [],
      ...(input.mentions && input.mentions.length > 0 ? { mentions: [...input.mentions] } : {}),
      ...(input.skills && input.skills.length > 0 ? { skills: [...input.skills] } : {}),
    },
    modelSelection: input.modelSelection,
    runtimeMode: input.runtimeMode,
    interactionMode: input.interactionMode,
    assistantDeliveryMode: input.assistantDeliveryMode,
    createdAt: input.createdAt as never,
  };
}

export function buildComposerTurnInterruptCommand(input: {
  readonly activeTurnId: string | null;
  readonly commandId: string;
  readonly createdAt: string;
  readonly threadId: string;
}): ClientOrchestrationCommand {
  return {
    type: "thread.turn.interrupt",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    ...(input.activeTurnId ? { turnId: input.activeTurnId as never } : {}),
    createdAt: input.createdAt as never,
  };
}

export function buildComposerInteractionModeSetCommand(input: {
  readonly commandId: string;
  readonly createdAt: string;
  readonly interactionMode: ProviderInteractionMode;
  readonly threadId: string;
}): ClientOrchestrationCommand {
  return {
    type: "thread.interaction-mode.set",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    interactionMode: input.interactionMode,
    createdAt: input.createdAt as never,
  };
}

export function buildComposerRuntimeModeSetCommand(input: {
  readonly commandId: string;
  readonly createdAt: string;
  readonly runtimeMode: RuntimeMode;
  readonly threadId: string;
}): ClientOrchestrationCommand {
  return {
    type: "thread.runtime-mode.set",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    runtimeMode: input.runtimeMode,
    createdAt: input.createdAt as never,
  };
}
