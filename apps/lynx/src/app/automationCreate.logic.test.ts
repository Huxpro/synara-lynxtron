import { describe, expect, it } from '@rstest/core';

import {
  buildAutomationCreateInput,
  resolveAutomationModelSelection,
  resolveAutomationModelSelectionForProjectChange,
} from './automationCreate.logic';

const modelSelection = {
  provider: 'codex',
  model: 'gpt-5.6-sol',
} as const;

describe('Automation create payload', () => {
  it('uses the project model before the saved default provider', () => {
    expect(
      resolveAutomationModelSelection({
        projectModelSelection: modelSelection,
        defaultProvider: 'claudeAgent',
      }),
    ).toBe(modelSelection);
  });

  it('falls back to the saved default provider when the project has no model', () => {
    expect(
      resolveAutomationModelSelection({
        projectModelSelection: null,
        defaultProvider: 'claudeAgent',
      }),
    ).toMatchObject({
      provider: 'claudeAgent',
    });
  });

  it('follows the next project default until the user customizes the model', () => {
    const nextProjectModel = {
      provider: 'claudeAgent',
      model: 'claude-opus-4-8',
    } as const;
    expect(
      resolveAutomationModelSelectionForProjectChange({
        currentModelSelection: modelSelection,
        currentProjectModelSelection: modelSelection,
        nextProjectModelSelection: nextProjectModel,
        defaultProvider: 'codex',
      }),
    ).toBe(nextProjectModel);

    const customModel = {
      provider: 'codex',
      model: 'gpt-5.6-sol-custom',
    } as const;
    expect(
      resolveAutomationModelSelectionForProjectChange({
        currentModelSelection: customModel,
        currentProjectModelSelection: modelSelection,
        nextProjectModelSelection: nextProjectModel,
        defaultProvider: 'codex',
      }),
    ).toBe(customModel);
  });

  it.each([
    ['manual', { type: 'manual' }],
    ['daily', { type: 'daily', timeOfDay: '09:00' }],
    ['weekdays', { type: 'weekdays', timeOfDay: '09:00' }],
  ] as const)('maps %s schedules to the canonical contract', (schedule, expected) => {
    expect(
      buildAutomationCreateInput({
        acknowledgeLocalCheckout: false,
        completionPolicy: { type: 'none' },
        interactionMode: 'plan',
        projectId: 'project-1',
        maxIterations: 25,
        mode: 'standalone',
        modelSelection,
        name: '  Release review  ',
        prompt: '  Check regressions.  ',
        runtimeMode: 'approval-required',
        schedule,
        stopOnError: false,
        targetThreadId: null,
        timeOfDay: '14:30',
        worktreeMode: 'worktree',
      }),
    ).toMatchObject({
      projectId: 'project-1',
      name: 'Release review',
      prompt: 'Check regressions.',
      schedule:
        schedule === 'manual'
          ? expected
          : { ...expected, timeOfDay: '14:30' },
      worktreeMode: 'worktree',
      runtimeMode: 'approval-required',
      interactionMode: 'plan',
      maxIterations: 25,
      stopOnError: false,
    });
  });

  it.each(['auto', 'local', 'worktree'] as const)(
    'preserves the %s workspace mode',
    (worktreeMode) => {
      const result = buildAutomationCreateInput({
          acknowledgeLocalCheckout: worktreeMode === 'local',
          completionPolicy: { type: 'none' },
          interactionMode: 'default',
          projectId: 'project-1',
          maxIterations: null,
          mode: 'standalone',
          modelSelection,
          name: 'Workspace mode',
          prompt: 'Check the selected workspace mode.',
          runtimeMode: 'approval-required',
          schedule: 'manual',
          stopOnError: true,
          targetThreadId: null,
          timeOfDay: '09:00',
          worktreeMode,
        });

      expect(result.worktreeMode).toBe(worktreeMode);
      expect(result.acknowledgedRisks).toEqual(
        worktreeMode === 'local' ? ['local-checkout'] : [],
      );
    },
  );

  it.each([
    ['approval-required', 'auto', []],
    ['approval-required', 'local', ['local-checkout']],
    ['full-access', 'auto', ['full-access']],
    ['full-access', 'local', ['full-access', 'local-checkout']],
  ] as const)(
    'maps %s with %s workspace to the required risk acknowledgements',
    (runtimeMode, worktreeMode, acknowledgedRisks) => {
      const result = buildAutomationCreateInput({
        acknowledgeLocalCheckout: worktreeMode === 'local',
        completionPolicy: { type: 'none' },
        interactionMode: 'default',
        projectId: 'project-1',
        maxIterations: null,
        mode: 'standalone',
        modelSelection,
        name: 'Permission mode',
        prompt: 'Verify automation permissions.',
        runtimeMode,
        schedule: 'manual',
        stopOnError: true,
        targetThreadId: null,
        timeOfDay: '09:00',
        worktreeMode,
      });

      expect(result.runtimeMode).toBe(runtimeMode);
      expect(result.acknowledgedRisks).toEqual(acknowledgedRisks);
    },
  );

  it('keeps a heartbeat target and clears standalone targets', () => {
    const base = {
      acknowledgeLocalCheckout: true,
      completionPolicy: {
        type: 'ai-evaluated' as const,
        stopWhen: 'PR is ready to merge',
        confidenceThreshold: 0.8,
      },
      interactionMode: 'default' as const,
      projectId: 'project-1' as const,
      maxIterations: null,
      modelSelection,
      name: 'Continue a thread',
      prompt: 'Keep working.',
      runtimeMode: 'approval-required' as const,
      schedule: 'manual' as const,
      stopOnError: true,
      timeOfDay: '09:00',
      worktreeMode: 'auto' as const,
    };

    expect(
      buildAutomationCreateInput({
        ...base,
        mode: 'heartbeat',
        targetThreadId: 'thread-1',
      }),
    ).toMatchObject({
      completionPolicy: {
        type: 'ai-evaluated',
        stopWhen: 'PR is ready to merge',
        confidenceThreshold: 0.8,
      },
      mode: 'heartbeat',
      targetThreadId: 'thread-1',
    });
    expect(
      buildAutomationCreateInput({
        ...base,
        mode: 'standalone',
        targetThreadId: 'thread-1',
      }),
    ).toMatchObject({
      completionPolicy: { type: 'none' },
      mode: 'standalone',
      targetThreadId: null,
    });
  });
});
