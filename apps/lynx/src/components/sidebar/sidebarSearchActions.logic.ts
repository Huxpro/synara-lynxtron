import {
  DEFAULT_MODEL_BY_PROVIDER,
  type ClientOrchestrationCommand,
  type ModelSelection,
} from '@synara/contracts';
import { newCommandId, newProjectId, newThreadId } from '@synara-web/lib/utils';

export function buildNativeSearchProjectCreateCommand(input: {
  readonly workspaceRoot: string;
  readonly createIfMissing: boolean;
}): Extract<ClientOrchestrationCommand, { type: 'project.create' }> {
  const workspaceRoot = input.workspaceRoot.trim();
  const title =
    workspaceRoot.replace(/[\\/]+$/, '').split(/[\\/]/).filter(Boolean).at(-1) ??
    workspaceRoot;
  return {
    type: 'project.create',
    commandId: newCommandId(),
    projectId: newProjectId(),
    title,
    workspaceRoot,
    createWorkspaceRootIfMissing: input.createIfMissing,
    defaultModelSelection: {
      provider: 'codex',
      model: DEFAULT_MODEL_BY_PROVIDER.codex,
    },
    isPinned: false,
    spaceId: null,
    createdAt: new Date().toISOString(),
  };
}

export function buildNativeSearchImportThreadCreateCommand(input: {
  readonly projectId: string;
  readonly provider: ModelSelection['provider'];
  readonly model: string;
  readonly externalId: string;
}): Extract<ClientOrchestrationCommand, { type: 'thread.create' }> {
  const suffix = input.externalId.trim().slice(-8);
  const providerLabel =
    input.provider === 'claudeAgent'
      ? 'Claude session'
      : input.provider === 'cursor'
        ? 'Cursor session'
        : input.provider === 'kilo'
          ? 'Kilo session'
          : input.provider === 'opencode'
            ? 'OpenCode session'
            : 'Codex thread';
  return {
    type: 'thread.create',
    commandId: newCommandId(),
    threadId: newThreadId(),
    projectId: input.projectId as never,
    title: `Imported ${providerLabel}${suffix ? ` ${suffix}` : ''}`,
    modelSelection: {
      provider: input.provider,
      model: input.model,
    } as ModelSelection,
    runtimeMode: 'full-access',
    interactionMode: 'default',
    envMode: 'local',
    branch: null,
    worktreePath: null,
    createdAt: new Date().toISOString(),
  };
}
