import type {
  ModelSelection,
  ProviderKind,
  ProviderModelDescriptor,
  ServerProviderStatus,
} from '@synara/contracts';
import { useMemo, useState } from '@lynx-js/react';

import {
  buildComposerProviderPickerItems,
} from '@synara-web/components/chat/ComposerProviderPickerItems';
import { ComposerModelTriggerComposition } from '@synara-web/components/chat/ComposerModelTriggerComposition';
import { ComposerTraitRadioSectionComposition } from '@synara-web/components/chat/ComposerTraitRadioSectionComposition';
import { ProviderModelOptionGroupListComposition } from '@synara-web/components/chat/ProviderModelOptionGroupListComposition';
import { getComposerTraitSelection } from '@synara-web/components/chat/composerTraits';
import { resolveRuntimeModelDescriptor } from '@synara-web/components/chat/runtimeModelCapabilities';
import {
  buildModelSelection,
  buildNextProviderOptions,
  formatProviderModelOptionName,
  groupProviderModelOptions,
  groupProviderModelOptionsWithFavorites,
} from '@synara-web/providerModelOptions';
import {
  FAVORITE_MODEL_STORAGE_KEYS,
  parseFavoriteModelSlugs,
  supportsModelFavorites,
  toggleFavoriteModelSlug,
  type FavoriteModelProvider,
} from '@synara-web/lib/modelFavorites.logic';
import { webStorage } from '../../platform/storage';
import { useLynxInteractiveState } from '../ui/interactive-state.lynx';
import { ArrowLeftIcon, ChevronDownIcon } from '../../lib/icons.lynx';
import {
  Menu,
  MenuPopup,
  MenuTrigger,
} from '../ui/menu.lynx';
import { resolveLynxProviderModelOptions } from './composerModelCatalog.logic';
import {
  resolveComposerModelPopupContent,
  type ComposerModelPopupPanel,
} from './composerModelOverlay.logic';

type ComposerProviderPickerItem = ReturnType<
  typeof buildComposerProviderPickerItems
>[number];

function ComposerProviderOptionElement(props: {
  readonly item: ComposerProviderPickerItem;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerProviderOptionLynx${
      props.item.disabled ? ' ComposerProviderOptionLynx--disabled' : ''
    }`,
    disabled: props.item.disabled,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-label={`Browse ${props.item.label} models`}
      {...interaction.eventProps}
    >
      <ComposerModelTriggerComposition
        provider={props.item.provider}
        modelLabel={props.item.label}
        statusLabel={props.item.statusLabel}
        showFastBadge={false}
        hideModelLabel={false}
        hideStatusLabel={false}
      />
    </view>
  );
}

export function ComposerModelControl(props: {
  readonly modelSelection: ModelSelection;
  readonly catalogProvider: ProviderKind;
  readonly runtimeModels: ReadonlyArray<ProviderModelDescriptor>;
  readonly modelsLoading: boolean;
  readonly providers: ReadonlyArray<ServerProviderStatus>;
  readonly onCatalogProviderChange: (provider: ProviderKind) => void;
  readonly onModelSelectionChange: (selection: ModelSelection) => void;
  readonly splitTraits?: boolean;
}) {
  const [modelOpen, setModelOpen] = useState(false);
  const [traitsOpen, setTraitsOpen] = useState(false);
  const [panel, setPanel] =
    useState<ComposerModelPopupPanel>('providers');
  const activeProvider = props.modelSelection.provider;
  const activeModel = props.modelSelection.model;
  const catalogProvider = props.catalogProvider;
  const catalogCurrentModel =
    catalogProvider === activeProvider ? activeModel : null;
  const options = useMemo(
    () =>
      resolveLynxProviderModelOptions({
        provider: catalogProvider,
        currentModel: catalogCurrentModel,
        dynamicModels: props.runtimeModels,
      }),
    [catalogCurrentModel, catalogProvider, props.runtimeModels]
  );
  const [favoriteModelSlugsByProvider, setFavoriteModelSlugsByProvider] =
    useState<Record<FavoriteModelProvider, ReadonlyArray<string>>>(() => ({
      cursor: parseFavoriteModelSlugs(
        webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS.cursor)
      ),
      kilo: parseFavoriteModelSlugs(
        webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS.kilo)
      ),
      opencode: parseFavoriteModelSlugs(
        webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS.opencode)
      ),
      pi: parseFavoriteModelSlugs(
        webStorage.getItem(FAVORITE_MODEL_STORAGE_KEYS.pi)
      ),
    }));
  const favoriteProvider = supportsModelFavorites(catalogProvider)
    ? catalogProvider
    : null;
  const favoriteModelSlugSet = useMemo(
    () =>
      favoriteProvider
        ? new Set(favoriteModelSlugsByProvider[favoriteProvider])
        : undefined,
    [favoriteModelSlugsByProvider, favoriteProvider]
  );
  const groupedOptions = useMemo(
    () =>
      favoriteModelSlugSet
        ? groupProviderModelOptionsWithFavorites({
            options,
            favoriteSlugs: favoriteModelSlugSet,
          })
        : groupProviderModelOptions(options),
    [favoriteModelSlugSet, options]
  );
  const modelLabel =
    (catalogProvider === activeProvider
      ? options.find((option) => option.slug === activeModel)?.name
      : null) ??
    formatProviderModelOptionName({
      provider: activeProvider,
      slug: activeModel,
    });
  const providerItems = useMemo(
    () =>
      buildComposerProviderPickerItems({
        providers: props.providers,
        protectedProviders: [activeProvider],
      }),
    [activeProvider, props.providers]
  );
  const runtimeModel = useMemo(
    () =>
      resolveRuntimeModelDescriptor({
        provider: activeProvider,
        model: activeModel,
        runtimeModels:
          catalogProvider === activeProvider ? props.runtimeModels : null,
      }),
    [activeModel, activeProvider, catalogProvider, props.runtimeModels]
  );
  const traitSelection = useMemo(
    () =>
      getComposerTraitSelection(
        activeProvider,
        activeModel,
        '',
        props.modelSelection.options,
        runtimeModel
      ),
    [activeModel, activeProvider, props.modelSelection.options, runtimeModel]
  );
  const effortLabel = traitSelection.effort
    ? traitSelection.effortLevels.find(
        (level) => level.value === traitSelection.effort
      )?.label ?? traitSelection.effort
    : null;
  const traitSectionLabel =
    activeProvider === 'kilo' || activeProvider === 'opencode'
      ? 'Variant'
      : 'Effort';
  const supportsFastModeControl =
    traitSelection.fastModeDescriptor !== null ||
    traitSelection.caps.supportsFastMode;
  const popupContent = resolveComposerModelPopupContent({
    panel,
    modelsLoading: props.modelsLoading,
  });

  function selectPrimaryTrait(value: string) {
    'background only';
    const descriptor = traitSelection.primarySelectDescriptor;
    if (!descriptor?.options.some((option) => option.id === value)) return;
    const nextOptions = buildNextProviderOptions(
      activeProvider,
      props.modelSelection.options,
      { [descriptor.id]: value }
    );
    props.onModelSelectionChange(
      buildModelSelection(activeProvider, activeModel, nextOptions)
    );
  }

  function setFastMode(enabled: boolean) {
    'background only';
    if (!supportsFastModeControl) return;
    const nextOptions = buildNextProviderOptions(
      activeProvider,
      props.modelSelection.options,
      { fastMode: enabled }
    );
    props.onModelSelectionChange(
      buildModelSelection(activeProvider, activeModel, nextOptions)
    );
  }

  function toggleFavoriteModel(
    provider: FavoriteModelProvider,
    slug: string
  ) {
    'background only';
    const nextSlugs = toggleFavoriteModelSlug(
      favoriteModelSlugsByProvider[provider],
      slug
    );
    setFavoriteModelSlugsByProvider((current) => ({
      ...current,
      [provider]: nextSlugs,
    }));
    webStorage.setItem(
      FAVORITE_MODEL_STORAGE_KEYS[provider],
      JSON.stringify(nextSlugs)
    );
  }

  function setPopupOpen(next: boolean) {
    'background only';
    if (next) {
      setPanel('providers');
      props.onCatalogProviderChange(activeProvider);
    }
    setModelOpen(next);
  }

  const providerBackInteraction = useLynxInteractiveState({
    baseClassName: 'ComposerProviderBackLynx',
    onActivate: () => {
      'background only';
      setPanel('providers');
    },
  });

  function renderTraitSections(onSelectionComplete: () => void) {
    return (
      <>
        {traitSelection.effortLevels.length > 0 && traitSelection.effort ? (
          <ComposerTraitRadioSectionComposition
            label={traitSectionLabel}
            fastModeControl={
              supportsFastModeControl
                ? {
                    enabled: traitSelection.fastModeEnabled,
                    onToggle: () => setFastMode(!traitSelection.fastModeEnabled),
                  }
                : undefined
            }
            value={traitSelection.effort}
            options={traitSelection.effortLevels.map((option) => ({
              value: option.value,
              label: option.label,
              isDefault: option.value === traitSelection.defaultEffort,
              description: option.description ?? null,
            }))}
            onValueChange={selectPrimaryTrait}
            onSelectionComplete={onSelectionComplete}
          />
        ) : null}
        {supportsFastModeControl && traitSelection.effortLevels.length === 0 ? (
          <ComposerTraitRadioSectionComposition
            label="Speed"
            value={traitSelection.fastModeEnabled ? 'on' : 'off'}
            options={[
              { value: 'off', label: 'Default' },
              { value: 'on', label: 'Fast' },
            ]}
            onValueChange={(value) => setFastMode(value === 'on')}
            onSelectionComplete={onSelectionComplete}
          />
        ) : null}
      </>
    );
  }

  return (
    <view className="ComposerModelControlLynx">
      <Menu open={modelOpen} onOpenChange={setPopupOpen}>
        <MenuTrigger
          className="ComposerModelTriggerLynx"
          ariaLabel="Choose model"
        >
          <ComposerModelTriggerComposition
            provider={activeProvider}
            modelLabel={modelLabel}
            statusLabel={props.splitTraits ? null : effortLabel}
            showFastBadge={!props.splitTraits && traitSelection.fastModeEnabled}
            hideModelLabel={false}
            hideStatusLabel={props.splitTraits ?? false}
          />
        </MenuTrigger>
        <MenuPopup
          className="ComposerModelPopupLynx"
          side="top"
          align="end"
          sideOffset={6}
        >
          {popupContent === 'providers' ? (
            <scroll-view
              className="ComposerProviderOptionListLynx"
              scroll-orientation="vertical"
            >
              {props.splitTraits
                ? null
                : renderTraitSections(() => setModelOpen(false))}
              {providerItems.map((item) => (
                <ComposerProviderOptionElement
                  key={item.provider}
                  item={item}
                  onSelect={() => {
                    'background only';
                    props.onCatalogProviderChange(item.provider);
                    setPanel('models');
                  }}
                />
              ))}
            </scroll-view>
          ) : (
            <>
              <view
                className={providerBackInteraction.className}
                aria-label="Back to providers"
                {...providerBackInteraction.eventProps}
              >
                <ArrowLeftIcon
                  className="ComposerProviderBackIconLynx"
                  size={14}
                />
                <text className="ComposerProviderBackLabelLynx">
                  Providers
                </text>
              </view>
              {popupContent === 'loading' ? (
                <view
                  className="ComposerModelLoadingLynx"
                  aria-label="Loading models"
                  role="status"
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <view
                      key={index}
                      className="ComposerModelLoadingRowLynx"
                    >
                      <view className="ComposerModelLoadingDotLynx" />
                      <view
                        className={`ComposerModelLoadingLineLynx${
                          index % 3 === 0
                            ? ' ComposerModelLoadingLineLynx--short'
                            : ''
                        }`}
                      />
                    </view>
                  ))}
                </view>
              ) : (
                <ProviderModelOptionGroupListComposition
                  groupedOptions={groupedOptions}
                  provider={catalogProvider}
                  activeModel={
                    catalogProvider === activeProvider ? activeModel : ''
                  }
                  isSearching={false}
                  favoriteProvider={favoriteProvider}
                  favoriteModelSlugSet={favoriteModelSlugSet}
                  onToggleFavorite={toggleFavoriteModel}
                  onSelectModel={(nextModel) => {
                    props.onModelSelectionChange(
                      buildModelSelection(
                        catalogProvider,
                        nextModel,
                        catalogProvider === activeProvider
                          ? props.modelSelection.options
                          : undefined
                      )
                    );
                    setModelOpen(false);
                    setPanel('providers');
                  }}
                />
              )}
            </>
          )}
        </MenuPopup>
      </Menu>
      {props.splitTraits && effortLabel ? (
        <Menu open={traitsOpen} onOpenChange={setTraitsOpen}>
          <MenuTrigger
            className="ComposerTraitsTriggerLynx"
            ariaLabel="Change effort, context, and speed"
          >
            <text className="ComposerTraitsTriggerLabelLynx">{effortLabel}</text>
            {traitSelection.fastModeEnabled ? (
              <text className="ComposerTraitsTriggerFastLynx">⚡</text>
            ) : null}
            <ChevronDownIcon
              className="ComposerTraitsTriggerChevronLynx"
              size={12}
            />
          </MenuTrigger>
          <MenuPopup
            className="ComposerTraitsPopupLynx"
            side="top"
            align="end"
            sideOffset={6}
          >
            {renderTraitSections(() => setTraitsOpen(false))}
          </MenuPopup>
        </Menu>
      ) : null}
    </view>
  );
}
