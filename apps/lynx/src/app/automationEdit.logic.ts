import type {
  AutomationDefinition,
  AutomationSchedule,
  AutomationUpdateInput,
  ModelSelection,
} from '@synara/contracts';
import {
  completionPolicyFromStopWhen,
  stopWhenFromCompletionPolicy,
} from '@synara-web/lib/automationCompletionPolicy';

export function automationEditStopWhen(
  definition: AutomationDefinition
): string {
  return stopWhenFromCompletionPolicy(definition.completionPolicy);
}

export type AutomationEditScheduleKind = 'manual' | 'daily' | 'weekdays';

export function automationEditScheduleForKind(
  current: AutomationSchedule,
  kind: AutomationEditScheduleKind
): AutomationSchedule {
  if (kind === 'manual') return { type: 'manual' };
  const timedCurrent =
    current.type === 'daily' || current.type === 'weekdays' ? current : null;
  return {
    type: kind,
    timeOfDay: timedCurrent?.timeOfDay ?? '09:00',
    ...(timedCurrent?.timezone ? { timezone: timedCurrent.timezone } : {}),
  };
}

function automationSchedulesEqual(
  left: AutomationSchedule,
  right: AutomationSchedule
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function automationModelSelectionsEqual(
  left: ModelSelection,
  right: ModelSelection
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function buildAutomationEditInput(input: {
  readonly definition: AutomationDefinition;
  readonly name: string;
  readonly prompt: string;
  readonly stopWhen: string;
  readonly schedule: AutomationSchedule;
  readonly modelSelection: ModelSelection;
  readonly maxIterations: number | null;
}): AutomationUpdateInput {
  const name = input.name.trim();
  const prompt = input.prompt.trim();
  const stopWhen = input.stopWhen.trim();
  const initialStopWhen = automationEditStopWhen(input.definition);

  return {
    id: input.definition.id,
    name,
    prompt,
    ...(!automationModelSelectionsEqual(
      input.modelSelection,
      input.definition.modelSelection
    )
      ? { modelSelection: input.modelSelection }
      : {}),
    ...(!automationSchedulesEqual(input.schedule, input.definition.schedule)
      ? { schedule: input.schedule }
      : {}),
    ...(input.definition.mode === 'heartbeat' &&
    stopWhen !== initialStopWhen
      ? { completionPolicy: completionPolicyFromStopWhen(stopWhen) }
      : {}),
    ...(input.maxIterations !== input.definition.maxIterations
      ? { maxIterations: input.maxIterations }
      : {}),
  };
}

export function automationEditIsDirty(input: {
  readonly definition: AutomationDefinition;
  readonly name: string;
  readonly prompt: string;
  readonly stopWhen: string;
  readonly schedule: AutomationSchedule;
  readonly modelSelection: ModelSelection;
  readonly maxIterations: number | null;
}): boolean {
  return (
    input.name.trim() !== input.definition.name ||
    input.prompt.trim() !== input.definition.prompt ||
    !automationModelSelectionsEqual(
      input.modelSelection,
      input.definition.modelSelection
    ) ||
    !automationSchedulesEqual(input.schedule, input.definition.schedule) ||
    input.maxIterations !== input.definition.maxIterations ||
    (input.definition.mode === 'heartbeat' &&
      input.stopWhen.trim() !== automationEditStopWhen(input.definition))
  );
}
