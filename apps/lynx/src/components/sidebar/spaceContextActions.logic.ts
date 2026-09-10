import type {
  ClientOrchestrationCommand,
  OrchestrationShellSnapshot,
  ProjectId,
  SpaceIconName,
  SpaceId,
} from '@synara/contracts';
import { chunkSpaceProjectIds } from '@synara/shared/spaceProjectPicker';

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildNativeSpaceUpdateCommand(input: {
  readonly currentIcon: SpaceIconName;
  readonly currentName: string;
  readonly nextIcon: SpaceIconName;
  readonly nextName: string;
  readonly spaceId: SpaceId;
}): ClientOrchestrationCommand | null {
  const name = input.nextName.trim();
  const nextName = name === input.currentName ? undefined : name;
  const nextIcon = input.nextIcon === input.currentIcon ? undefined : input.nextIcon;
  if (nextName === undefined && nextIcon === undefined) return null;
  return {
    type: 'space.meta.update',
    commandId: commandId('lynx-space-update') as never,
    spaceId: input.spaceId,
    ...(nextName !== undefined ? { name: nextName } : {}),
    ...(nextIcon !== undefined ? { icon: nextIcon } : {}),
  };
}

export function buildNativeSpaceDeleteCommand(
  spaceId: SpaceId
): ClientOrchestrationCommand {
  return {
    type: 'space.delete',
    commandId: commandId('lynx-space-delete') as never,
    spaceId,
  };
}

export function buildNativeSpaceCreateCommand(input: {
  readonly icon: SpaceIconName;
  readonly name: string;
  readonly spaceId: SpaceId;
}): ClientOrchestrationCommand {
  return {
    type: 'space.create',
    commandId: commandId('lynx-space-create') as never,
    spaceId: input.spaceId,
    name: input.name.trim(),
    icon: input.icon,
    createdAt: new Date().toISOString(),
  };
}

export function nativeSpaceDeleteConfirmation(
  name: string,
  projectCount: number
): string {
  return projectCount > 0
    ? `Delete “${name}”?\n\n${projectCount} project${projectCount === 1 ? '' : 's'} will move to Void.`
    : `Delete “${name}”?`;
}

export function buildNativeProjectMoveCommand(input: {
  readonly currentSpaceId: SpaceId | null;
  readonly projectId: import('@synara/contracts').ProjectId;
  readonly targetSpaceId: SpaceId | null;
}): ClientOrchestrationCommand | null {
  if (input.currentSpaceId === input.targetSpaceId) return null;
  return {
    type: 'project.meta.update',
    commandId: commandId('lynx-project-space') as never,
    projectId: input.projectId,
    spaceId: input.targetSpaceId,
  };
}

export async function createNativeSpaceWithOptionalProjectMove(input: {
  readonly createCommand: Extract<ClientOrchestrationCommand, { type: 'space.create' }>;
  readonly dispatch: (command: ClientOrchestrationCommand) => Promise<unknown>;
  readonly projectId: ProjectId | null;
  readonly projectSpaceId: SpaceId | null;
}): Promise<{ readonly moveError: unknown | null }> {
  await input.dispatch(input.createCommand);
  if (input.projectId === null) return { moveError: null };
  const moveCommand = buildNativeProjectMoveCommand({
    currentSpaceId: input.projectSpaceId,
    projectId: input.projectId,
    targetSpaceId: input.createCommand.spaceId,
  });
  if (!moveCommand) return { moveError: null };
  try {
    await input.dispatch(moveCommand);
    return { moveError: null };
  } catch (moveError) {
    return { moveError };
  }
}

export async function archiveNativeProjectThreads(input: {
  readonly dispatch: (command: ClientOrchestrationCommand) => Promise<unknown>;
  readonly threadIds: readonly import('@synara/contracts').ThreadId[];
}): Promise<{
  readonly archivedCount: number;
  readonly archivedThreadIds: readonly import('@synara/contracts').ThreadId[];
  readonly failureCount: number;
}> {
  let archivedCount = 0;
  let failureCount = 0;
  const archivedThreadIds: import('@synara/contracts').ThreadId[] = [];
  for (const threadId of input.threadIds) {
    try {
      await input.dispatch({
        type: 'thread.archive',
        commandId: commandId('lynx-project-archive') as never,
        threadId,
      });
      archivedCount += 1;
      archivedThreadIds.push(threadId);
    } catch {
      failureCount += 1;
    }
  }
  return { archivedCount, archivedThreadIds, failureCount };
}

export async function assignNativeProjectsToSpace(input: {
  readonly dispatch: (command: ClientOrchestrationCommand) => Promise<unknown>;
  readonly getSnapshot: () => Promise<OrchestrationShellSnapshot>;
  readonly projectIds: readonly ProjectId[];
  readonly spaceId: SpaceId;
}): Promise<readonly ProjectId[]> {
  const chunks = chunkSpaceProjectIds(input.projectIds);
  let processedCount = 0;
  for (const chunk of chunks) {
    try {
      await input.dispatch({
        type: 'space.projects.assign',
        commandId: commandId('lynx-space-projects') as never,
        spaceId: input.spaceId,
        projectIds: [...chunk],
      });
      processedCount += chunk.length;
    } catch {
      const remaining = input.projectIds.slice(processedCount);
      try {
        const snapshot = await input.getSnapshot();
        const projectById = new Map(snapshot.projects.map((project) => [project.id, project]));
        return remaining.filter((projectId) => {
          const project = projectById.get(projectId);
          return project !== undefined && project.spaceId !== input.spaceId;
        });
      } catch {
        return remaining;
      }
    }
  }
  return [];
}
