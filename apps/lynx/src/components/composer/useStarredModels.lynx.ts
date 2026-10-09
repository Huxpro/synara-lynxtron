import { useState } from "@lynx-js/react";

import {
  FAVORITE_MODEL_STORAGE_KEYS,
  migrateLegacyKiloFavoriteModelSlugs,
  parseFavoriteModelSlugs,
} from "@synara-web/lib/modelFavorites.logic";
import {
  normalizeStarredModels,
  STARRED_MODELS_STORAGE_KEY,
  starredModelInstanceId,
  toggleStarredModel,
  unstarModel,
  type StarredModel,
  type StoredStarredModel,
} from "@synara-web/lib/starredModels";

import { webStorage } from "../../platform/storage";

// Electron's seed: legacy per-provider favourites stand in as trait-less presets until the
// first edit writes the new key. The Lynx host has no `globalThis.localStorage`, so the
// favourites are read through the storage port.
function readStoredStarredModels(): ReadonlyArray<StoredStarredModel> {
  const raw = webStorage.getItem(STARRED_MODELS_STORAGE_KEY);
  if (raw) {
    try {
      // `normalizeStarredModels` (the only reader) drops entries it does not recognize.
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as StoredStarredModel[]) : [];
    } catch {
      return [];
    }
  }
  migrateLegacyKiloFavoriteModelSlugs(webStorage);
  const providers = Object.keys(FAVORITE_MODEL_STORAGE_KEYS) as Array<
    keyof typeof FAVORITE_MODEL_STORAGE_KEYS
  >;
  return providers.flatMap((provider) =>
    parseFavoriteModelSlugs(webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS[provider])).map(
      (model) => ({ provider, model, effort: null, fastMode: null, thinking: null }),
    ),
  );
}

/**
 * The presets Lynx can run. Lynx selects each provider's default account only, so a
 * preset saved for another account (Electron's provider accounts) is left out of the
 * picker: selecting it here would silently run its model and traits in the default
 * account. Such presets stay in storage untouched.
 */
export function selectableStarredModels(
  starredModels: ReadonlyArray<StarredModel>,
  lockedProvider: StarredModel["provider"] | null,
): ReadonlyArray<StarredModel> {
  return starredModels.filter(
    (entry) =>
      starredModelInstanceId(entry) === entry.provider &&
      (lockedProvider === null || entry.provider === lockedProvider),
  );
}

/** Lynx binding for Electron's persisted starred model presets (`useStarredModels`). */
export function useStarredModels(): {
  readonly starredModels: ReadonlyArray<StarredModel>;
  readonly toggleStarredModel: (entry: StarredModel) => void;
  readonly unstarModel: (entry: Pick<StarredModel, "provider" | "model">) => void;
} {
  const [stored, setStored] = useState<ReadonlyArray<StoredStarredModel>>(readStoredStarredModels);
  const update = (next: ReadonlyArray<StoredStarredModel>) => {
    "background only";
    setStored(next);
    webStorage.setItem(STARRED_MODELS_STORAGE_KEY, JSON.stringify(next));
  };
  return {
    starredModels: normalizeStarredModels(stored),
    toggleStarredModel: (entry) => update(toggleStarredModel(stored, entry)),
    unstarModel: (entry) => update(unstarModel(stored, entry)),
  };
}
