// FILE: automationEditDialog.logic.ts
// Purpose: Form-to-update helpers for the Lynx automation edit dialog.
// Note: Electron replaced its edit dialog with inline field patches on the automation
//       detail page (upstream #655) and dropped these helpers. They stay here until the
//       inline editing UX is ported to Lynx.

import type {
  AutomationCreateInput,
  AutomationDefinition,
  AutomationUpdateInput,
  ProviderStartOptions,
} from "@synara/contracts";
import type { AutomationDraftWarningId } from "@synara-web/lib/automationDraft";
import {
  createInputFromForm,
  providerOptionsForAutomationModelSelection,
  type AutomationFormState,
} from "@synara-web/lib/automationForm";

export function warningIdsForAcknowledgedRisks(
  risks: AutomationDefinition["acknowledgedRisks"],
): ReadonlySet<AutomationDraftWarningId> {
  const ids = new Set<AutomationDraftWarningId>();
  for (const risk of risks) {
    ids.add(risk === "fast-interval" ? "fast-recurring-interval" : risk);
  }
  return ids;
}

export function providerOptionsForAutomationEdit(
  definition: Pick<AutomationDefinition, "modelSelection" | "providerOptions">,
  form: Pick<AutomationFormState, "modelSelection">,
  currentProviderOptions?: ProviderStartOptions,
): ProviderStartOptions | undefined {
  return providerOptionsForAutomationModelSelection(
    definition,
    form.modelSelection,
    currentProviderOptions,
  );
}

export function updateInputFromForm(
  definition: AutomationDefinition,
  form: AutomationFormState,
  providerOptions?: ProviderStartOptions,
  acknowledgedRisks?: AutomationCreateInput["acknowledgedRisks"],
): AutomationUpdateInput {
  return {
    id: definition.id,
    ...createInputFromForm(form, providerOptions, acknowledgedRisks),
  };
}
