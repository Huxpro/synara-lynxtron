// Mounts upstream's session-sync engine on Lynx (plan Step 2).
//
// `EventRouter` is generated from the Web route shell
// (`src/generated/eventRouter.generated.tsx`). It feeds the shared zustand
// `store` from the upstream `NativeApi` facade: shell snapshot bootstrap,
// pushed domain events, thread-detail catch-up. It renders nothing.
//
// The engine and everything it imports (transport listeners, persisted stores,
// timers) belong to the background thread, so the module is reached through a
// `'background only'` function with an eager dynamic import (P-16): it stays in
// the main bundle but out of the main-thread graph, and the component only
// exists in background state. Mount this after storage hydration; the stores
// `EventRouter` pulls in rehydrate from the storage mirror at module load.

import { useEffect, useState, type ComponentType } from "@lynx-js/react";

import { bindLynxRouterHistory } from "../adapters/reactRouter.lynx";
import { history } from "./router";

async function loadEventRouter(): Promise<ComponentType> {
  "background only";
  const { EventRouter } = await import(
    /* webpackMode: "eager" */ "../generated/eventRouter.generated"
  );
  return EventRouter;
}

export function SessionSync() {
  const [EventRouter, setEventRouter] = useState<ComponentType | null>(null);

  useEffect(() => {
    "background only";
    let active = true;
    // `EventRouter` reads the route through the router-hook adapter; give it
    // the app's memory history before the first render.
    const unbindHistory = bindLynxRouterHistory(history);
    void loadEventRouter().then(
      (component) => {
        if (active) setEventRouter(() => component);
      },
      (error: unknown) => {
        console.error("Session sync failed to load", error);
      },
    );
    return () => {
      active = false;
      unbindHistory();
    };
  }, []);

  return EventRouter ? <EventRouter /> : null;
}
