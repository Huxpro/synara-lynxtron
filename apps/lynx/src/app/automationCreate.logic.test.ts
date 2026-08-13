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
});
