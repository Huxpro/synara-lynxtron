export type SpaceActivityTone = 'attention' | 'running' | 'completed';

const SPACE_ACTIVITY_PRIORITY: Readonly<Record<SpaceActivityTone, number>> = {
  attention: 3,
  running: 2,
  completed: 1,
};

export function deriveSpaceActivityById<
  TProject extends { readonly id: string; readonly spaceId?: string | null },
  TThread extends { readonly projectId: string },
>(input: {
  readonly projects: readonly TProject[];
  readonly threads: readonly TThread[];
  readonly resolveTone: (thread: TThread) => SpaceActivityTone | null;
}): ReadonlyMap<string | null, SpaceActivityTone> {
  const projectSpaceById = new Map(
    input.projects.map((project) => [project.id, project.spaceId ?? null] as const)
  );
  const activity = new Map<string | null, SpaceActivityTone>();
  for (const thread of input.threads) {
    const spaceId = projectSpaceById.get(thread.projectId);
    if (spaceId === undefined) continue;
    const tone = input.resolveTone(thread);
    if (!tone) continue;
    const current = activity.get(spaceId);
    if (!current || SPACE_ACTIVITY_PRIORITY[tone] > SPACE_ACTIVITY_PRIORITY[current]) {
      activity.set(spaceId, tone);
    }
  }
  return activity;
}
