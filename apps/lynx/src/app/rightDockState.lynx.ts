import {
  RIGHT_DOCK_STORAGE_KEY,
  createDefaultRightDockState,
  sanitizeRightDockStateByThreadId,
  type RightDockThreadState,
} from '@synara/shared/rightDock';

import { webStorage } from '../platform/storage';

function readAll(): Record<string, RightDockThreadState> {
  const raw = webStorage.getItem(RIGHT_DOCK_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as {
      dockStateByThreadId?: unknown;
      state?: { dockStateByThreadId?: unknown };
    };
    return sanitizeRightDockStateByThreadId(
      parsed.state?.dockStateByThreadId ?? parsed.dockStateByThreadId
    );
  } catch {
    return {};
  }
}

export function readRightDockThreadState(
  threadId: string
): RightDockThreadState {
  return readAll()[threadId] ?? createDefaultRightDockState();
}

export function storeRightDockThreadState(
  threadId: string,
  state: RightDockThreadState
): void {
  const dockStateByThreadId = { ...readAll(), [threadId]: state };
  webStorage.setItem(
    RIGHT_DOCK_STORAGE_KEY,
    JSON.stringify({ state: { dockStateByThreadId }, version: 0 })
  );
}

export function removeRightDockThreadState(threadId: string): void {
  const dockStateByThreadId = { ...readAll() };
  if (!Object.hasOwn(dockStateByThreadId, threadId)) return;
  delete dockStateByThreadId[threadId];
  webStorage.setItem(
    RIGHT_DOCK_STORAGE_KEY,
    JSON.stringify({ state: { dockStateByThreadId }, version: 0 })
  );
}
