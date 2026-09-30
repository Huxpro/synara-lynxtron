import type { ProviderKind } from "@synara/contracts";
import { useState } from "react";

import {
  providerModelCostMultiplierLabel,
  resolveModelGroupDefaultOpen,
  shouldUseCollapsibleModelGroups,
  type ProviderModelOption,
  type ProviderModelOptionGroup,
} from "../../providerModelOptions";
import {
  ProviderModelCollapsibleGroupElement,
  ProviderModelGroupElement,
  ProviderModelGroupLabelElement,
  ProviderModelOptionListFrameElement,
  ProviderModelRadioItemElement,
} from "~/components/chat/ProviderModelOptionGroupListCompositionElements";
import type { FavoriteModelProvider } from "../../lib/modelFavorites.logic";

export type { FavoriteModelProvider } from "../../lib/modelFavorites.logic";

export interface ProviderModelOptionGroupListCompositionProps {
  readonly groupedOptions: ReadonlyArray<ProviderModelOptionGroup>;
  readonly provider: ProviderKind;
  readonly activeModel: string;
  readonly isSearching: boolean;
  readonly favoriteProvider: FavoriteModelProvider | null;
  readonly favoriteModelSlugSet: ReadonlySet<string> | undefined;
  readonly onToggleFavorite: (provider: FavoriteModelProvider, slug: string) => void;
  readonly onSelectModel: (slug: string) => void;
  readonly onAfterSelection?: (() => void) | undefined;
}

function ProviderModelCollapsibleGroupComposition(props: {
  readonly group: ProviderModelOptionGroup;
  readonly defaultOpen: boolean;
  readonly children: React.ReactNode;
}) {
  const [open, setOpen] = useState(props.defaultOpen);
  return (
    <ProviderModelCollapsibleGroupElement
      label={props.group.label ?? ""}
      count={props.group.options.length}
      open={open}
      onOpenChange={setOpen}
    >
      {props.children}
    </ProviderModelCollapsibleGroupElement>
  );
}

export function ProviderModelOptionGroupListComposition(
  props: ProviderModelOptionGroupListCompositionProps,
) {
  const useCollapsibleGroups = shouldUseCollapsibleModelGroups(
    props.groupedOptions.length,
    props.isSearching,
  );

  return (
    <ProviderModelOptionListFrameElement>
      {props.groupedOptions.map((group) => {
        const groupItems = group.options.map((modelOption) => {
          const costMultiplierLabel =
            props.provider === "droid"
              ? providerModelCostMultiplierLabel(modelOption.description)
              : null;
          return (
            <ProviderModelRadioItemElement
              key={`${props.provider}:${modelOption.slug}`}
              active={props.activeModel === modelOption.slug}
              costMultiplierLabel={costMultiplierLabel}
              description={modelOption.description}
              favoriteProvider={props.favoriteProvider}
              isFavorite={props.favoriteModelSlugSet?.has(modelOption.slug) ?? false}
              modelName={modelOption.name}
              modelSlug={modelOption.slug}
              onAfterSelection={props.onAfterSelection}
              onSelect={() => props.onSelectModel(modelOption.slug)}
              onToggleFavorite={() => {
                if (props.favoriteProvider) {
                  props.onToggleFavorite(props.favoriteProvider, modelOption.slug);
                }
              }}
            />
          );
        });

        if (group.label === null) {
          return (
            <ProviderModelGroupElement key={`${props.provider}:${group.key}`}>
              {groupItems}
            </ProviderModelGroupElement>
          );
        }

        if (useCollapsibleGroups) {
          return (
            <ProviderModelCollapsibleGroupComposition
              key={`${props.provider}:${group.key}`}
              group={group}
              defaultOpen={resolveModelGroupDefaultOpen({
                groupKey: group.key,
                options: group.options,
                activeModel: props.activeModel,
                groupCount: props.groupedOptions.length,
              })}
            >
              {groupItems}
            </ProviderModelCollapsibleGroupComposition>
          );
        }

        return (
          <ProviderModelGroupElement key={`${props.provider}:${group.key}`}>
            <ProviderModelGroupLabelElement>{group.label}</ProviderModelGroupLabelElement>
            {groupItems}
          </ProviderModelGroupElement>
        );
      })}
    </ProviderModelOptionListFrameElement>
  );
}
