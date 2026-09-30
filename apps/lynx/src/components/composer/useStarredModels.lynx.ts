import { useState } from "@lynx-js/react";

import {
  FAVORITE_MODEL_STORAGE_KEYS,
  migrateLegacyKiloFavoriteModelSlugs,
  parseFavoriteModelSlugs,
} from "@synara-web/lib/modelFavorites.logic";
import {
  normalizeStarredModels,
  parseStoredStarredModels,
  seedStarredModelsFromLegacyFavorites,
  STARRED_MODELS_STORAGE_KEY,
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
  const stored = parseStoredStarredModels(webStorage.getItem(STARRED_MODELS_STORAGE_KEY));
  if (stored !== null) return stored;
  migrateLegacyKiloFavoriteModelSlugs(webStorage);
  return seedStarredModelsFromLegacyFavorites((provider) =>
    parseFavoriteModelSlugs(webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS[provider])),
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
