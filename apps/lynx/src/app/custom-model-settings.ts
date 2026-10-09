import type { ProviderKind, ServerSettingsPatch, ServerSettingsView } from "@synara/contracts";

export const CUSTOM_MODEL_PROVIDERS = [
  { provider: "codex", example: "gpt-6.7-codex-ultra-preview" },
  { provider: "claudeAgent", example: "claude-custom-model" },
  { provider: "cursor", example: "composer-2" },
  { provider: "antigravity", example: "Gemini 4 Pro" },
  { provider: "grok", example: "grok-build-0.1" },
  { provider: "opencode", example: "openai/gpt-5" },
  { provider: "pi", example: "anthropic/claude-sonnet-4-5" },
] as const satisfies readonly {
  readonly provider: ProviderKind;
  readonly example: string;
}[];

export type CustomModelProvider = (typeof CUSTOM_MODEL_PROVIDERS)[number]["provider"];

export function customModelsProviderPatch(
  provider: CustomModelProvider,
  customModels: readonly string[],
): ServerSettingsPatch {
  const value = { customModels: [...customModels] };
  switch (provider) {
    case "codex":
      return { providers: { codex: value } };
    case "claudeAgent":
      return { providers: { claudeAgent: value } };
    case "cursor":
      return { providers: { cursor: value } };
    case "antigravity":
      return { providers: { antigravity: value } };
    case "grok":
      return { providers: { grok: value } };
    case "opencode":
      return { providers: { opencode: value } };
    case "pi":
      return { providers: { pi: value } };
  }
}

export function customModelsForProvider(
  settings: ServerSettingsView,
  provider: CustomModelProvider,
): readonly string[] {
  return settings.providers[provider].customModels;
}
