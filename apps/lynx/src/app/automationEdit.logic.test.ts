import type { AutomationDefinition } from '@synara/contracts';
import { describe, expect, it } from '@rstest/core';

import {
  automationEditIsDirty,
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
      stopWhen: 'Original stop condition',
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
        definition: current,
        name: current.name,
        prompt: current.prompt,
        stopWhen: '   ',
      })
    ).toMatchObject({
      completionPolicy: { type: 'none' },
    });
  });
});
