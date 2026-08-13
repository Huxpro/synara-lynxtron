import type {
  AutomationCreateInput,
  ModelSelection,
  ProjectId,
} from '@synara/contracts';

export type CreateSchedule = 'daily' | 'manual' | 'weekdays';
export type CreateWorktreeMode = 'auto' | 'worktree';

export function buildAutomationCreateInput(input: {
  readonly modelSelection: ModelSelection;
  readonly name: string;
  readonly projectId: ProjectId;
  readonly prompt: string;
  readonly schedule: CreateSchedule;
  readonly worktreeMode: CreateWorktreeMode;
}): AutomationCreateInput {
  return {
    projectId: input.projectId,
    sourceThreadId: null,
    name: input.name.trim(),
    prompt: input.prompt.trim(),
    schedule:
      input.schedule === 'manual'
        ? { type: 'manual' }
        : { type: input.schedule, timeOfDay: '09:00' },
    enabled: true,
    modelSelection: input.modelSelection,
    runtimeMode: 'approval-required',
    interactionMode: 'default',
    worktreeMode: input.worktreeMode,
    mode: 'standalone',
    targetThreadId: null,
    maxIterations: null,
    stopOnError: true,
    completionPolicy: { type: 'none' },
    minimumIntervalSeconds: 60,
    maxRuntimeSeconds: 3600,
    retryPolicy: { type: 'none' },
    misfirePolicy: 'coalesce',
    acknowledgedRisks: [],
  };
}
