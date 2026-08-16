import type {
  AutomationDefinition,
  AutomationUpdateInput,
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

export function buildAutomationEditInput(input: {
  readonly definition: AutomationDefinition;
  readonly name: string;
  readonly prompt: string;
  readonly stopWhen: string;
}): AutomationUpdateInput {
  const name = input.name.trim();
  const prompt = input.prompt.trim();
  const stopWhen = input.stopWhen.trim();
  const initialStopWhen = automationEditStopWhen(input.definition);

  return {
    id: input.definition.id,
    name,
    prompt,
    ...(input.definition.mode === 'heartbeat' &&
    stopWhen !== initialStopWhen
      ? { completionPolicy: completionPolicyFromStopWhen(stopWhen) }
      : {}),
  };
}

export function automationEditIsDirty(input: {
  readonly definition: AutomationDefinition;
  readonly name: string;
  readonly prompt: string;
  readonly stopWhen: string;
}): boolean {
  return (
    input.name.trim() !== input.definition.name ||
    input.prompt.trim() !== input.definition.prompt ||
    (input.definition.mode === 'heartbeat' &&
      input.stopWhen.trim() !== automationEditStopWhen(input.definition))
  );
}
