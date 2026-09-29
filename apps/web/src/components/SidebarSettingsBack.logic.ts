import { resolveRestorableThreadRoute, type LastThreadRoute } from "../chatRouteRestore";

export type SettingsBackTarget =
  | {
      kind: "thread";
      threadId: string;
      splitViewId?: string | undefined;
    }
  | {
      kind: "home";
    };

export function resolveSettingsBackTarget(input: {
  lastThreadRoute: LastThreadRoute | null;
  availableThreadIds: ReadonlySet<string>;
  latestThreadId: string | null;
  availableSplitViewIds?: ReadonlySet<string>;
}): SettingsBackTarget {
  const restorableRoute = resolveRestorableThreadRoute({
    lastThreadRoute: input.lastThreadRoute,
    availableThreadIds: input.availableThreadIds,
    ...(input.availableSplitViewIds ? { availableSplitViewIds: input.availableSplitViewIds } : {}),
  });

  if (restorableRoute) {
    return {
      kind: "thread",
      threadId: restorableRoute.threadId,
      splitViewId: restorableRoute.splitViewId,
    };
  }

  if (input.latestThreadId) {
    return {
      kind: "thread",
      threadId: input.latestThreadId,
    };
  }

  return { kind: "home" };
}
