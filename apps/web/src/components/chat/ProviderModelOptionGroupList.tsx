// Stable product-facing wrapper around the physical-shared model option
// composition. ProviderModelPicker retains discovery/search/favorite state;
// the shared source owns group visibility/order, disclosure, and row anatomy.

import type { ProviderKind } from "@synara/contracts";

import type { ProviderModelOptionGroup } from "../../providerModelOptions";
import {
  ProviderModelOptionGroupListComposition,
  type FavoriteModelProvider,
} from "./ProviderModelOptionGroupListComposition";

export function ProviderModelOptionGroupList(props: {
  readonly groupedOptions: ReadonlyArray<ProviderModelOptionGroup>;
  readonly provider: ProviderKind;
  readonly activeModel: string;
  readonly isSearching: boolean;
  readonly favoriteProvider: FavoriteModelProvider | null;
  readonly favoriteModelSlugSet: ReadonlySet<string> | undefined;
  readonly onToggleFavorite: (provider: FavoriteModelProvider, slug: string) => void;
  readonly onSelectModel: (slug: string) => void;
  readonly onAfterSelection?: () => void;
}) {
  return <ProviderModelOptionGroupListComposition {...props} />;
}
