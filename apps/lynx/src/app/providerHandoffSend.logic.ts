// FILE: app/providerHandoffSend.logic.ts
// Purpose: The decisions upstream makes inline when a message is sent with a
//   provider other than the thread's own picked in the composer ("in-thread
//   handoff on send"). Upstream keeps them in `ChatView.tsx` and
//   `chat/useChatTurnExecution.ts`, inside the component and the send callback,
//   so they are mirrored here statement by statement;
//   `plan/upstream-parallel-copies.json` lists each as a fragment and fails the
//   build when upstream changes one. The handoff itself is upstream's
//   `continueThreadHandoff` (`generated/threadHandoff.generated.ts`).
// Layer: L3 orchestration (Lynx), pure

import { PROVIDER_DISPLAY_NAMES, type ModelSelection, type ProviderKind } from "@synara/contracts";
import { threadHasProviderLockingActivity } from "@synara-web/components/ChatView.logic";
import { canCreateThreadHandoff } from "@synara-web/lib/threadHandoff";
import { derivePendingApprovals, derivePendingUserInputs } from "@synara-web/session-logic";
import type { Thread } from "@synara-web/types";

/**
 * `needsProviderHandoff` of `useChatTurnExecution.ts`: the thread already ran
 * on a provider and the send names another one. (Every Lynx thread is a server
 * thread and Lynx has no queued turns, upstream's other two conditions.)
 */
export function needsProviderHandoffForSend(
  thread: Pick<Thread, "messages" | "sidechatSourceThreadId" | "latestTurn" | "session"> &
    Pick<Thread, "modelSelection">,
  modelSelection: Pick<ModelSelection, "provider">,
): boolean {
  return (
    threadHasProviderLockingActivity(thread) &&
    modelSelection.provider !== thread.modelSelection.provider
  );
}

/**
 * `handoffDisabled` of `ChatView.tsx` for a store thread: upstream's
 * `canCreateThreadHandoff` with the thread's own busy and pending state. (A
 * group coordinator, which upstream also excludes, has no Lynx surface.)
 */
export function isProviderHandoffDisabled(
  thread: Pick<
    Thread,
    "handoff" | "messages" | "session" | "activities" | "pendingInteractions" | "latestTurn"
  >,
): boolean {
  return !canCreateThreadHandoff({
    thread,
    isBusy: thread.latestTurn?.state === "running",
    hasPendingApprovals:
      derivePendingApprovals(thread.activities, thread.pendingInteractions).length > 0,
    hasPendingUserInput:
      derivePendingUserInputs(thread.activities, thread.pendingInteractions).length > 0,
  });
}

export interface ProviderHandoffSendRefusal {
  readonly title: string;
  readonly description: string;
}

/**
 * `canSendWithProviderHandoff` of `ChatView.tsx`: a send that would hand the
 * thread off is refused up front, before anything is dispatched, while the
 * thread cannot be handed off (a running turn, a pending approval or question).
 * `null` lets the send proceed.
 */
export function resolveProviderHandoffSendRefusal(input: {
  readonly providerHandoffPendingForSend: boolean;
  readonly handoffDisabled: boolean;
  readonly selectedProvider: ProviderKind;
}): ProviderHandoffSendRefusal | null {
  if (!input.providerHandoffPendingForSend || !input.handoffDisabled) {
    return null;
  }
  const targetName = PROVIDER_DISPLAY_NAMES[input.selectedProvider] ?? input.selectedProvider;
  return {
    title: `Cannot switch to ${targetName} yet`,
    description:
      "Wait for the current turn to finish and answer any pending request, then send again.",
  };
}

/**
 * The send's `createdAt` after a completed handoff (`useChatTurnExecution.ts`):
 * the message is positioned after the handoff row, including when the server
 * clock is ahead of this one.
 */
export function resolveSendCreatedAtAfterProviderHandoff(input: {
  readonly thread: Pick<Thread, "activities"> | undefined;
  readonly messageCreatedAt: string;
  readonly nowMs: number;
}): string {
  const handoffCreatedAt = input.thread?.activities.findLast(
    (activity) => activity.kind === "provider.handoff",
  )?.createdAt;
  return new Date(
    Math.max(input.nowMs, Date.parse(handoffCreatedAt ?? input.messageCreatedAt) + 1),
  ).toISOString();
}
