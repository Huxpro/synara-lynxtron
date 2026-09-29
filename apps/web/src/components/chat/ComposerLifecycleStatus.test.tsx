import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  resolveComposerLifecycleTransition,
  type ComposerLifecycleSnapshot,
} from "./ComposerLifecycleStatus";
import { ComposerLifecycleStatusElement } from "./ComposerLifecycleStatusElements";

const idle: ComposerLifecycleSnapshot = {
  operation: "idle",
  sessionStatus: "ready",
};

describe("composer lifecycle status", () => {
  it("fails closed on mount and only reports discrete transitions", () => {
    expect(
      resolveComposerLifecycleTransition({
        current: idle,
        includeFailure: true,
        previous: null,
      }),
    ).toBeNull();
    expect(
      resolveComposerLifecycleTransition({
        current: { operation: "sending", sessionStatus: "ready" },
        includeFailure: true,
        previous: idle,
      }),
    ).toEqual({ announcement: "Sending message", intent: "status" });
    expect(
      resolveComposerLifecycleTransition({
        current: { operation: "idle", sessionStatus: "running" },
        includeFailure: true,
        previous: { operation: "sending", sessionStatus: "starting" },
      }),
    ).toEqual({ announcement: "Response started", intent: "status" });
    expect(
      resolveComposerLifecycleTransition({
        current: idle,
        includeFailure: true,
        previous: { operation: "idle", sessionStatus: "running" },
      }),
    ).toEqual({ announcement: "Response complete", intent: "status" });
  });

  it("separates stop and failure without repeating unchanged errors", () => {
    expect(
      resolveComposerLifecycleTransition({
        current: { operation: "stopping", sessionStatus: "running" },
        includeFailure: true,
        previous: { operation: "idle", sessionStatus: "running" },
      }),
    ).toEqual({ announcement: "Stopping response", intent: "status" });
    expect(
      resolveComposerLifecycleTransition({
        current: { operation: "idle", sessionStatus: "interrupted" },
        includeFailure: true,
        previous: { operation: "stopping", sessionStatus: "running" },
      }),
    ).toEqual({ announcement: "Response stopped", intent: "status" });
    expect(
      resolveComposerLifecycleTransition({
        current: idle,
        includeFailure: true,
        previous: { operation: "idle", sessionStatus: "running" },
        stopRequested: true,
      }),
    ).toEqual({ announcement: "Response stopped", intent: "status" });
    expect(
      resolveComposerLifecycleTransition({
        current: { operation: "stopping", sessionStatus: "ready" },
        includeFailure: true,
        previous: { operation: "idle", sessionStatus: "running" },
      }),
    ).toEqual({ announcement: "Response stopped", intent: "status" });
    const failure = {
      errorMessage: "Unable to send. Your draft is still here.",
      operation: "error" as const,
      sessionStatus: "ready",
    };
    expect(
      resolveComposerLifecycleTransition({
        current: failure,
        includeFailure: true,
        previous: idle,
      }),
    ).toEqual({
      announcement: "Unable to send. Your draft is still here.",
      intent: "alert",
    });
    expect(
      resolveComposerLifecycleTransition({
        current: failure,
        includeFailure: true,
        previous: failure,
      }),
    ).toBeNull();
    expect(
      resolveComposerLifecycleTransition({
        current: failure,
        includeFailure: false,
        previous: idle,
      }),
    ).toBeNull();
  });

  it("maps status and failure transitions to the Web live-region contract", () => {
    const statusMarkup = renderToStaticMarkup(
      <ComposerLifecycleStatusElement announcement="Response complete" intent="status" />,
    );
    const alertMarkup = renderToStaticMarkup(
      <ComposerLifecycleStatusElement announcement="Response failed." intent="alert" />,
    );
    expect(statusMarkup).toContain('role="status"');
    expect(statusMarkup).toContain('aria-live="polite"');
    expect(alertMarkup).toContain('role="alert"');
    expect(alertMarkup).toContain('aria-live="assertive"');
  });
});
