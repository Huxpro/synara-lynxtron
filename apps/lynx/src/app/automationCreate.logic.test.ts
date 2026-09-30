import { describe, expect, it } from "@rstest/core";

import {
  buildAutomationCreateInput,
  resolveAutomationModelSelection,
  resolveAutomationModelSelectionForProjectChange,
} from "./automationCreate.logic";

const modelSelection = {
  provider: "codex",
  model: "gpt-5.6-sol",
} as const;

describe("Automation create payload", () => {
  it("uses the project model before the saved default provider", () => {
    expect(
      resolveAutomationModelSelection({
        projectModelSelection: modelSelection,
        defaultProvider: "claudeAgent",
      }),
    ).toBe(modelSelection);
  });

  it("falls back to the saved default provider when the project has no model", () => {
    expect(
      resolveAutomationModelSelection({
        projectModelSelection: null,
        defaultProvider: "claudeAgent",
      }),
    ).toMatchObject({
      provider: "claudeAgent",
    });
  });

  it("follows the next project default until the user customizes the model", () => {
    const nextProjectModel = {
      provider: "claudeAgent",
      model: "claude-opus-4-8",
    } as const;
    expect(
      resolveAutomationModelSelectionForProjectChange({
        currentModelSelection: modelSelection,
        currentProjectModelSelection: modelSelection,
        nextProjectModelSelection: nextProjectModel,
        defaultProvider: "codex",
      }),
    ).toBe(nextProjectModel);

    const customModel = {
      provider: "codex",
      model: "gpt-5.6-sol-custom",
    } as const;
    expect(
      resolveAutomationModelSelectionForProjectChange({
        currentModelSelection: customModel,
        currentProjectModelSelection: modelSelection,
        nextProjectModelSelection: nextProjectModel,
        defaultProvider: "codex",
      }),
    ).toBe(customModel);
  });

  it.each([
    ["manual", { type: "manual" }],
    ["once", { type: "once", runAt: "2026-09-14T13:00:00.000Z" }],
    ["hourly", { type: "interval", everySeconds: 3600 }],
    ["daily", { type: "daily", timeOfDay: "14:30", timezone: "America/New_York" }],
    ["weekdays", { type: "weekdays", timeOfDay: "14:30", timezone: "America/New_York" }],
    ["weekly", { type: "weekly", dayOfWeek: 1, timeOfDay: "14:30", timezone: "America/New_York" }],
    ["custom", { type: "interval", everySeconds: 1800 }],
    ["cron", { type: "cron", expression: "0 9 * * *", timezone: "America/New_York" }],
  ] as const)("preserves the %s schedule contract", (_label, schedule) => {
    expect(
      buildAutomationCreateInput({
        acknowledgeFastInterval: false,
        acknowledgeLocalCheckout: false,
        completionPolicy: { type: "none" },
        interactionMode: "plan",
        projectId: "project-1",
        maxIterations: 25,
        mode: "standalone",
        modelSelection,
        name: "  Release review  ",
        prompt: "  Check regressions.  ",
        runtimeMode: "approval-required",
        schedule,
        targetThreadId: null,
        worktreeMode: "worktree",
      }),
    ).toMatchObject({
      projectId: "project-1",
      name: "Release review",
      prompt: "Check regressions.",
      schedule,
      worktreeMode: "worktree",
      runtimeMode: "approval-required",
      interactionMode: "plan",
      maxIterations: 25,
    });
  });

  it.each(["auto", "local", "worktree"] as const)(
    "preserves the %s workspace mode",
    (worktreeMode) => {
      const result = buildAutomationCreateInput({
        acknowledgeFastInterval: false,
        acknowledgeLocalCheckout: worktreeMode === "local",
        completionPolicy: { type: "none" },
        interactionMode: "default",
        projectId: "project-1",
        maxIterations: null,
        mode: "standalone",
        modelSelection,
        name: "Workspace mode",
        prompt: "Check the selected workspace mode.",
        runtimeMode: "approval-required",
        schedule: { type: "manual" },
        targetThreadId: null,
        worktreeMode,
      });

      expect(result.worktreeMode).toBe(worktreeMode);
      expect(result.acknowledgedRisks).toEqual(worktreeMode === "local" ? ["local-checkout"] : []);
    },
  );

  it.each([
    ["approval-required", "auto", []],
    ["approval-required", "local", ["local-checkout"]],
    ["full-access", "auto", ["full-access"]],
    ["full-access", "local", ["full-access", "local-checkout"]],
  ] as const)(
    "maps %s with %s workspace to the required risk acknowledgements",
    (runtimeMode, worktreeMode, acknowledgedRisks) => {
      const result = buildAutomationCreateInput({
        acknowledgeFastInterval: false,
        acknowledgeLocalCheckout: worktreeMode === "local",
        completionPolicy: { type: "none" },
        interactionMode: "default",
        projectId: "project-1",
        maxIterations: null,
        mode: "standalone",
        modelSelection,
        name: "Permission mode",
        prompt: "Verify automation permissions.",
        runtimeMode,
        schedule: { type: "manual" },
        targetThreadId: null,
        worktreeMode,
      });

      expect(result.runtimeMode).toBe(runtimeMode);
      expect(result.acknowledgedRisks).toEqual(acknowledgedRisks);
    },
  );

  it("keeps a heartbeat target and clears standalone targets", () => {
    const base = {
      acknowledgeFastInterval: false,
      acknowledgeLocalCheckout: true,
      completionPolicy: {
        type: "ai-evaluated" as const,
        stopWhen: "PR is ready to merge",
        confidenceThreshold: 0.8,
      },
      interactionMode: "default" as const,
      projectId: "project-1" as const,
      maxIterations: null,
      modelSelection,
      name: "Continue a thread",
      prompt: "Keep working.",
      runtimeMode: "approval-required" as const,
      schedule: { type: "manual" as const },
      worktreeMode: "auto" as const,
    };

    expect(
      buildAutomationCreateInput({
        ...base,
        mode: "heartbeat",
        targetThreadId: "thread-1",
      }),
    ).toMatchObject({
      completionPolicy: {
        type: "ai-evaluated",
        stopWhen: "PR is ready to merge",
        confidenceThreshold: 0.8,
      },
      mode: "heartbeat",
      targetThreadId: "thread-1",
    });
    expect(
      buildAutomationCreateInput({
        ...base,
        mode: "standalone",
        targetThreadId: "thread-1",
      }),
    ).toMatchObject({
      completionPolicy: { type: "none" },
      mode: "standalone",
      targetThreadId: null,
    });
  });

  it("persists fast-interval acknowledgement for short custom schedules", () => {
    const result = buildAutomationCreateInput({
      acknowledgeFastInterval: true,
      acknowledgeLocalCheckout: false,
      completionPolicy: { type: "none" },
      interactionMode: "default",
      projectId: "project-1",
      maxIterations: 10,
      mode: "standalone",
      modelSelection,
      name: "Fast loop",
      prompt: "Check frequently.",
      runtimeMode: "approval-required",
      schedule: { type: "interval", everySeconds: 30 },
      targetThreadId: null,
      worktreeMode: "worktree",
    });

    expect(result.acknowledgedRisks).toEqual(["fast-interval"]);
  });
});
