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

/**
 * One send attempt over a draft, as upstream's submission path owns it
 * (`chat/useChatTurnSubmission.ts`, `chat/useChatTurnExecution.ts`):
 *
 * 1. the outgoing draft is taken out of the composer before anything asynchronous, so
 *    whatever the user types while the attempt runs (a handoff can wait for a provider
 *    to start) is a new draft the attempt never touches;
 * 2. on success nothing is cleared: what is in the composer by then is newer;
 * 3. on failure the taken draft goes back, unless the user has started a newer one, in
 *    which case the newer one stays and the taken draft's resources are discarded.
 *
 * `take`/`restore` act on the draft store by thread id, not on a mounted composer, so an
 * attempt that outlives its composer (the user navigated away and back) behaves the same.
 * Resolves "empty" when there was nothing to send; rejects with the send's error.
 */
export async function runComposerOutgoingSend<Draft>(input: {
  readonly take: () => Draft | null;
  readonly send: (draft: Draft) => Promise<void>;
  readonly restore: (draft: Draft) => boolean;
  /** The failed draft was not restored: release what only it owned (picked-file tokens). */
  readonly discard?: (draft: Draft) => void | Promise<void>;
  readonly onSucceeded?: () => void | Promise<void>;
}): Promise<"sent" | "empty"> {
  const outgoing = input.take();
  if (outgoing === null) return "empty";
  try {
    await input.send(outgoing);
  } catch (error) {
    if (!input.restore(outgoing)) {
      await Promise.resolve(input.discard?.(outgoing)).catch(() => undefined);
    }
    throw error;
  }
  await input.onSucceeded?.();
  return "sent";
}

/**
 * The order upstream's send keeps (`chat/useChatTurnExecution.ts`): attachments are staged
 * first, then the thread is handed off when the send needs it, then the turn is dispatched.
 * A file that cannot be uploaded therefore never leaves the thread on another provider, and
 * the staged uploads' cleanup scope (`runWithDispatch`) covers both the handoff wait and
 * the dispatch: a failure in either cancels them.
 */
export async function dispatchComposerTurnAfterStaging<Attachments, Result>(input: {
  readonly stage: () => Promise<{
    readonly runWithDispatch: <A>(dispatch: (attachments: Attachments) => Promise<A>) => Promise<A>;
  }>;
  readonly handOff: () => Promise<void>;
  readonly dispatch: (attachments: Attachments) => Promise<Result>;
}): Promise<Result> {
  const staged = await input.stage();
  return staged.runWithDispatch(async (attachments) => {
    await input.handOff();
    return input.dispatch(attachments);
  });
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
