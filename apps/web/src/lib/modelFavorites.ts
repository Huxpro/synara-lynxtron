// FILE: modelFavorites.ts
// Purpose: Shared storage keys + readers for per-provider favorite model slugs.
// Layer: Web local-storage helpers used by the model picker and model cycle shortcuts.

import type { ProviderKind } from "@synara/contracts";

import { webStorage } from "~/platform/storage";
import {
  FAVORITE_MODEL_STORAGE_KEYS,
  parseFavoriteModelSlugs,
  supportsModelFavorites,
} from "./modelFavorites.logic";
export {
  FAVORITE_MODEL_STORAGE_KEYS,
  normalizeFavoriteModelSlugs,
  parseFavoriteModelSlugs,
  supportsModelFavorites,
  toggleFavoriteModelSlug,
  type FavoriteModelProvider,
} from "./modelFavorites.logic";

// Read favorite slugs for cycle order. Failures (SSR, parse errors) return [].
export function readFavoriteModelSlugs(provider: ProviderKind): string[] {
  if (!supportsModelFavorites(provider) || typeof globalThis.localStorage === "undefined") {
    return [];
  }
  try {
    const raw = webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS[provider]);
    return parseFavoriteModelSlugs(raw);
  } catch {
    return [];
  }
}
