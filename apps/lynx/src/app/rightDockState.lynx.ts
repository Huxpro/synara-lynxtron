import {
  RIGHT_DOCK_STORAGE_KEY,
  createDefaultRightDockState,
  sanitizeRightDockStateByThreadId,
  type RightDockThreadState,
} from "@synara/shared/rightDock";

import { webStorage } from "../platform/storage";

function readAll(): Record<string, RightDockThreadState> {
  const raw = webStorage.getItem(RIGHT_DOCK_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as {
      dockStateByThreadId?: unknown;
      state?: { dockStateByThreadId?: unknown };
    };
    return sanitizeRightDockStateByThreadId(
      parsed.state?.dockStateByThreadId ?? parsed.dockStateByThreadId,
    );
  } catch {
    return {};
  }
}

function writeAll(dockStateByThreadId: Record<string, RightDockThreadState>): void {
  webStorage.setItem(
    RIGHT_DOCK_STORAGE_KEY,
    JSON.stringify({ state: { dockStateByThreadId }, version: 0 }),
  );
  mirrorToSharedDockStore();
}

/**
 * Upstream's session sync leases the detail stream of the dock's active Side
 * thread from upstream's dock store (`resolveVisibleDockSidechatThreadIds` in
 * `EventRouter`). The Lynx dock keeps its own state under the same storage key,
 * so each change is mirrored there; without it a Side thread opened in this
 * session never gets a lease. UI state only: no server state is written.
 * Whatever is in storage when the import settles wins, so mirrors cannot land
 * out of order.
 */
function mirrorToSharedDockStore(): void {
  "background only";
  void import(/* webpackMode: "eager" */ "@synara-web/rightDockStore").then(
    ({ useRightDockStore }) => {
      useRightDockStore.setState({ dockStateByThreadId: readAll() });
    },
  );
}

export function readRightDockThreadState(threadId: string): RightDockThreadState {
  return readAll()[threadId] ?? createDefaultRightDockState();
}

export function storeRightDockThreadState(threadId: string, state: RightDockThreadState): void {
  writeAll({ ...readAll(), [threadId]: state });
}

export function removeRightDockThreadState(threadId: string): void {
  const dockStateByThreadId = { ...readAll() };
  if (!Object.hasOwn(dockStateByThreadId, threadId)) return;
  delete dockStateByThreadId[threadId];
  writeAll(dockStateByThreadId);
}
