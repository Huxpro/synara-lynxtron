import type { OrchestrationReadModel } from "@synara/contracts";

export async function repairAdvancedSettingsState(input: {
  readonly repair: () => Promise<OrchestrationReadModel>;
  readonly sync: (snapshot: OrchestrationReadModel) => void;
  readonly invalidate: () => Promise<unknown>;
}): Promise<void> {
  const repairedSnapshot = await input.repair();
  input.sync(repairedSnapshot);
  await input.invalidate();
}
