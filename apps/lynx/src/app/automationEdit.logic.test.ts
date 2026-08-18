import type { AutomationDefinition } from '@synara/contracts';
import { describe, expect, it } from '@rstest/core';

import {
  automationEditIsDirty,
  automationEditScheduleForKind,
  buildAutomationEditInput,
} from './automationEdit.logic';

function definition(
  overrides: Partial<AutomationDefinition> = {}
): AutomationDefinition {
  return {
    id: 'automation-1',
    projectId: 'project-1',
    sourceThreadId: null,
    name: 'Heartbeat edit proof',
    prompt: 'Inspect edit parity',
    schedule: { type: 'daily', timeOfDay: '09:00' },
    enabled: true,
    nextRunAt: null,
    modelSelection: { provider: 'codex', model: 'gpt-5.6-sol' },
    runtimeMode: 'approval-required',
    interactionMode: 'default',
    worktreeMode: 'auto',
    mode: 'heartbeat',
    targetThreadId: 'thread-1',
    maxIterations: null,
    stopOnError: true,
    completionPolicy: {
      type: 'ai-evaluated',
      stopWhen: 'Original stop condition',
      confidenceThreshold: 0.8,
    },
    completionPolicyVersion: 1,
    completionPolicyUpdatedAt: null,
    minimumIntervalSeconds: 60,
    maxRuntimeSeconds: 3600,
    retryPolicy: { type: 'none' },
    misfirePolicy: 'coalesce',
    acknowledgedRisks: [],
    iterationCount: 0,
    createdAt: '2026-08-16T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z',
    archivedAt: null,
    ...overrides,
  } as AutomationDefinition;
}

function unchangedEditInput(current: AutomationDefinition) {
  return {
    definition: current,
    name: current.name,
    prompt: current.prompt,
    schedule: current.schedule,
    modelSelection: current.modelSelection,
    stopWhen: 'Original stop condition',
    maxIterations: current.maxIterations,
  };
}

describe('Automation edit payload', () => {
  it('does not rewrite an unchanged Heartbeat completion policy', () => {
    const current = definition();
    const input = unchangedEditInput(current);

    expect(automationEditIsDirty(input)).toBe(false);
    expect(buildAutomationEditInput(input)).toEqual({
      id: current.id,
      name: current.name,
      prompt: current.prompt,
    });
  });

  it('updates a changed Heartbeat stop condition', () => {
    const current = definition();
    const input = {
      ...unchangedEditInput(current),
      stopWhen: '  Updated stop condition  ',
    };

    expect(automationEditIsDirty(input)).toBe(true);
    expect(buildAutomationEditInput(input)).toMatchObject({
      completionPolicy: {
        type: 'ai-evaluated',
        stopWhen: 'Updated stop condition',
        confidenceThreshold: 0.8,
      },
    });
  });

  it('clears the Heartbeat completion policy with an empty condition', () => {
    const current = definition();

    expect(
      buildAutomationEditInput({
        ...unchangedEditInput(current),
        stopWhen: '   ',
      })
    ).toMatchObject({
      completionPolicy: { type: 'none' },
    });
  });

  it('updates Max iterations without rewriting the completion policy', () => {
    const current = definition();
    const input = {
      ...unchangedEditInput(current),
      maxIterations: 10,
    };

    expect(automationEditIsDirty(input)).toBe(true);
    expect(buildAutomationEditInput(input)).toEqual({
      id: current.id,
      name: current.name,
      prompt: current.prompt,
      maxIterations: 10,
    });
  });

  it('updates Repeats without rewriting unrelated fields', () => {
    const current = definition();
    const schedule = automationEditScheduleForKind(current.schedule, 'weekdays');

    expect(schedule).toEqual({
      type: 'weekdays',
      timeOfDay: '09:00',
    });
    expect(
      buildAutomationEditInput({
        ...unchangedEditInput(current),
        schedule,
      })
    ).toEqual({
      id: current.id,
      name: current.name,
      prompt: current.prompt,
      schedule,
    });
  });

  it('preserves timed schedule details across daily and weekday edits', () => {
    expect(
      automationEditScheduleForKind(
        {
          type: 'daily',
          timeOfDay: '14:30',
          timezone: 'Asia/Seoul',
        },
        'weekdays'
      )
    ).toEqual({
      type: 'weekdays',
      timeOfDay: '14:30',
      timezone: 'Asia/Seoul',
    });
    expect(
      automationEditScheduleForKind({ type: 'manual' }, 'daily')
    ).toEqual({
      type: 'daily',
      timeOfDay: '09:00',
    });
  });

  it('updates a timezone-aware timed schedule without rewriting other fields', () => {
    const current = definition({
      schedule: {
        type: 'daily',
        timeOfDay: '09:00',
        timezone: 'Asia/Seoul',
      },
    });
    const schedule = {
      ...current.schedule,
      timezone: 'Europe/Rome',
    };

    expect(
      buildAutomationEditInput({
        ...unchangedEditInput(current),
        schedule,
      })
    ).toEqual({
      id: current.id,
      name: current.name,
      prompt: current.prompt,
      schedule,
    });
  });

  it('updates the selected model and reasoning options without rewriting other fields', () => {
    const current = definition();
    const modelSelection = {
      provider: 'codex',
      model: 'gpt-5.6-sol',
      options: { reasoningEffort: 'high' },
    } as const;

    expect(
      buildAutomationEditInput({
        ...unchangedEditInput(current),
        modelSelection,
      })
    ).toEqual({
      id: current.id,
      name: current.name,
      prompt: current.prompt,
      modelSelection,
    });
  });
});
