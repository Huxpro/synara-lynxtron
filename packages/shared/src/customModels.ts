import type { ProviderKind } from "@synara/contracts";

import { getModelOptions, normalizeModelSlug } from "./model";

export const MAX_CUSTOM_MODEL_LENGTH = 256;

export type CustomModelValidationResult =
  | { readonly model: string; readonly error?: never }
  | { readonly model?: never; readonly error: string };

export function validateCustomModelInput(input: {
  readonly provider: ProviderKind;
  readonly value: string;
  readonly savedModels: readonly string[];
}): CustomModelValidationResult {
  const normalized = normalizeModelSlug(input.value, input.provider);
  if (!normalized) return { error: "Enter a model slug." };
  if (getModelOptions(input.provider).some((option) => option.slug === normalized)) {
    return { error: "That model is already built in." };
  }
  if (normalized.length > MAX_CUSTOM_MODEL_LENGTH) {
    return { error: `Model slugs must be ${MAX_CUSTOM_MODEL_LENGTH} characters or less.` };
  }
  if (input.savedModels.includes(normalized)) {
    return { error: "That custom model is already saved." };
  }
  return { model: normalized };
}
