import type { ModelSelection, OrchestrationSession, ProviderKind } from "@synara/contracts";
import { isProviderKind } from "@synara-web/providerOrdering";

// Orchestration snapshots carry the running provider as `session.providerName`
// (the web store's normalized `session.provider` does not exist on them).
export function resolveSnapshotThreadProvider(thread: {
  readonly session: Pick<OrchestrationSession, "providerName"> | null;
  readonly modelSelection: Pick<ModelSelection, "provider">;
}): ProviderKind {
  const providerName = thread.session?.providerName;
  return providerName && isProviderKind(providerName)
    ? providerName
    : thread.modelSelection.provider;
}
