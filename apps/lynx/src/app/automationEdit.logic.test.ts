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

describe('Automation edit payload', () => {
  it('does not rewrite an unchanged Heartbeat completion policy', () => {
    const current = definition();
    const input = {
      definition: current,
      name: current.name,
      prompt: current.prompt,
      schedule: current.schedule,
      stopWhen: 'Original stop condition',
      maxIterations: null,
    };

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
      definition: current,
      name: current.name,
      prompt: current.prompt,
      schedule: current.schedule,
      stopWhen: '  Updated stop condition  ',
      maxIterations: null,
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
        definition: current,
        name: current.name,
        prompt: current.prompt,
        schedule: current.schedule,
        stopWhen: '   ',
        maxIterations: null,
      })
    ).toMatchObject({
      completionPolicy: { type: 'none' },
    });
  });

  it('updates Max iterations without rewriting the completion policy', () => {
    const current = definition();
    const input = {
      definition: current,
      name: current.name,
      prompt: current.prompt,
      schedule: current.schedule,
      stopWhen: 'Original stop condition',
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
        definition: current,
        name: current.name,
        prompt: current.prompt,
        schedule,
        stopWhen: 'Original stop condition',
        maxIterations: null,
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
});
