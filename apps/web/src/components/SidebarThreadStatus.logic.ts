// FILE: SidebarThreadStatus.logic.ts
// Purpose: Full portable thread-status fact derivation and presentation.
// Exports: Shared resolver used by Web and Lynx normalized sidebar projections.

import type { Thread } from "../types";
import {
  canSessionAnswerPendingRequests,
  findLatestProposedPlan,
  hasActionableProposedPlan,
  isLatestTurnSettled,
} from "../session-logic";
import { hasUnseenCompletion, isThreadActivelyWorking } from "./SidebarThreadSort.logic";
import {
  resolveSidebarStatusPresentation,
  type SidebarStatusPresentation,
} from "./SidebarStatus.logic";

export type ThreadStatusPill = SidebarStatusPresentation;

type ThreadStatusInput = Pick<
  Thread,
  "interactionMode" | "latestTurn" | "lastVisitedAt" | "session" | "updatedAt"
> & {
  proposedPlans?: Thread["proposedPlans"] | undefined;
  hasActionableProposedPlan?: boolean | undefined;
  hasLiveTailWork?: boolean | undefined;
  dismissedStatusKey?: string | undefined;
};

function createThreadStatusDismissalKey(
  label: Extract<ThreadStatusPill["label"], "Pending Approval" | "Awaiting Input" | "Plan Ready">,
  thread: ThreadStatusInput,
): string {
  return [
    label,
    thread.updatedAt ?? "",
    thread.latestTurn?.turnId ?? "",
    thread.latestTurn?.completedAt ?? "",
    thread.session?.updatedAt ?? "",
  ].join(":");
}

function createCompletedDismissalKey(thread: ThreadStatusInput): string | null {
  if (!thread.latestTurn?.completedAt) {
    return null;
  }
  return ["Completed", thread.latestTurn.turnId, thread.latestTurn.completedAt].join(":");
}

export function resolveThreadStatusPill(input: {
  thread: ThreadStatusInput;
  hasPendingApprovals: boolean;
  hasPendingUserInput: boolean;
}): ThreadStatusPill | null {
  const { thread } = input;
  const canAnswerPendingRequests = canSessionAnswerPendingRequests(thread.session);
  const hasPendingApprovals = input.hasPendingApprovals && canAnswerPendingRequests;
  const hasPendingUserInput = input.hasPendingUserInput && canAnswerPendingRequests;
  const hasPlanReadyPrompt =
    !hasPendingUserInput &&
    !thread.hasLiveTailWork &&
    thread.interactionMode === "plan" &&
    isLatestTurnSettled(thread.latestTurn, thread.session) &&
    (thread.hasActionableProposedPlan ??
      hasActionableProposedPlan(
        findLatestProposedPlan(thread.proposedPlans ?? [], thread.latestTurn?.turnId ?? null),
      ));
  const approvalDismissalKey = hasPendingApprovals
    ? createThreadStatusDismissalKey("Pending Approval", thread)
    : null;
  const inputDismissalKey = hasPendingUserInput
    ? createThreadStatusDismissalKey("Awaiting Input", thread)
    : null;
  const planDismissalKey = hasPlanReadyPrompt
    ? createThreadStatusDismissalKey("Plan Ready", thread)
    : null;
  const completedDismissalKey =
    !thread.hasLiveTailWork && hasUnseenCompletion(thread)
      ? createCompletedDismissalKey(thread)
      : null;

  return resolveSidebarStatusPresentation({
    pendingApproval: approvalDismissalKey
      ? {
          dismissalKey: approvalDismissalKey,
          dismissed: thread.dismissedStatusKey === approvalDismissalKey,
        }
      : null,
    pendingUserInput: inputDismissalKey
      ? {
          dismissalKey: inputDismissalKey,
          dismissed: thread.dismissedStatusKey === inputDismissalKey,
        }
      : null,
    working: isThreadActivelyWorking(thread),
    connecting: thread.session?.status === "connecting",
    planReady: planDismissalKey
      ? {
          dismissalKey: planDismissalKey,
          dismissed: thread.dismissedStatusKey === planDismissalKey,
        }
      : null,
    completed:
      !thread.hasLiveTailWork && hasUnseenCompletion(thread)
        ? {
            dismissalKey: completedDismissalKey,
            dismissed:
              completedDismissalKey !== null && thread.dismissedStatusKey === completedDismissalKey,
          }
        : null,
  });
}
