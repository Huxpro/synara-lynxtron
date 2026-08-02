// FILE: SettingsGitWritingModelComposition.logic.ts
// Purpose: Host-neutral Git writing model values, options, copy, and server projection.

import {
  DEFAULT_GIT_TEXT_GENERATION_MODEL,
  PROVIDER_DISPLAY_NAMES,
  type ProviderKind,
  type ServerSettingsView,
} from "@synara/contracts";
import { getModelOptions, normalizeModelSlug } from "@synara/shared/model";

export const GIT_WRITING_MODEL_PROVIDERS = ["codex", "kilo", "opencode"] as const;
export type GitWritingModelProvider = (typeof GIT_WRITING_MODEL_PROVIDERS)[number];

export type SettingsGitWritingModelValues = {
  readonly provider: GitWritingModelProvider;
  readonly model: string;
};

export type SettingsGitWritingModelOption = SettingsGitWritingModelValues & {
  readonly label: string;
};

export const DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES: SettingsGitWritingModelValues = {
  provider: "codex",
  model: DEFAULT_GIT_TEXT_GENERATION_MODEL,
};

export function isGitWritingModelProvider(
  provider: ProviderKind,
): provider is GitWritingModelProvider {
  return GIT_WRITING_MODEL_PROVIDERS.some((candidate) => candidate === provider);
}

export function readSettingsGitWritingModelValues(
  settings: Pick<ServerSettingsView, "textGenerationModelSelection"> | null | undefined,
): SettingsGitWritingModelValues {
  const selection = settings?.textGenerationModelSelection;
  if (
    selection &&
    isGitWritingModelProvider(selection.provider) &&
    typeof selection.model === "string" &&
    selection.model.trim()
  ) {
    return { provider: selection.provider, model: selection.model.trim() };
  }
  return DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES;
}

export function formatSettingsGitWritingModelOptionLabel(
  provider: GitWritingModelProvider,
  model: string,
  name?: string,
): string {
  return `${PROVIDER_DISPLAY_NAMES[provider]} / ${name?.trim() || model}`;
}

export function buildSettingsGitWritingModelOptions(input: {
  readonly settings?: Pick<ServerSettingsView, "providers"> | null;
  readonly selected: SettingsGitWritingModelValues;
}): SettingsGitWritingModelOption[] {
  const options: SettingsGitWritingModelOption[] = [];
  const seen = new Set<string>();

  for (const provider of GIT_WRITING_MODEL_PROVIDERS) {
    const customModels = input.settings?.providers[provider].customModels ?? [];
    for (const option of [
      ...getModelOptions(provider).map(({ slug, name }) => ({ model: slug, name })),
      ...customModels.map((model) => ({ model: normalizeModelSlug(model, provider), name: "" })),
    ]) {
      if (!option.model) continue;
      const key = `${provider}:${option.model}`;
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        provider,
        model: option.model,
        label: formatSettingsGitWritingModelOptionLabel(provider, option.model, option.name),
      });
    }
  }

  const selectedKey = `${input.selected.provider}:${input.selected.model}`;
  if (!seen.has(selectedKey)) {
    options.push({
      ...input.selected,
      label: formatSettingsGitWritingModelOptionLabel(
        input.selected.provider,
        input.selected.model,
      ),
    });
  }
  return options;
}

export function settingsGitWritingModelValuesEqual(
  current: SettingsGitWritingModelValues,
  defaults: SettingsGitWritingModelValues,
): boolean {
  return current.provider === defaults.provider && current.model === defaults.model;
}

export function serializeSettingsGitWritingModelValue(
  value: SettingsGitWritingModelValues,
): string {
  return `${value.provider}:${value.model}`;
}

export function parseSettingsGitWritingModelValue(
  value: string,
  options: readonly SettingsGitWritingModelOption[],
): SettingsGitWritingModelValues | null {
  const selected = options.find(
    (option) => serializeSettingsGitWritingModelValue(option) === value,
  );
  return selected ? { provider: selected.provider, model: selected.model } : null;
}
