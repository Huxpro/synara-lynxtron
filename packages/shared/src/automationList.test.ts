import type { AutomationDefinition, AutomationListResult, AutomationRun } from "@synara/contracts";
import { AutomationId, ThreadId } from "@synara/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatAutomationCadence,
  formatAutomationRunTimestamp,
  projectAutomationDetail,
  projectAutomationList,
} from "./automationList";

function definition(overrides: Partial<AutomationDefinition> = {}): AutomationDefinition {
  return {
    id: "automation-1",
    projectId: "project-1",
    sourceThreadId: null,
    name: "Daily review",
    prompt: "Review the repository",
    schedule: { type: "daily", timeOfDay: "09:00" },
    enabled: true,
    nextRunAt: "2026-08-15T01:00:00.000Z",
    modelSelection: { provider: "codex", model: null, options: {} },
    runtimeMode: "approval-required",
    interactionMode: "default",
    worktreeMode: "auto",
    mode: "standalone",
    targetThreadId: null,
    maxIterations: null,
    stopOnError: false,
    completionPolicy: { type: "none" },
    completionPolicyVersion: 0,
    completionPolicyUpdatedAt: "2026-08-14T00:00:00.000Z",
    minimumIntervalSeconds: 60,
    maxRuntimeSeconds: 3600,
    retryPolicy: { type: "none" },
    misfirePolicy: "coalesce",
    acknowledgedRisks: [],
    iterationCount: 0,
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
    archivedAt: null,
    ...overrides,
  } as AutomationDefinition;
}

function run(overrides: Partial<AutomationRun> = {}): AutomationRun {
  return {
    id: "run-1",
    automationId: "automation-1",
    projectId: "project-1",
    threadId: "thread-1",
    turnId: null,
    trigger: { type: "manual" },
    status: "succeeded",
    scheduledFor: "2026-08-14T08:00:00.000Z",
    claimedBy: null,
    claimedAt: null,
    leaseExpiresAt: null,
    startedAt: "2026-08-14T08:00:00.000Z",
    finishedAt: "2026-08-14T08:01:00.000Z",
    threadCreateCommandId: null,
    turnStartCommandId: null,
    messageId: null,
    error: null,
    result: {
      outcome: "findings",
      summary: "Found an actionable regression",
      unread: true,
      archivedAt: null,
    },
    permissionSnapshot: {
      runtimeMode: "approval-required",
      interactionMode: "default",
      provider: "codex",
      model: null,
      providerOptions: {},
      worktreeMode: "auto",
      allowedCapabilities: [],
      createdAt: "2026-08-14T08:00:00.000Z",
    },
    createdAt: "2026-08-14T08:00:00.000Z",
    updatedAt: "2026-08-14T08:01:00.000Z",
    ...overrides,
  } as AutomationRun;
}

describe("automation list projection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("projects current, paused, heartbeat, and unread triage rows", () => {
    const data: AutomationListResult = {
      definitions: [
        definition(),
        definition({
          id: AutomationId.makeUnsafe("automation-2"),
          name: "Heartbeat check",
          enabled: false,
          mode: "heartbeat",
          targetThreadId: ThreadId.makeUnsafe("thread-1"),
          sourceThreadId: ThreadId.makeUnsafe("thread-source"),
        }),
      ],
      runs: [run()],
    };

    const projection = projectAutomationList({
      data,
      projects: [{ id: "project-1", name: "Synara" }],
      threads: [
        { id: "thread-1", title: "Fix fidelity" },
        { id: "thread-source", title: "Original task" },
      ],
      nowMs: Date.parse("2026-08-14T09:01:00.000Z"),
    });

    expect(projection.current[0]).toMatchObject({
      detail: "Synara",
      meta: "New result",
      tone: "attention",
    });
    expect(projection.paused[0]).toMatchObject({
      detail: "Heartbeat · Fix fidelity · From Original task",
      meta: "Paused",
      tone: "muted",
    });
    expect(projection.triage[0]).toMatchObject({
      title: "Daily review",
      detail: "Found an actionable regression",
      meta: "1h",
    });
    expect(projection.allTriage).toHaveLength(1);
    expect(projection.unreadTriageCount).toBe(1);
  });

  it("uses live run status ahead of cadence", () => {
    const data: AutomationListResult = {
      definitions: [definition()],
      runs: [run({ status: "running", result: null, finishedAt: null })],
    };
    expect(
      projectAutomationList({
        data,
        projects: [{ id: "project-1", name: "Synara" }],
        threads: [],
      }).current[0],
    ).toMatchObject({ meta: "Running", tone: "live" });
  });

  it("projects read-only detail status, metadata, and previous runs", () => {
    const detail = projectAutomationDetail({
      definition: definition({
        maxIterations: 5,
        modelSelection: {
          provider: "codex",
          model: "gpt-5.6-sol",
          options: {},
        },
      }),
      projectName: "Synara",
      runs: [run()],
      nowMs: Date.parse("2026-08-14T09:01:00.000Z"),
    });

    expect(detail).toMatchObject({
      status: "Active",
      projectName: "Synara",
      nextRunAt: "2026-08-15T01:00:00.000Z",
      lastRunAt: "2026-08-14T08:01:00.000Z",
      detailRows: expect.arrayContaining([
        { label: "Runs in", value: "Auto" },
        { label: "Project", value: "Synara" },
        { label: "Repeats", value: "Daily" },
        { label: "Time", value: "9:00" },
        { label: "Model", value: "GPT-5.6 Sol" },
        { label: "Max iterations", value: "5" },
      ]),
    });
    expect(detail.runs[0]).toMatchObject({
      title: "Completed",
      detail: "Found an actionable regression",
      meta: "1h",
    });
  });

  it("projects the Heartbeat stop condition into read-only detail", () => {
    const detail = projectAutomationDetail({
      definition: definition({
        mode: "heartbeat",
        targetThreadId: ThreadId.makeUnsafe("thread-1"),
        completionPolicy: {
          type: "ai-evaluated",
          stopWhen: "Thread reports COMPLETE",
          confidenceThreshold: 0.8,
        },
      }),
      projectName: "Synara",
      runs: [],
      targetThreadTitle: "Fix fidelity",
    });

    expect(detail.detailRows).toEqual(
      expect.arrayContaining([
        { label: "Mode", value: "Heartbeat" },
        { label: "Stop when", value: "Thread reports COMPLETE" },
        { label: "Thread", value: "Fix fidelity" },
      ]),
    );
  });

  it("formats detail timestamps relative to the current local day", () => {
    const now = new Date(2026, 7, 14, 12, 0, 0);
    expect(
      formatAutomationRunTimestamp(new Date(2026, 7, 14, 9, 30, 0).toISOString(), now.getTime()),
    ).toMatch(/^Today at /u);
    expect(
      formatAutomationRunTimestamp(new Date(2026, 7, 15, 9, 30, 0).toISOString(), now.getTime()),
    ).toMatch(/^Tomorrow at /u);
    expect(formatAutomationRunTimestamp(null, now.getTime())).toBe("—");
  });

  it("formats automation timestamps without Intl", () => {
    vi.stubGlobal("Intl", undefined);
    const now = new Date(2026, 7, 14, 12, 0, 0);

    expect(
      formatAutomationRunTimestamp(new Date(2026, 7, 14, 9, 30, 0).toISOString(), now.getTime()),
    ).toBe("Today at 09:30");
    expect(
      formatAutomationRunTimestamp(new Date(2026, 7, 20, 9, 30, 0).toISOString(), now.getTime()),
    ).toBe("20 Aug 2026, 09:30");
    expect(
      formatAutomationCadence({
        type: "once",
        runAt: new Date(2026, 7, 20, 9, 30, 0).toISOString(),
      }),
    ).toBe("20 Aug 2026, 09:30");
  });
});
