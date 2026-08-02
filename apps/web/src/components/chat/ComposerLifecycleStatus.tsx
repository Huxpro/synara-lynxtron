// FILE: ComposerLifecycleStatus.tsx
// Purpose: Bounded, physical-shared composer lifecycle announcements.

import { useEffect, useRef } from "react";

import { ComposerLifecycleStatusElement } from "~/components/chat/ComposerLifecycleStatusElements";

export type ComposerLifecycleOperation = "idle" | "sending" | "stopping" | "error";

export interface ComposerLifecycleSnapshot {
  readonly errorMessage?: string | null;
  readonly operation: ComposerLifecycleOperation;
  readonly sessionStatus: string | null;
}

export interface ComposerLifecyclePresentation {
  readonly announcement: string;
  readonly intent: "status" | "alert";
}

const ACTIVE_SESSION_STATUSES = new Set(["starting", "running"]);
const STOPPED_SESSION_STATUSES = new Set(["interrupted", "stopped"]);

export function resolveComposerLifecycleTransition(input: {
  readonly current: ComposerLifecycleSnapshot;
  readonly includeFailure: boolean;
  readonly previous: ComposerLifecycleSnapshot | null;
  readonly stopRequested?: boolean;
}): ComposerLifecyclePresentation | null {
  const { current, previous } = input;
  if (!previous) return null;

  const errorMessage = current.errorMessage?.trim() ?? "";
  const previousErrorMessage = previous.errorMessage?.trim() ?? "";
  if (
    input.includeFailure &&
    (current.operation === "error" || current.sessionStatus === "error") &&
    (previous.operation !== current.operation ||
      previous.sessionStatus !== current.sessionStatus ||
      errorMessage !== previousErrorMessage)
  ) {
    return {
      announcement: errorMessage || "Response failed.",
      intent: "alert",
    };
  }

  if (
    STOPPED_SESSION_STATUSES.has(current.sessionStatus ?? "") &&
    current.sessionStatus !== previous.sessionStatus &&
    (ACTIVE_SESSION_STATUSES.has(previous.sessionStatus ?? "") ||
      previous.operation === "stopping")
  ) {
    return { announcement: "Response stopped", intent: "status" };
  }

  const reachedReadyState =
    ACTIVE_SESSION_STATUSES.has(previous.sessionStatus ?? "") &&
    (current.sessionStatus === "ready" ||
      current.sessionStatus === "idle" ||
      current.sessionStatus === null);
  if (
    reachedReadyState &&
    (input.stopRequested ||
      current.operation === "stopping" ||
      previous.operation === "stopping")
  ) {
    return { announcement: "Response stopped", intent: "status" };
  }

  if (
    current.operation === "stopping" &&
    previous.operation !== "stopping"
  ) {
    return { announcement: "Stopping response", intent: "status" };
  }

  if (
    current.operation === "sending" &&
    previous.operation !== "sending"
  ) {
    return { announcement: "Sending message", intent: "status" };
  }

  if (
    current.sessionStatus === "starting" &&
    previous.sessionStatus !== "starting"
  ) {
    return { announcement: "Starting response", intent: "status" };
  }

  if (
    current.sessionStatus === "running" &&
    previous.sessionStatus !== "running"
  ) {
    return { announcement: "Response started", intent: "status" };
  }

  if (reachedReadyState) {
    return { announcement: "Response complete", intent: "status" };
  }

  return null;
}

export function ComposerLifecycleStatus(props: {
  readonly errorMessage?: string | null;
  readonly includeFailure?: boolean;
  readonly operation: ComposerLifecycleOperation;
  readonly sessionStatus: string | null;
}) {
  const previousRef = useRef<ComposerLifecycleSnapshot | null>(null);
  const stopRequestedRef = useRef(false);
  const current: ComposerLifecycleSnapshot = {
    errorMessage: props.errorMessage,
    operation: props.operation,
    sessionStatus: props.sessionStatus,
  };
  const presentation = resolveComposerLifecycleTransition({
    current,
    includeFailure: props.includeFailure ?? true,
    previous: previousRef.current,
    stopRequested:
      stopRequestedRef.current || props.operation === "stopping",
  });

  useEffect(() => {
    previousRef.current = current;
    if (
      presentation?.announcement === "Response stopped" ||
      presentation?.intent === "alert"
    ) {
      stopRequestedRef.current = false;
    } else if (props.operation === "stopping") {
      stopRequestedRef.current = true;
    }
  }, [props.errorMessage, props.operation, props.sessionStatus]);

  return presentation ? (
    <ComposerLifecycleStatusElement {...presentation} />
  ) : null;
}
