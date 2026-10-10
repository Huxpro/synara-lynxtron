// One-shot reads of a thread's detail for actions on a thread that may not be
// on screen (sidebar and Kanban thread actions, completion notifications, the
// Environment panel's recap).
//
// Upstream's session sync (`EventRouter`) is the only writer of thread detail
// in the shared store, and it only keeps the detail of leased threads. So:
//   - a thread whose detail the store holds (`threadDetailSyncById` is
//     "synced") is read from the store, as upstream's own actions do
//     (`getThreadFromState(useStore.getState(), threadId)`);
//   - any other thread costs one `getThreadDetailSnapshot` through the facade,
//     normalized with upstream's pure store projection on top of the current
//     state and never committed. A second writer would corrupt the sequence the
//     sync applies (a streamed delta the snapshot already contains would be
//     appended again).
// Every such reader goes through `readThreadDetailOnce`; there is no other
// request-backed thread detail read on Lynx.

import type { ThreadId } from "@synara/contracts";
import { ensureNativeApi } from "~/nativeApi";
import { useStore } from "@synara-web/store";
import { syncServerThreadDetail } from "@synara-web/storeProjection";
import { createProjectSelector } from "@synara-web/storeSelectors";
import { getThreadFromState } from "@synara-web/threadDerivation";
import type { Project, Thread } from "@synara-web/types";

import type { ThreadHeaderSummary } from "./queries";
import { projectThreadHeaderSummary } from "./threadPageProjection.logic";

export interface ThreadDetailRead {
  readonly thread: Thread;
  readonly project: Project | undefined;
  /** Where the detail came from; `facade` means one request was made. */
  readonly source: "store" | "facade";
}

/** The detail of `threadId`: the store's when it holds it, else one facade read. */
export async function readThreadDetailOnce(
  threadId: string,
): Promise<ThreadDetailRead | undefined> {
  "background only";
  const id = threadId as ThreadId;
  const state = useStore.getState();
  if (state.threadDetailSyncById?.[id] === "synced") {
    const thread = getThreadFromState(state, id);
    if (thread) {
      return { thread, project: createProjectSelector(thread.projectId)(state), source: "store" };
    }
  }
  const snapshot = await ensureNativeApi().orchestration.getThreadDetailSnapshot({ threadId: id });
  if (!snapshot?.thread) return undefined;
  // Projected, not committed. Read the state again: the request took a while.
  const current = useStore.getState();
  const thread = getThreadFromState(syncServerThreadDetail(current, snapshot.thread), id);
  if (!thread) return undefined;
  return { thread, project: createProjectSelector(thread.projectId)(current), source: "facade" };
}

/** `readThreadDetailOnce`, as the header summary the Lynx thread actions take. */
export async function readThreadHeaderSummaryOnce(
  threadId: string,
): Promise<ThreadHeaderSummary | undefined> {
  "background only";
  const read = await readThreadDetailOnce(threadId);
  return read ? projectThreadHeaderSummary(read.thread, read.project) : undefined;
}
