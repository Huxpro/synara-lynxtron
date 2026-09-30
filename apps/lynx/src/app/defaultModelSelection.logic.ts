// FILE: defaultModelSelection.logic.ts
// Purpose: A valid starting ModelSelection for a provider.
// Note: Providers with only discovered models (Pi, Oh My Pi) have no default slug. Electron
//       then leaves the model unset until the user picks one; Lynx surfaces that start from a
//       concrete selection, so they fall back to Codex's default instead.

import type { ModelSelection, ProviderKind } from "@synara/contracts";
import { getDefaultModel } from "@synara/shared/model";

export function defaultModelSelectionForProvider(provider: ProviderKind): ModelSelection {
  const model = getDefaultModel(provider);
  return model
    ? ({ provider, model } as ModelSelection)
    : { provider: "codex", model: getDefaultModel("codex") };
}
