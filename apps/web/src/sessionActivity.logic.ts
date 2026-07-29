// FILE: sessionActivity.logic.ts
// Purpose: Small runtime-portable predicates for the latest turn/session lifecycle.
// Exports: Shared settled/live checks without the full work-log projection graph.

type LatestTurnTiming = {
  readonly state: string;
  readonly startedAt?: string | null | undefined;
  readonly completedAt?: string | null | undefined;
};

type SessionActivityState = {
  readonly orchestrationStatus?: string | null | undefined;
  readonly activeTurnId?: string | null | undefined;
};

export function isLatestTurnSettled(
  latestTurn: LatestTurnTiming | null,
  session: SessionActivityState | null,
): boolean {
  if (!latestTurn?.startedAt) return false;
  if (!latestTurn.completedAt) return false;
  if (latestTurn.state === "interrupted" || latestTurn.state === "error") {
    return true;
  }
  if (!session) return true;
  if (session.orchestrationStatus === "running") return false;
  return true;
}

export function hasLiveLatestTurn(
  latestTurn: LatestTurnTiming | null,
  session: SessionActivityState | null,
): boolean {
  if (!latestTurn?.startedAt) {
    return false;
  }
  return !isLatestTurnSettled(latestTurn, session);
}
