import type { ModelSelection, ProviderKind } from "@synara/contracts";
import { getDefaultModel } from "@synara/shared/model";

// Some providers (Pi) have no built-in default model; a `{ model: null }` selection is
// rejected by the server, so fall back to Codex's default instead.
export function defaultModelSelectionForProvider(provider: ProviderKind): ModelSelection {
  const model = getDefaultModel(provider);
  return model !== null
    ? { provider, model }
    : { provider: "codex", model: getDefaultModel("codex") };
}
