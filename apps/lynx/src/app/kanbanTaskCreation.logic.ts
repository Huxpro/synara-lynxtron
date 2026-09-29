import type {
  ClientOrchestrationCommand,
  ModelSelection,
  ProjectId,
  ProviderInteractionMode,
  RuntimeMode,
} from "@synara/contracts";
import { buildPromptThreadTitleFallback } from "@synara/shared/chatThreads";

export function createNativeKanbanTaskId(kind: "command" | "message" | "thread"): string {
  "background only";
  return `lynx-kanban-task-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildNativeKanbanTaskCreateCommand(input: {
  readonly commandId: string;
  readonly createdAt: string;
  readonly modelSelection: ModelSelection;
  readonly envMode: "local" | "worktree";
  readonly interactionMode?: ProviderInteractionMode;
  readonly projectId: ProjectId;
  readonly prompt: string;
  readonly runtimeMode?: RuntimeMode;
  readonly threadId: string;
}): Extract<ClientOrchestrationCommand, { type: "thread.create" }> {
  const title = buildPromptThreadTitleFallback(input.prompt);
  return {
    type: "thread.create",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    projectId: input.projectId,
    title,
    modelSelection: input.modelSelection,
    runtimeMode: input.runtimeMode ?? "full-access",
    interactionMode: input.interactionMode ?? "default",
    envMode: input.envMode,
    branch: null,
    worktreePath: null,
    createdAt: input.createdAt as never,
  };
}
