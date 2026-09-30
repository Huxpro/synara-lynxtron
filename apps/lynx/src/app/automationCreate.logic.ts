import type {
  AutomationMode,
  AutomationCompletionPolicy,
  AutomationCreateInput,
  AutomationSchedule,
  AutomationWorktreeMode,
  ModelSelection,
  ProjectId,
  RuntimeMode,
  ProviderKind,
} from "@synara/contracts";
import { defaultModelSelectionForProvider } from "./defaultModelSelection.logic";

export type CreateWorktreeMode = AutomationWorktreeMode;

export function resolveAutomationModelSelection(input: {
  readonly projectModelSelection: ModelSelection | null | undefined;
  readonly defaultProvider: ProviderKind;
}): ModelSelection {
  return input.projectModelSelection ?? defaultModelSelectionForProvider(input.defaultProvider);
}

export function resolveAutomationModelSelectionForProjectChange(input: {
  readonly currentModelSelection: ModelSelection;
  readonly currentProjectModelSelection: ModelSelection | null | undefined;
  readonly nextProjectModelSelection: ModelSelection | null | undefined;
  readonly defaultProvider: ProviderKind;
}): ModelSelection {
  const currentDefault = resolveAutomationModelSelection({
    projectModelSelection: input.currentProjectModelSelection,
    defaultProvider: input.defaultProvider,
  });
  const nextDefault = resolveAutomationModelSelection({
    projectModelSelection: input.nextProjectModelSelection,
    defaultProvider: input.defaultProvider,
  });
  const sameOptions =
    JSON.stringify(input.currentModelSelection.options ?? null) ===
    JSON.stringify(currentDefault.options ?? null);
  return input.currentModelSelection.provider === currentDefault.provider &&
    input.currentModelSelection.model === currentDefault.model &&
    sameOptions
    ? nextDefault
    : input.currentModelSelection;
}

export function buildAutomationCreateInput(input: {
  readonly acknowledgeLocalCheckout: boolean;
  readonly acknowledgeFastInterval: boolean;
  readonly interactionMode: NonNullable<AutomationCreateInput["interactionMode"]>;
  readonly completionPolicy: AutomationCompletionPolicy;
  readonly maxIterations: number | null;
  readonly mode: AutomationMode;
  readonly modelSelection: ModelSelection;
  readonly name: string;
  readonly projectId: ProjectId;
  readonly prompt: string;
  readonly runtimeMode: RuntimeMode;
  readonly schedule: AutomationSchedule;
  readonly targetThreadId: AutomationCreateInput["targetThreadId"];
  readonly worktreeMode: CreateWorktreeMode;
}): AutomationCreateInput {
  return {
    projectId: input.projectId,
    sourceThreadId: null,
    name: input.name.trim(),
    prompt: input.prompt.trim(),
    schedule: input.schedule,
    enabled: true,
    modelSelection: input.modelSelection,
    runtimeMode: input.runtimeMode,
    interactionMode: input.interactionMode,
    worktreeMode: input.worktreeMode,
    mode: input.mode,
    targetThreadId: input.mode === "heartbeat" ? input.targetThreadId : null,
    maxIterations: input.maxIterations,
    completionPolicy: input.mode === "heartbeat" ? input.completionPolicy : { type: "none" },
    minimumIntervalSeconds: 60,
    maxRuntimeSeconds: 3600,
    retryPolicy: { type: "none" },
    misfirePolicy: "coalesce",
    acknowledgedRisks: [
      ...(input.runtimeMode === "full-access" ? ["full-access" as const] : []),
      ...(input.mode === "standalone" &&
      input.acknowledgeLocalCheckout &&
      (input.worktreeMode === "auto" || input.worktreeMode === "local")
        ? ["local-checkout" as const]
        : []),
      ...(input.acknowledgeFastInterval ? ["fast-interval" as const] : []),
    ],
  };
}
