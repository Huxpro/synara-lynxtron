import type {
  ModelSelection,
  ProviderKind,
  ProviderModelDescriptor,
  ServerProviderStatus,
} from '@synara/contracts';
import { useEffect, useInitData, useMemo, useState } from '@lynx-js/react';
import fastModeSvg from '@synara-central-icons-fill/zap.svg?raw';
import { VIEWPORT_HEIGHT_BREAKPOINTS } from '@synara-web/responsiveLayout.logic';

import {
  buildComposerProviderPickerItems,
} from '@synara-web/components/chat/ComposerProviderPickerItems';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsProviderPickerProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import { ComposerModelTriggerComposition } from '@synara-web/components/chat/ComposerModelTriggerComposition';
import { ComposerTraitRadioSectionComposition } from '@synara-web/components/chat/ComposerTraitRadioSectionComposition';
import { ProviderModelOptionGroupListComposition } from '@synara-web/components/chat/ProviderModelOptionGroupListComposition';
import { getComposerTraitSelection } from '@synara-web/components/chat/composerTraits';
import { resolveRuntimeModelDescriptor } from '@synara-web/components/chat/runtimeModelCapabilities';
import {
  buildModelSearchText,
  buildModelSelection,
  buildNextProviderOptions,
  formatProviderModelOptionName,
  groupProviderModelOptions,
  groupProviderModelOptionsWithFavorites,
  SEARCHABLE_MODEL_PICKER_THRESHOLD,
  type ProviderModelOption,
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
import { ArrowLeftIcon, ChevronDownIcon, SearchIcon } from '../../lib/icons.lynx';
import { OpenAIProviderIcon } from '../OpenAIProviderIcon.lynx';
import { colorizeLynxSvg } from '../../lib/themedSvg.lynx';
import { useTheme } from '../../adapters/useTheme.lynx';
import { useViewportLayout } from '../../hooks/useViewportLayout.lynx';
import {
  Menu,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from '../ui/menu.lynx';
import { Input } from '../ui/input.lynx';
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
    accessibleLabel: `Browse ${props.item.label} models`,
    disabled: props.item.disabled,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      data-provider={props.item.provider}
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
  readonly compact?: boolean;
  readonly disabled?: boolean;
  readonly modelSelection: ModelSelection;
  readonly catalogModelSelection?: ModelSelection;
  readonly catalogProvider: ProviderKind;
  readonly initialPanel?: ComposerModelPopupPanel;
  readonly initialOpen?: boolean;
  readonly initialSubmenuOpen?: boolean;
  readonly initialSearchQuery?: string;
  readonly favoriteModelSlugsOverride?: Partial<Record<FavoriteModelProvider, ReadonlyArray<string>>>;
  readonly onFavoriteModelSlugsChange?: (provider: FavoriteModelProvider, slugs: ReadonlyArray<string>) => void;
  readonly runtimeModels: ReadonlyArray<ProviderModelDescriptor>;
  readonly modelOptionsOverride?: ReadonlyArray<ProviderModelOption>;
  readonly modelsLoading: boolean;
  readonly providers: ReadonlyArray<ServerProviderStatus>;
  readonly onCatalogProviderChange: (provider: ProviderKind) => void;
  readonly onModelSelectionChange: (selection: ModelSelection) => void;
  readonly splitTraits?: boolean;
}) {
  const initData = useInitData() as {
    readonly initialComposerModelMenuOpen?: unknown;
    readonly initialComposerModelSubmenuOpen?: unknown;
  };
  const { semanticIconColor } = useTheme();
  const viewport = useViewportLayout();
  const [modelOpen, setModelOpen] = useState(props.initialOpen ?? false);
  const [submenuProvider, setSubmenuProvider] = useState<ProviderKind | null>(
    (props.initialSubmenuOpen ?? initData.initialComposerModelSubmenuOpen === true)
      ? props.catalogProvider
      : null
  );
  useEffect(() => {
    if (props.initialOpen || initData.initialComposerModelMenuOpen === true) setModelOpen(true);
  }, [initData.initialComposerModelMenuOpen, props.initialOpen]);
  const [traitsOpen, setTraitsOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState(
    props.initialSearchQuery ?? ''
  );
  const [panel, setPanel] = useState<ComposerModelPopupPanel>(
    props.initialPanel ?? 'providers'
  );
  const activeProvider = props.modelSelection.provider;
  const providerPickerSettings = readSettingsProviderPickerProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  const activeModel = props.modelSelection.model;
  const catalogProvider = props.catalogProvider;
  const catalogModelSelection =
    props.catalogModelSelection?.provider === catalogProvider
      ? props.catalogModelSelection
      : catalogProvider === activeProvider
        ? props.modelSelection
        : null;
  const catalogCurrentModel = catalogModelSelection?.model ?? null;
  const catalogActiveModel =
    catalogProvider === activeProvider ? catalogCurrentModel : null;
  const options = useMemo(
    () =>
      props.modelOptionsOverride ??
      resolveLynxProviderModelOptions({
        provider: catalogProvider,
        currentModel: catalogActiveModel,
        dynamicModels: props.runtimeModels,
      }),
    [
      catalogActiveModel,
      catalogProvider,
      props.modelOptionsOverride,
      props.runtimeModels,
    ]
  );
  const shouldShowModelSearch =
    (catalogProvider === 'kilo' ||
      catalogProvider === 'opencode' ||
      catalogProvider === 'cursor' ||
      catalogProvider === 'pi') &&
    options.length >= SEARCHABLE_MODEL_PICKER_THRESHOLD;
  const normalizedModelSearchQuery = modelSearchQuery.trim().toLowerCase();
  const filteredOptions = useMemo(
    () =>
      shouldShowModelSearch && normalizedModelSearchQuery.length > 0
        ? options.filter((option) =>
            buildModelSearchText(option).includes(normalizedModelSearchQuery)
          )
        : options,
    [normalizedModelSearchQuery, options, shouldShowModelSearch]
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
        ? new Set(
            props.favoriteModelSlugsOverride?.[favoriteProvider] ??
              favoriteModelSlugsByProvider[favoriteProvider]
          )
        : undefined,
    [favoriteModelSlugsByProvider, favoriteProvider, props.favoriteModelSlugsOverride]
  );
  const groupedOptions = useMemo(
    () =>
      favoriteModelSlugSet
        ? groupProviderModelOptionsWithFavorites({
            options: filteredOptions,
            favoriteSlugs: favoriteModelSlugSet,
          })
        : groupProviderModelOptions(filteredOptions),
    [favoriteModelSlugSet, filteredOptions]
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
        hiddenProviders: providerPickerSettings.hiddenProviders,
        providerOrder: providerPickerSettings.providerOrder,
        protectedProviders: [activeProvider],
      }),
    [
      activeProvider,
      props.providers,
      providerPickerSettings.hiddenProviders,
      providerPickerSettings.providerOrder,
    ]
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
    hasModelOptions: options.length > 0,
    panel,
    modelsLoading: props.modelsLoading,
  });
  const useSinglePanelModelNavigation =
    viewport.compact ||
    (viewport.height > 0 && viewport.height < VIEWPORT_HEIGHT_BREAKPOINTS.short);

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
    if (
      props.favoriteModelSlugsOverride &&
      provider in props.favoriteModelSlugsOverride
    ) {
      const override = props.favoriteModelSlugsOverride[provider] ?? [];
      props.onFavoriteModelSlugsChange?.(
        provider,
        toggleFavoriteModelSlug(override, slug)
      );
      return;
    }
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
      setModelSearchQuery('');
      props.onCatalogProviderChange(activeProvider);
      setSubmenuProvider(
        (props.initialSubmenuOpen ?? initData.initialComposerModelSubmenuOpen === true)
          ? activeProvider
          : null
      );
    } else {
      setSubmenuProvider(null);
    }
    setModelOpen(next);
  }

  const providerBackInteraction = useLynxInteractiveState({
    baseClassName: 'ComposerProviderBackLynx',
    accessibleLabel: 'Back to providers',
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

  function renderModelCatalog(onSelectionComplete: () => void) {
    if (props.modelsLoading) {
      return (
        <view className="ComposerModelLoadingLynx" aria-label="Loading models" role="status">
          {Array.from({ length: 6 }, (_, index) => (
            <view key={index} className="ComposerModelLoadingRowLynx">
              <view className="ComposerModelLoadingDotLynx" />
              <view
                className={`ComposerModelLoadingLineLynx${
                  index % 3 === 0 ? ' ComposerModelLoadingLineLynx--short' : ''
                }`}
              />
            </view>
          ))}
        </view>
      );
    }
    const list = groupedOptions.length > 0 ? (
      <ProviderModelOptionGroupListComposition
        groupedOptions={groupedOptions}
        provider={catalogProvider}
        activeModel={catalogActiveModel ?? ''}
        isSearching={normalizedModelSearchQuery.length > 0}
        favoriteProvider={favoriteProvider}
        favoriteModelSlugSet={favoriteModelSlugSet}
        onToggleFavorite={toggleFavoriteModel}
        onSelectModel={(nextModel) => {
          props.onModelSelectionChange(
            buildModelSelection(
              catalogProvider,
              nextModel,
              catalogModelSelection?.options
            )
          );
          onSelectionComplete();
        }}
      />
    ) : (
      <text className="ComposerModelEmptyLynx">
        {catalogProvider === 'pi' && normalizedModelSearchQuery.length === 0
          ? 'No Pi models found'
          : 'No matches'}
      </text>
    );
    return shouldShowModelSearch ? (
      <view className="ComposerModelSearchPanelLynx">
        <view className="ComposerModelSearchHeaderLynx">
          <SearchIcon className="ComposerModelSearchIconLynx" size={14} />
          <Input
            nativeInput
            className="ComposerModelSearchInputLynx"
            aria-label="Search models or providers"
            placeholder="Search models or providers"
            value={modelSearchQuery}
            onChange={(event) => setModelSearchQuery(event.target.value)}
          />
        </view>
        <view className="ComposerModelSearchResultsLynx">{list}</view>
      </view>
    ) : list;
  }

  function renderProviderList() {
    return (
      <scroll-view
        className="ComposerProviderOptionListLynx"
        scroll-orientation="vertical"
      >
        {providerItems.map((item) => (
          <ComposerProviderOptionElement
            key={item.provider}
            item={item}
            onSelect={() => {
              'background only';
              setModelSearchQuery('');
              props.onCatalogProviderChange(item.provider);
              setPanel('models');
            }}
          />
        ))}
      </scroll-view>
    );
  }

  function renderProviderSubmenuList() {
    const unavailableStart = providerItems.findIndex(
      (item) => item.kind === 'coming-soon'
    );
    return (
      <view className="ComposerProviderSubmenuListLynx">
        {providerItems.map((item, index) => (
          <view key={item.provider} className="ComposerProviderMenuEntryLynx">
            {index === unavailableStart && unavailableStart > 0 ? (
              <MenuSeparator />
            ) : null}
            {item.disabled ? (
              <ComposerProviderOptionElement item={item} onSelect={() => {}} />
            ) : (
              <MenuSub
                open={submenuProvider === item.provider}
                onOpenChange={(open) => {
                  'background only';
                  setSubmenuProvider(open ? item.provider : null);
                }}
              >
                <MenuSubTrigger
                  className="ComposerProviderSubTriggerLynx"
                  onOpen={() => {
                    'background only';
                    setModelSearchQuery('');
                    props.onCatalogProviderChange(item.provider);
                    setSubmenuProvider(item.provider);
                  }}
                >
                  <view className="ComposerProviderSubTriggerContentLynx">
                    <OpenAIProviderIcon provider={item.provider} />
                    <text className="ComposerProviderSubTriggerLabelLynx">
                      {item.label}
                    </text>
                  </view>
                </MenuSubTrigger>
                <MenuSubPopup
                  align="start"
                  side="left"
                  portaled
                  className="ComposerModelSubPopupLynx"
                >
                  {catalogProvider === item.provider
                    ? renderModelCatalog(() => {
                        setModelOpen(false);
                        setPanel('providers');
                      })
                    : null}
                </MenuSubPopup>
              </MenuSub>
            )}
          </view>
        ))}
      </view>
    );
  }

  return (
    <view className="ComposerModelControlLynx">
      <Menu open={modelOpen} onOpenChange={setPopupOpen}>
        <MenuTrigger
          className={`ComposerModelTriggerLynx${props.disabled ? ' ComposerModelTriggerLynx--disabled' : ''}`}
          ariaLabel="Choose model"
          disabled={props.disabled}
        >
          <ComposerModelTriggerComposition
            provider={activeProvider}
            modelLabel={modelLabel}
            statusLabel={props.splitTraits ? null : effortLabel}
            showFastBadge={!props.splitTraits && traitSelection.fastModeEnabled}
            hideModelLabel={props.compact ?? false}
            hideStatusLabel={(props.splitTraits ?? false) || (props.compact ?? false)}
          />
        </MenuTrigger>
        <MenuPopup
          className={`ComposerModelPopupLynx${
            props.splitTraits &&
            useSinglePanelModelNavigation &&
            popupContent !== 'providers'
              ? ' ComposerModelPopupLynx--models'
              : ''
          }`}
          side="top"
          align="end"
          sideOffset={6}
        >
          {props.splitTraits && !useSinglePanelModelNavigation ? (
            renderProviderSubmenuList()
          ) : popupContent === 'providers' ? (
            props.splitTraits ? (
              renderProviderList()
            ) : (
              <view className="ComposerModelEffortMenuLynx">
                {renderTraitSections(() => setModelOpen(false))}
                <MenuSeparator className="ComposerModelEffortSeparatorLynx" />
                <MenuSub
                  defaultOpen={
                    (props.initialSubmenuOpen ?? initData.initialComposerModelSubmenuOpen === true)
                  }
                >
                    <MenuSubTrigger className="ComposerModelSubTriggerLynx">
                      <view className="ComposerModelSubTriggerContentLynx">
                        <OpenAIProviderIcon provider={activeProvider} />
                        <text className="ComposerModelSubTriggerLabelLynx">
                          {modelLabel}
                        </text>
                      </view>
                    </MenuSubTrigger>
                    <MenuSubPopup
                      align="end"
                      className="ComposerModelSubPopupLynx"
                    >
                      {renderModelCatalog(() => {
                        setModelOpen(false);
                        setPanel('providers');
                      })}
                    </MenuSubPopup>
                </MenuSub>
              </view>
            )
          ) : useSinglePanelModelNavigation ? (
            <view className="ComposerModelBrowserLynx">
              <view className="ComposerModelCatalogPaneLynx">
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
                {renderModelCatalog(() => {
                  setModelOpen(false);
                  setPanel('providers');
                })}
              </view>
              <view className="ComposerModelProviderPaneLynx">
                {renderProviderList()}
              </view>
            </view>
          ) : null}
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
              <svg
                className="ComposerTraitsTriggerFastLynx"
                content={colorizeLynxSvg(
                  fastModeSvg,
                  semanticIconColor('secondary')
                )}
              />
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
