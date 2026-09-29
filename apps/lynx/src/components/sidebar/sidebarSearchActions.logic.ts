import { type ClientOrchestrationCommand, type ModelSelection } from "@synara/contracts";
import { getDefaultModel } from "@synara/shared/model";
import { newCommandId, newProjectId, newThreadId } from "@synara-web/lib/utils";

export function buildNativeSearchProjectCreateCommand(input: {
  readonly workspaceRoot: string;
  readonly createIfMissing: boolean;
  readonly defaultProvider: ModelSelection["provider"];
}): Extract<ClientOrchestrationCommand, { type: "project.create" }> {
  const workspaceRoot = input.workspaceRoot.trim();
  const title =
    workspaceRoot
      .replace(/[\\/]+$/, "")
      .split(/[\\/]/)
      .filter(Boolean)
      .at(-1) ?? workspaceRoot;
  return {
    type: "project.create",
    commandId: newCommandId(),
    projectId: newProjectId(),
    title,
    workspaceRoot,
    createWorkspaceRootIfMissing: input.createIfMissing,
    defaultModelSelection: {
      provider: input.defaultProvider,
      model: getDefaultModel(input.defaultProvider),
    },
    isPinned: false,
    spaceId: null,
    createdAt: new Date().toISOString(),
  };
}

export function buildNativeSearchImportThreadCreateCommand(input: {
  readonly projectId: string;
  readonly provider: ModelSelection["provider"];
  readonly model: string;
  readonly externalId: string;
  readonly envMode: "local" | "worktree";
}): Extract<ClientOrchestrationCommand, { type: "thread.create" }> {
  const suffix = input.externalId.trim().slice(-8);
  const providerLabel =
    input.provider === "claudeAgent"
      ? "Claude session"
      : input.provider === "cursor"
        ? "Cursor session"
        : input.provider === "kilo"
          ? "Kilo session"
          : input.provider === "opencode"
            ? "OpenCode session"
            : "Codex thread";
  return {
    type: "thread.create",
    commandId: newCommandId(),
    threadId: newThreadId(),
    projectId: input.projectId as never,
    title: `Imported ${providerLabel}${suffix ? ` ${suffix}` : ""}`,
    modelSelection: {
      provider: input.provider,
      model: input.model,
    } as ModelSelection,
    runtimeMode: "full-access",
    interactionMode: "default",
    envMode: input.envMode,
    branch: null,
    worktreePath: null,
    createdAt: new Date().toISOString(),
  };
}
