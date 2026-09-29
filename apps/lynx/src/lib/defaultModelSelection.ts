import type { ModelSelection, ProviderKind } from "@synara/contracts";
import { getDefaultModel } from "@synara/shared/model";

/**
 * Model selection for a brand-new project/thread on `provider`. Providers
 * without a built-in default model (Pi) fall back to Codex like the Web
 * composer (`resolvePreferredComposerModelSelection`): the server rejects a
 * `{ model: null }` selection.
 */
export function defaultModelSelectionForProvider(provider: ProviderKind): ModelSelection {
  const model = getDefaultModel(provider);
  return model !== null
    ? { provider, model }
    : { provider: "codex", model: getDefaultModel("codex") };
}
