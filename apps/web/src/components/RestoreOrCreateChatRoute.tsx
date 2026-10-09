// FILE: RestoreOrCreateChatRoute.tsx
// Purpose: Shared cold-start machinery for chat index routes — guards against briefly-empty
//          bootstrap snapshots, then defers to a caller-supplied resolver to pick the thread
//          route to restore, falling back to creating a fresh draft. Used by the home-chat index
//          route and the Groups index route so both get identical empty-snapshot recovery.
// Layer: Routing
// Depends on: sidebar UI persistence plus caller-supplied restore/fresh-chat policy.

import { ThreadId } from "@synara/contracts";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { SplashScreen } from "./SplashScreen";
import type { LastThreadRoute } from "../chatRouteRestore";
import { readSidebarUiState } from "./Sidebar.uiState";
import {
  refreshEmptyRouteRestoreSnapshot,
  waitForEmptyRouteRestoreFallbackDelay,
} from "../chatRouteRecovery";
import type { StartContainerChatResult } from "../lib/startContainerChat";
import { readNativeApi } from "../nativeApi";
import { useSplitViewStore } from "../splitViewStore";
import { EMPTY_THREAD_IDS, useStore } from "../store";
import {
  type RestoreRouteResolver,
  type RestoreRouteResolverInput,
  useRestoreOrCreateChatRouteController,
} from "./useRestoreOrCreateChatRoute.logic";

export type { RestoreRouteResolver, RestoreRouteResolverInput };

function readLastThreadRoute(): LastThreadRoute | null {
  return readSidebarUiState().lastThreadRoute;
}

export function RestoreOrCreateChatRoute({
  resolveRestoreRoute,
  createFreshChat,
}: {
  // Surface-specific policy for picking the thread route to restore (e.g. the last-visited route
  // for home chats, the latest group thread or draft for Groups). The remembered-route recovery
  // below still keys off the total thread count, which is shared across surfaces.
  readonly resolveRestoreRoute: RestoreRouteResolver;
  readonly createFreshChat: () => Promise<StartContainerChatResult>;
}) {
  const navigate = useNavigate();
  const threadsHydrated = useStore((store) => store.threadsHydrated);
  const threadIds = useStore((state) => state.threadIds ?? EMPTY_THREAD_IDS);
  const splitViewsHydrated = useSplitViewStore((state) => state.hasHydrated);
  const splitViewsById = useSplitViewStore((state) => state.splitViewsById);
  const splitViewIds = Object.keys(splitViewsById).filter(
    (splitViewId) => splitViewsById[splitViewId],
  );
  const navigateToRoute = useCallback(
    async (route: LastThreadRoute) => {
      await navigate({
        to: "/$threadId",
        params: { threadId: ThreadId.makeUnsafe(route.threadId) },
        replace: true,
        search: () => ({ splitViewId: route.splitViewId }),
      });
    },
    [navigate],
  );
  const refreshEmptySnapshot = useCallback(
    () => refreshEmptyRouteRestoreSnapshot(readNativeApi()).catch(() => false),
    [],
  );
  const { errorMessage, retry } = useRestoreOrCreateChatRouteController({
    threadsHydrated,
    threadIds,
    splitViewsHydrated,
    splitViewIds,
    readLastThreadRoute,
    resolveRestoreRoute,
    navigateToRoute,
    createFreshChat: createFreshChat as () => Promise<StartContainerChatResult>,
    refreshEmptySnapshot,
    waitForFallbackDelay: waitForEmptyRouteRestoreFallbackDelay,
  });

  return <SplashScreen errorMessage={errorMessage} onRetry={retry} />;
}
