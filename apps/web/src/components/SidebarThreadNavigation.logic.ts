// FILE: SidebarThreadNavigation.logic.ts
// Purpose: Portable visible-thread cycling, jump, and prewarm selection.
// Exports: Shared navigation helpers consumed by Web and native sidebars.

const THREAD_JUMP_COMMANDS = [
  "thread.jump.1",
  "thread.jump.2",
  "thread.jump.3",
  "thread.jump.4",
  "thread.jump.5",
  "thread.jump.6",
  "thread.jump.7",
  "thread.jump.8",
  "thread.jump.9",
] as const;

export const SIDEBAR_THREAD_PREWARM_LIMIT = 10;

/**
 * Flatten already-derived row controllers into the exact navigation order.
 * Each host owns rendering, while pin/project/trailing section order and
 * duplicate suppression stay portable.
 */
export function collectVisibleSidebarThreadIds<T extends string>(input: {
  readonly pinnedThreadIds: readonly T[];
  readonly projectVisibleThreadIds: readonly (readonly T[])[];
  readonly trailingThreadIds?: readonly T[];
}): T[] {
  const visibleThreadIds = new Set<T>();
  for (const threadId of input.pinnedThreadIds) {
    visibleThreadIds.add(threadId);
  }
  for (const projectThreadIds of input.projectVisibleThreadIds) {
    for (const threadId of projectThreadIds) {
      visibleThreadIds.add(threadId);
    }
  }
  for (const threadId of input.trailingThreadIds ?? []) {
    visibleThreadIds.add(threadId);
  }
  return [...visibleThreadIds];
}

export function getNextVisibleSidebarThreadId<T extends string>(input: {
  readonly visibleThreadIds: readonly T[];
  readonly activeThreadId: T | undefined;
  readonly direction: "forward" | "backward";
}): T | null {
  const { activeThreadId, direction, visibleThreadIds } = input;
  if (visibleThreadIds.length === 0) {
    return null;
  }

  if (!activeThreadId) {
    return direction === "forward"
      ? (visibleThreadIds[0] ?? null)
      : (visibleThreadIds.at(-1) ?? null);
  }

  const activeIndex = visibleThreadIds.findIndex((threadId) => threadId === activeThreadId);
  if (activeIndex === -1) {
    return direction === "forward"
      ? (visibleThreadIds[0] ?? null)
      : (visibleThreadIds.at(-1) ?? null);
  }

  const nextIndex =
    direction === "forward"
      ? (activeIndex + 1) % visibleThreadIds.length
      : (activeIndex - 1 + visibleThreadIds.length) % visibleThreadIds.length;

  return visibleThreadIds[nextIndex] ?? null;
}

export function getSidebarThreadIdForJumpCommand<T extends string>(input: {
  readonly visibleThreadIds: readonly T[];
  readonly command: string | null;
}): T | null {
  if (!input.command) {
    return null;
  }

  const jumpIndex = THREAD_JUMP_COMMANDS.indexOf(
    input.command as (typeof THREAD_JUMP_COMMANDS)[number],
  );
  if (jumpIndex === -1) {
    return null;
  }

  return input.visibleThreadIds[jumpIndex] ?? null;
}

export function getSidebarThreadIdsToPrewarm<T extends string>(input: {
  readonly visibleThreadIds: readonly T[];
  readonly activeThreadId?: T | null;
  readonly limit?: number;
  readonly neighborRadius?: number;
}): T[] {
  const limit = Math.max(0, input.limit ?? SIDEBAR_THREAD_PREWARM_LIMIT);
  if (limit === 0) {
    return [];
  }
  const prewarmedThreadIds = new Set<T>();
  const neighborRadius = Math.max(0, input.neighborRadius ?? 2);
  const activeIndex =
    input.activeThreadId === undefined || input.activeThreadId === null
      ? -1
      : input.visibleThreadIds.indexOf(input.activeThreadId);

  if (activeIndex >= 0) {
    const start = Math.max(0, activeIndex - neighborRadius);
    const end = Math.min(input.visibleThreadIds.length - 1, activeIndex + neighborRadius);
    for (let index = start; index <= end; index += 1) {
      if (prewarmedThreadIds.size >= limit) {
        break;
      }
      const threadId = input.visibleThreadIds[index];
      if (threadId) {
        prewarmedThreadIds.add(threadId);
      }
    }
  }

  for (const threadId of input.visibleThreadIds) {
    if (prewarmedThreadIds.size >= limit) {
      break;
    }
    prewarmedThreadIds.add(threadId);
  }

  return [...prewarmedThreadIds];
}
