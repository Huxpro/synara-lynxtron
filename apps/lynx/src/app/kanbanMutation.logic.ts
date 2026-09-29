import type {
  AssistantDeliveryMode,
  ClientOrchestrationCommand,
  ModelSelection,
  ProviderInteractionMode,
  RuntimeMode,
} from "@synara/contracts";

import { buildComposerTurnStartCommand } from "../components/composer/composerDispatch.logic";

export function buildNativeKanbanStartCommand(input: {
  readonly assistantDeliveryMode: AssistantDeliveryMode;
  readonly commandId: string;
  readonly createdAt: string;
  readonly interactionMode: ProviderInteractionMode;
  readonly messageId: string;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: RuntimeMode;
  readonly text: string;
  readonly threadId: string;
}): ClientOrchestrationCommand {
  return buildComposerTurnStartCommand(input);
}

export function buildNativeKanbanRenameCommand(input: {
  readonly commandId: string;
  readonly threadId: string;
  readonly title: string;
}): ClientOrchestrationCommand {
  return {
    type: "thread.meta.update",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    title: input.title,
  };
}

export function buildNativeKanbanArchiveCommand(input: {
  readonly commandId: string;
  readonly threadId: string;
}): ClientOrchestrationCommand {
  return {
    type: "thread.archive",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
  };
}

export function resolveNativeKanbanMutationError(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : "The server did not accept the change.";
}
