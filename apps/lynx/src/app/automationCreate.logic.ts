import type {
  AutomationMode,
  AutomationCreateInput,
  AutomationWorktreeMode,
  ModelSelection,
  ProviderInteractionMode,
  ProjectId,
  RuntimeMode,
} from '@synara/contracts';

export type CreateSchedule = 'daily' | 'manual' | 'weekdays';
export type CreateWorktreeMode = AutomationWorktreeMode;

export function buildAutomationCreateInput(input: {
  readonly interactionMode: ProviderInteractionMode;
  readonly maxIterations: number | null;
  readonly mode: AutomationMode;
  readonly modelSelection: ModelSelection;
  readonly name: string;
  readonly projectId: ProjectId;
  readonly prompt: string;
  readonly runtimeMode: RuntimeMode;
  readonly schedule: CreateSchedule;
  readonly stopOnError: boolean;
  readonly targetThreadId: AutomationCreateInput['targetThreadId'];
  readonly timeOfDay: string;
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
        : { type: input.schedule, timeOfDay: input.timeOfDay },
    enabled: true,
    modelSelection: input.modelSelection,
    runtimeMode: input.runtimeMode,
    interactionMode: input.interactionMode,
    worktreeMode: input.worktreeMode,
    mode: input.mode,
    targetThreadId:
      input.mode === 'heartbeat' ? input.targetThreadId : null,
    maxIterations: input.maxIterations,
    stopOnError: input.stopOnError,
    completionPolicy: { type: 'none' },
    minimumIntervalSeconds: 60,
    maxRuntimeSeconds: 3600,
    retryPolicy: { type: 'none' },
    misfirePolicy: 'coalesce',
    acknowledgedRisks: [
      ...(input.runtimeMode === 'full-access' ? ['full-access' as const] : []),
      ...(input.worktreeMode === 'local' ? ['local-checkout' as const] : []),
    ],
  };
}
