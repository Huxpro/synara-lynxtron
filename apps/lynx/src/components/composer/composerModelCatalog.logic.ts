import type {
  ModelSelection,
  ProviderKind,
  ProviderModelDescriptor,
} from '@synara/contracts';
import { getModelOptions } from '@synara/shared/model';
import {
  formatProviderModelOptionName,
  mergeDynamicModelOptions,
  type ProviderModelOption,
} from '@synara-web/providerModelOptions';

export function resolveCatalogModelSelection(input: {
  readonly provider: ProviderKind;
  readonly activeSelection: ModelSelection | undefined;
  readonly rememberedSelection: ModelSelection | undefined;
}): ModelSelection | undefined {
  if (input.rememberedSelection?.provider === input.provider) {
    return input.rememberedSelection;
  }
  return input.activeSelection?.provider === input.provider
    ? input.activeSelection
    : undefined;
}

export function resolveLynxProviderModelOptions(input: {
  readonly provider: ProviderKind;
  readonly currentModel?: string | null;
  readonly dynamicModels: ReadonlyArray<ProviderModelDescriptor>;
}): ReadonlyArray<ProviderModelOption> {
  const staticOptions = getModelOptions(input.provider);
  const discoveredOptions =
    input.dynamicModels.length > 0
      ? mergeDynamicModelOptions({
          provider: input.provider,
          staticOptions,
          dynamicModels: input.dynamicModels,
        })
      : staticOptions;

  if (
    !input.currentModel ||
    discoveredOptions.some((option) => option.slug === input.currentModel)
  ) {
    return discoveredOptions;
  }
  return [
    {
      slug: input.currentModel,
      name: formatProviderModelOptionName({
        provider: input.provider,
        slug: input.currentModel,
      }),
    },
    ...discoveredOptions,
  ];
}
