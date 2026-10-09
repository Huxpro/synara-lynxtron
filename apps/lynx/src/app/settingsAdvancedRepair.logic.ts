import type { OrchestrationReadModel } from "@synara/contracts";

export async function repairAdvancedSettingsState(input: {
  readonly repair: () => Promise<OrchestrationReadModel>;
  readonly sync: (snapshot: OrchestrationReadModel) => void;
}): Promise<void> {
  const repairedSnapshot = await input.repair();
  input.sync(repairedSnapshot);
}
