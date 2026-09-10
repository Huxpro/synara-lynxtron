import { SPACE_PROJECTS_ASSIGN_MAX_COUNT, type SpaceIconName } from '@synara/contracts';

export interface SpaceProjectPickerProject<ProjectId extends string = string, SpaceId extends string = string> {
  readonly id: ProjectId;
  readonly name: string;
  readonly path: string;
  readonly spaceId: SpaceId | null;
}

export interface SpaceProjectPickerSpace<SpaceId extends string = string> {
  readonly id: SpaceId;
  readonly name: string;
  readonly icon: SpaceIconName;
}

export interface SpaceProjectPickerGroup<Project, SpaceId extends string = string> {
  readonly key: string;
  readonly spaceId: SpaceId | null;
  readonly name: string;
  readonly label: string;
  readonly icon: SpaceIconName | 'black-hole';
  readonly items: readonly Project[];
}

const VOID_KEY = 'void';
const VOID_NAME = 'Void';
const UNKNOWN_SPACE_NAME = 'Unknown space';

function spaceName<SpaceId extends string>(
  spaceId: SpaceId | null,
  spaces: readonly SpaceProjectPickerSpace<SpaceId>[]
): string {
  if (spaceId === null) return VOID_NAME;
  return spaces.find((space) => space.id === spaceId)?.name ?? UNKNOWN_SPACE_NAME;
}

/** Pure, renderer-independent projection used by both project picker dialogs. */
export function deriveSpaceProjectPickerGroups<
  ProjectId extends string,
  SpaceId extends string,
  Project extends SpaceProjectPickerProject<ProjectId, SpaceId>,
>(input: {
  readonly activeSpaceId: SpaceId | null;
  readonly projects: readonly Project[];
  readonly query: string;
  readonly spaces: readonly SpaceProjectPickerSpace<SpaceId>[];
  readonly targetSpaceId: SpaceId | null;
}): {
  readonly movableProjects: readonly Project[];
  readonly candidates: readonly Project[];
  readonly groups: readonly SpaceProjectPickerGroup<Project, SpaceId>[];
} {
  const movableProjects = input.projects.filter(
    (project) => project.spaceId !== input.targetSpaceId
  );
  const query = input.query.trim().toLocaleLowerCase();
  const candidates = movableProjects
    .filter(
      (project) =>
        query.length === 0 ||
        project.name.toLocaleLowerCase().includes(query) ||
        project.path.toLocaleLowerCase().includes(query) ||
        spaceName(project.spaceId, input.spaces).toLocaleLowerCase().includes(query)
    )
    .toSorted((left, right) => left.name.localeCompare(right.name));

  const itemsBySpaceId = new Map<SpaceId | null, Project[]>();
  for (const project of candidates) {
    const bucket = itemsBySpaceId.get(project.spaceId);
    if (bucket) bucket.push(project);
    else itemsBySpaceId.set(project.spaceId, [project]);
  }
  const knownIds = new Set<SpaceId | null>([null, ...input.spaces.map((space) => space.id)]);
  const orderedIds = [
    input.activeSpaceId,
    null,
    ...input.spaces.map((space) => space.id),
    ...[...itemsBySpaceId.keys()].filter((spaceId) => !knownIds.has(spaceId)),
  ].filter((spaceId, index, values) => values.indexOf(spaceId) === index);

  return {
    movableProjects,
    candidates,
    groups: orderedIds.flatMap((spaceId) => {
      const items = itemsBySpaceId.get(spaceId);
      if (!items) return [];
      const space =
        spaceId === null ? null : input.spaces.find((candidate) => candidate.id === spaceId);
      const name = spaceName(spaceId, input.spaces);
      return [{
        key: spaceId ?? VOID_KEY,
        spaceId,
        name,
        label: spaceId === input.activeSpaceId ? `${name} · Active` : name,
        icon: space?.icon ?? 'black-hole',
        items,
      }];
    }),
  };
}

export function toggleSpaceProjectSelection<ProjectId extends string>(
  selectedIds: ReadonlySet<ProjectId>,
  projectId: ProjectId
): ReadonlySet<ProjectId> {
  const next = new Set(selectedIds);
  if (next.has(projectId)) next.delete(projectId);
  else next.add(projectId);
  return next;
}

export function chunkSpaceProjectIds<ProjectId extends string>(
  projectIds: readonly ProjectId[]
): readonly (readonly ProjectId[])[] {
  const chunks: ProjectId[][] = [];
  for (let offset = 0; offset < projectIds.length; offset += SPACE_PROJECTS_ASSIGN_MAX_COUNT) {
    chunks.push(projectIds.slice(offset, offset + SPACE_PROJECTS_ASSIGN_MAX_COUNT));
  }
  return chunks;
}

export function spaceProjectPickerFailureMessage(
  failedCount: number,
  targetSpaceName: string
): string {
  return `${failedCount} could not be moved. Projects processed before the failure remain in ${targetSpaceName}. Try again.`;
}
