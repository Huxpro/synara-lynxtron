import { describe, expect, it } from '@rstest/core';

import { buildAutomationCreateInput } from './automationCreate.logic';

const modelSelection = {
  provider: 'codex',
  model: 'gpt-5.6-sol',
} as const;

describe('Automation create payload', () => {
  it.each([
    ['manual', { type: 'manual' }],
    ['daily', { type: 'daily', timeOfDay: '09:00' }],
    ['weekdays', { type: 'weekdays', timeOfDay: '09:00' }],
  ] as const)('maps %s schedules to the canonical contract', (schedule, expected) => {
    expect(
      buildAutomationCreateInput({
        interactionMode: 'plan',
        projectId: 'project-1',
        maxIterations: 25,
        modelSelection,
        name: '  Release review  ',
        prompt: '  Check regressions.  ',
        runtimeMode: 'approval-required',
        schedule,
        stopOnError: false,
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
          interactionMode: 'default',
          projectId: 'project-1',
          maxIterations: null,
          modelSelection,
          name: 'Workspace mode',
          prompt: 'Check the selected workspace mode.',
          runtimeMode: 'approval-required',
          schedule: 'manual',
          stopOnError: true,
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
        interactionMode: 'default',
        projectId: 'project-1',
        maxIterations: null,
        modelSelection,
        name: 'Permission mode',
        prompt: 'Verify automation permissions.',
        runtimeMode,
        schedule: 'manual',
        stopOnError: true,
        timeOfDay: '09:00',
        worktreeMode,
      });

      expect(result.runtimeMode).toBe(runtimeMode);
      expect(result.acknowledgedRisks).toEqual(acknowledgedRisks);
    },
  );
});
