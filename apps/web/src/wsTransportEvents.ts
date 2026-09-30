// FILE: wsTransportEvents.ts
// Purpose: Publish renderer-local WebSocket transport state changes to UI runtimes.
// Layer: Web transport utility
// Exports: event helpers used by wsNativeApi and terminal runtime recovery.

import type { WsCompatibilityError } from "@synara/contracts";

import { isBrowser } from "~/platform/env";
import {
  addWindowEventListener,
  dispatchWindowEvent,
  removeWindowEventListener,
} from "~/platform/events";
export type WsTransportState = "connecting" | "open" | "closed" | "incompatible" | "disposed";

export const SYNARA_WS_TRANSPORT_STATE_EVENT = "synara:ws-transport-state";
export const SYNARA_WS_COMPATIBILITY_ISSUE_EVENT = "synara:ws-compatibility-issue";

let latestCompatibilityIssue: WsCompatibilityError | null = null;
let latestTransportState: WsTransportState | null = null;

export interface WsTransportStateEventDetail {
  state: WsTransportState;
}

export interface WsCompatibilityIssueEventDetail {
  issue: WsCompatibilityError | null;
}

// Emits a browser-local event without leaking transport internals into UI code.
export function emitWsTransportState(state: WsTransportState): void {
  latestTransportState = state;
  if (!isBrowser() || typeof CustomEvent === "undefined") {
    return;
  }

  dispatchWindowEvent(
    new CustomEvent<WsTransportStateEventDetail>(SYNARA_WS_TRANSPORT_STATE_EVENT, {
      detail: { state },
    }),
  );
}

// Subscribes to the shared transport state event. Returns an idempotent cleanup.
export function addWsTransportStateListener(
  listener: (state: WsTransportState) => void,
  options?: { readonly replayCurrent?: boolean },
): () => void {
  if (options?.replayCurrent && latestTransportState) {
    listener(latestTransportState);
  }
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStateChange = (event: Event) => {
    const detail = (event as CustomEvent<WsTransportStateEventDetail>).detail;
    if (!detail) return;
    listener(detail.state);
  };

  addWindowEventListener(SYNARA_WS_TRANSPORT_STATE_EVENT, handleStateChange);
  return () => {
    removeWindowEventListener(SYNARA_WS_TRANSPORT_STATE_EVENT, handleStateChange);
  };
}

export function readLatestWsCompatibilityIssue(): WsCompatibilityError | null {
  return latestCompatibilityIssue;
}

export function emitWsCompatibilityIssue(issue: WsCompatibilityError | null): void {
  latestCompatibilityIssue = issue;
  if (!isBrowser() || typeof CustomEvent === "undefined") {
    return;
  }
  dispatchWindowEvent(
    new CustomEvent<WsCompatibilityIssueEventDetail>(SYNARA_WS_COMPATIBILITY_ISSUE_EVENT, {
      detail: { issue },
    }),
  );
}

export function addWsCompatibilityIssueListener(
  listener: (issue: WsCompatibilityError | null) => void,
  options?: { readonly replayCurrent?: boolean },
): () => void {
  if (options?.replayCurrent) listener(latestCompatibilityIssue);
  if (!isBrowser()) {
    return () => undefined;
  }
  const handleIssue = (event: Event) => {
    const detail = (event as CustomEvent<WsCompatibilityIssueEventDetail>).detail;
    if (!detail) return;
    listener(detail.issue);
  };
  addWindowEventListener(SYNARA_WS_COMPATIBILITY_ISSUE_EVENT, handleIssue);
  return () => {
    removeWindowEventListener(SYNARA_WS_COMPATIBILITY_ISSUE_EVENT, handleIssue);
  };
}
