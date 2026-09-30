import type {
  ModelSelection,
  ModelSlug,
  ProviderKind,
  ProviderModelDescriptor,
  ServerProviderStatus,
} from "@synara/contracts";
import { useEffect, useInitData, useRef, useState, type ReactNode } from "@lynx-js/react";
import resetSvg from "@synara-central-icons/arrow-rotate-counter-clockwise.svg?raw";
import starSvg from "@synara-central-icons/star.svg?raw";
import fastModeOutlineSvg from "@synara-central-icons/zap.svg?raw";
import starFilledSvg from "@synara-central-icons-fill/star.svg?raw";
import fastModeSvg from "@synara-central-icons-fill/zap.svg?raw";

import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsProviderPickerProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import {
  buildProviderTabRows,
  buildStarredModelOptionsPatch,
  buildStarredTabRows,
  MODEL_PICKER_SHORTCUT_ROW_LIMIT,
  modelPickerShortcutRowIndex,
  resolveStarredTraits,
  STARRED_TAB,
  type ComposerModelPickerRow as PickerRow,
  type ComposerModelPickerTab,
} from "@synara-web/components/chat/ComposerModelPicker.logic";
import { buildComposerProviderPickerItems } from "@synara-web/components/chat/ComposerProviderPickerItems";
import {
  getComposerTraitSelection,
  planComposerEffortChange,
  resolveComposerEffortLadderIndex,
  resolveComposerTraitStatusLabel,
  showsComposerFastModeBadge,
  supportsComposerFastModeControl,
  type ComposerTraitSelection,
} from "@synara-web/components/chat/composerTraits";
import { resolveRuntimeModelDescriptor } from "@synara-web/components/chat/runtimeModelCapabilities";
import { starredModelSlotKey, type StarredModel } from "@synara-web/lib/starredModels";
import {
  buildModelSelection,
  buildNextProviderOptions,
  formatProviderModelOptionName,
  type ProviderModelOption,
  type ProviderOptions,
} from "@synara-web/providerModelOptions";

import {
  ComposerModelTriggerChevronElement,
  ComposerModelTriggerFastBadgeElement,
  ComposerModelTriggerModelLabelElement,
  ComposerModelTriggerProviderIconElement,
  ComposerModelTriggerStatusIconElement,
  ComposerModelTriggerStatusLabelElement,
} from "../../adapters/ComposerModelTriggerCompositionElements.lynx";
import { useTheme } from "../../adapters/useTheme.lynx";
import { CheckIcon, PlusIcon, SearchIcon } from "../../lib/icons.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { webStorage } from "../../platform/storage";
import { OpenAIProviderIcon, resolveProviderGlyphColor } from "../OpenAIProviderIcon.lynx";
import { scheduleLynxInputFocus } from "../ui/focus.lynx";
import { Input, type InputRef } from "../ui/input.lynx";
import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from "../ui/interactive-state.lynx";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "../ui/menu.lynx";
import { ComposerEffortSlider } from "./ComposerEffortSlider.lynx";
import { resolveLynxProviderModelOptions } from "./composerModelCatalog.logic";
import { useStarredModels } from "./useStarredModels.lynx";
import "./composer-model-picker.css";

const SHORTCUT_MODIFIER_LABEL = "⌘";

type ProviderTab = {
  readonly provider: ProviderKind;
  readonly label: string;
  readonly unavailableLabel: string | null;
};

export interface ComposerModelPickerProps {
  /** Narrow composer: the model name moves to assistive text (provider icon stays). */
  readonly hideModelLabel?: boolean;
  readonly hideStatusLabel?: boolean;
  readonly disabled?: boolean;
  readonly modelSelection: ModelSelection;
  /** A started thread may only switch models within its own provider. */
  readonly lockedProvider: ProviderKind | null;
  /** Provider whose runtime catalog `runtimeModels` holds. */
  readonly catalogProvider: ProviderKind;
  readonly runtimeModels: ReadonlyArray<ProviderModelDescriptor>;
  readonly modelsLoading: boolean;
  readonly providers: ReadonlyArray<ServerProviderStatus>;
  /** The options another provider's models would run with (its draft/sticky selection). */
  readonly rememberedSelectionFor?: (provider: ProviderKind) => ModelSelection | undefined;
  readonly initialOpen?: boolean;
  readonly onCatalogProviderChange: (provider: ProviderKind) => void;
  readonly onModelSelectionChange: (selection: ModelSelection) => void;
  readonly onOpenProviderSettings?: () => void;
}

/**
 * Electron's single composer picker (`ComposerModelPicker`, slider effort control):
 * provider tabs over starred presets and per-provider model lists, search, ⌘N row
 * shortcuts, star toggles, and the effort slider card in the footer.
 */
export function ComposerModelPicker(props: ComposerModelPickerProps) {
  // The test renderer has no init data.
  const initData = (useInitData() ?? {}) as { readonly initialComposerModelMenuOpen?: unknown };
  const [open, setOpen] = useState(props.initialOpen ?? false);
  useEffect(() => {
    if (props.initialOpen || initData.initialComposerModelMenuOpen === true) setOpen(true);
  }, [initData.initialComposerModelMenuOpen, props.initialOpen]);

  const activeProvider = props.lockedProvider ?? props.modelSelection.provider;
  const activeModel = props.modelSelection.model;
  const activeOptions = resolveLynxProviderModelOptions({
    provider: activeProvider,
    currentModel: activeModel,
    dynamicModels: props.catalogProvider === activeProvider ? props.runtimeModels : [],
  });
  const modelLabel =
    activeOptions.find((option) => option.slug === activeModel)?.name ??
    formatProviderModelOptionName({ provider: activeProvider, slug: activeModel });
  const currentSelection = getComposerTraitSelection(
    activeProvider,
    activeModel,
    "",
    props.modelSelection.options,
    resolveRuntimeModelDescriptor({
      provider: activeProvider,
      model: activeModel,
      runtimeModels: props.catalogProvider === activeProvider ? props.runtimeModels : null,
    }),
  );
  const statusLabel = resolveComposerTraitStatusLabel(currentSelection);
  const liveLabel = {
    modelLabel,
    statusLabel,
    showsFastBadge: showsComposerFastModeBadge(currentSelection),
  };
  // Electron freezes the label at its open-time value under the "Select effort" cover so
  // tuning effort in the open panel cannot resize the trigger and drag the popup sideways.
  const [frozenLabel, setFrozenLabel] = useState<typeof liveLabel | null>(null);
  if (open && frozenLabel === null) setFrozenLabel(liveLabel);
  if (!open && frozenLabel !== null) setFrozenLabel(null);
  const label = open && frozenLabel !== null ? frozenLabel : liveLabel;
  const showsPlaceholder = open && !props.hideModelLabel;

  const setPickerOpen = (next: boolean) => {
    "background only";
    if (props.disabled && next) return;
    if (next) props.onCatalogProviderChange(activeProvider);
    setOpen(next);
  };

  return (
    <view className="ComposerModelControlLynx">
      <Menu open={open} autoHighlightFirst={false} onOpenChange={setPickerOpen}>
        <MenuTrigger
          className={`ComposerModelTriggerLynx ComposerModelTriggerLynx--menu${
            open ? " ComposerModelTriggerLynx--open" : ""
          }${props.disabled ? " ComposerModelTriggerLynx--disabled" : ""}`}
          ariaLabel="Change model and reasoning"
          disabled={props.disabled}
        >
          <view className="ComposerModelTriggerContentLynx">
            <view className="ComposerModelTriggerLabelStackLynx">
              <view
                className={`ComposerModelTriggerLabelGroupLynx${
                  showsPlaceholder ? " ComposerModelTriggerLabelGroupLynx--covered" : ""
                }`}
              >
                <ComposerModelTriggerProviderIconElement provider={activeProvider} />
                <ComposerModelTriggerModelLabelElement
                  hidden={props.hideModelLabel ?? false}
                  modelLabel={label.modelLabel}
                />
                {label.showsFastBadge ? <ComposerModelTriggerFastBadgeElement /> : null}
                {label.statusLabel ? (
                  props.hideStatusLabel ? (
                    <ComposerModelTriggerStatusIconElement accessibleLabel={label.statusLabel} />
                  ) : (
                    <ComposerModelTriggerStatusLabelElement>
                      {label.statusLabel}
                    </ComposerModelTriggerStatusLabelElement>
                  )
                ) : null}
              </view>
              {showsPlaceholder ? (
                <text className="ComposerModelTriggerPlaceholderLynx">Select effort</text>
              ) : null}
            </view>
            <ComposerModelTriggerChevronElement />
          </view>
        </MenuTrigger>
        <MenuPopup
          className="LxComposerPickerMenuPopup ComposerModelPickerPopupLynx"
          side="top"
          // Electron opens from the trigger's start edge and flips to its end on overflow.
          align="start"
          sideOffset={4}
        >
          <ComposerModelPickerPanel
            {...props}
            activeProvider={activeProvider}
            currentSelection={currentSelection}
            onClose={() => setOpen(false)}
          />
        </MenuPopup>
      </Menu>
    </view>
  );
}

/** Rendered only while the menu is open: provider ordering sorts with `toSorted`. */
function ComposerModelPickerPanel(
  props: ComposerModelPickerProps & {
    readonly activeProvider: ProviderKind;
    readonly currentSelection: ComposerTraitSelection;
    readonly onClose: () => void;
  },
) {
  const { activeProvider, lockedProvider } = props;
  const { starredModels, toggleStarredModel, unstarModel } = useStarredModels();
  const usableStarredModels =
    lockedProvider === null
      ? starredModels
      : starredModels.filter((entry) => entry.provider === lockedProvider);
  // Every open starts from the fastest entry point: presets when the user has any.
  const [tab, setTabState] = useState<ComposerModelPickerTab>(() =>
    usableStarredModels.length > 0 ? STARRED_TAB : activeProvider,
  );
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const searchRef = useRef<InputRef>(null);
  // Electron focuses the search field on open and on every tab switch. The native field
  // may not exist on the first pass, so focus is retried as the popup settles.
  useEffect(() => {
    "background only";
    // The menu settles its own focus while it opens; the late attempt lands after it.
    return scheduleLynxInputFocus(searchRef, [0, 60, 240]);
  }, [tab]);

  const setTab = (next: ComposerModelPickerTab) => {
    "background only";
    setTabState(next);
    if (next !== STARRED_TAB) props.onCatalogProviderChange(next);
  };

  const pickerSettings = readSettingsProviderPickerProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const providerTabs: ReadonlyArray<ProviderTab> = buildComposerProviderPickerItems({
    providers: props.providers,
    hiddenProviders: pickerSettings.hiddenProviders,
    providerOrder: pickerSettings.providerOrder,
    protectedProviders: [activeProvider],
  })
    // Electron's resolveVisibleProviderOptions: only providers the server reports as
    // installed get a tab; signed-out ones stay visible but disabled ("· Sign in").
    .filter((item) =>
      props.providers.some((status) => status.provider === item.provider && status.available),
    )
    .filter((item) => lockedProvider === null || item.provider === lockedProvider)
    .map((item) => ({
      provider: item.provider,
      label: item.label,
      unavailableLabel: item.disabled ? (item.statusLabel ?? "Unavailable") : null,
    }));

  const runtimeModelsFor = (provider: ProviderKind) =>
    provider === props.catalogProvider ? props.runtimeModels : [];
  const optionsFor = (provider: ProviderKind): ReadonlyArray<ProviderModelOption> =>
    resolveLynxProviderModelOptions({
      provider,
      currentModel: provider === activeProvider ? props.modelSelection.model : null,
      dynamicModels: runtimeModelsFor(provider),
    });
  const providerOptionsFor = (provider: ProviderKind): ProviderOptions | undefined =>
    provider === props.modelSelection.provider
      ? props.modelSelection.options
      : props.rememberedSelectionFor?.(provider)?.options;
  const traitSelectionFor = (provider: ProviderKind, model: string) =>
    getComposerTraitSelection(
      provider,
      model,
      "",
      providerOptionsFor(provider),
      resolveRuntimeModelDescriptor({
        provider,
        model,
        runtimeModels: runtimeModelsFor(provider),
      }),
    );

  // Starred rows only read the catalogs of providers that own a preset.
  const modelOptionsByProvider = {} as Record<ProviderKind, ReadonlyArray<ProviderModelOption>>;
  if (tab === STARRED_TAB) {
    for (const entry of usableStarredModels) {
      modelOptionsByProvider[entry.provider] ??= optionsFor(entry.provider);
    }
  }
  const rows: ReadonlyArray<PickerRow> =
    tab === STARRED_TAB
      ? buildStarredTabRows({
          starredModels: usableStarredModels,
          modelOptionsByProvider,
          query: normalizedQuery,
          current: {
            provider: activeProvider,
            model: props.modelSelection.model,
            ...resolveStarredTraits(props.currentSelection),
          },
          effortLevelsFor: (provider, model) => traitSelectionFor(provider, model).effortLevels,
        })
      : buildProviderTabRows({
          provider: tab,
          options: optionsFor(tab),
          query: normalizedQuery,
          selectedModel: tab === activeProvider ? props.modelSelection.model : null,
        });
  const starredModelSlots = new Set(starredModels.map(starredModelSlotKey));

  const commitRow = (
    row: PickerRow,
    model: ModelSlug,
    patch: Record<string, unknown>,
    keepOpen: boolean,
  ) => {
    "background only";
    const baseOptions = providerOptionsFor(row.provider);
    const options =
      Object.keys(patch).length > 0
        ? buildNextProviderOptions(row.provider, baseOptions, patch)
        : baseOptions;
    props.onModelSelectionChange(buildModelSelection(row.provider, model, options));
    if (!keepOpen) props.onClose();
  };

  const selectRow = (row: PickerRow) => {
    "background only";
    if (props.disabled) return;
    if (row.role) {
      commitRow(
        row,
        row.role.model as ModelSlug,
        row.role.thinkingLevel ? { thinkingLevel: row.role.thinkingLevel } : {},
        false,
      );
      return;
    }
    const model = row.selectableModel;
    if (model === null) return;
    const selection = traitSelectionFor(row.provider, model);
    // Switching to a model with an effort ladder keeps the panel up so the footer slider
    // can tune it; presets carry their effort and re-picking the current model is "done".
    const keepOpen = row.preset === null && !row.selected && selection.effortLevels.length > 0;
    commitRow(
      row,
      model,
      row.preset
        ? buildStarredModelOptionsPatch({ provider: row.provider, selection, starred: row.preset })
        : {},
      keepOpen,
    );
  };

  const openTabs: ComposerModelPickerTab[] = [
    STARRED_TAB,
    ...providerTabs
      .filter((entry) => entry.unavailableLabel === null)
      .map((entry) => entry.provider),
  ];
  const cycleTab = (direction: 1 | -1) => {
    "background only";
    const index = openTabs.indexOf(tab);
    setTab(openTabs[(index + direction + openTabs.length) % openTabs.length] ?? STARRED_TAB);
  };

  const handleKeyDown = (event: {
    readonly key: string;
    readonly metaKey?: boolean;
    readonly ctrlKey?: boolean;
    readonly altKey?: boolean;
    readonly shiftKey?: boolean;
    preventDefault?: () => void;
    stopPropagation?: () => void;
  }) => {
    "background only";
    if (event.key === "Tab") {
      event.preventDefault?.();
      event.stopPropagation?.();
      cycleTab(event.shiftKey ? -1 : 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault?.();
      const firstRow = rows[0];
      if (firstRow) selectRow(firstRow);
      return;
    }
    const rowIndex = modelPickerShortcutRowIndex({
      key: event.key,
      metaKey: event.metaKey === true,
      ctrlKey: event.ctrlKey === true,
      altKey: event.altKey === true,
      shiftKey: event.shiftKey === true,
    });
    if (rowIndex === null) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    const row = rows[rowIndex];
    if (row) selectRow(row);
  };

  // mod+1…3 are View-menu accelerators on the desktop host; while the picker is open the
  // host routes them (and hidden mod+4…9 accelerators) here instead of navigating.
  const pickShortcutRowRef = useRef<(rowIndex: number) => void>(() => undefined);
  pickShortcutRowRef.current = (rowIndex) => {
    const row = rows[rowIndex];
    if (row) selectRow(row);
  };
  useEffect(() => {
    "background only";
    let active = true;
    let dispose: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ "../../platform/bridge")
      .then(({ bridgeCall, onGlobalEvent }) => {
        if (!active) return;
        dispose = onGlobalEvent("shell:model-picker-key", (payload: unknown) => {
          const rowIndex = (payload as { readonly rowIndex?: unknown } | null)?.rowIndex;
          if (typeof rowIndex === "number") pickShortcutRowRef.current(rowIndex);
        });
        void bridgeCall("shellSetModelPickerShortcutsEnabled", { enabled: true }).catch(
          () => undefined,
        );
      })
      .catch(() => {
        // The Web host and test renderer do not expose desktop global events.
      });
    return () => {
      active = false;
      dispose?.();
      void import(/* webpackMode: "eager" */ "../../platform/bridge")
        .then(({ bridgeCall }) =>
          bridgeCall("shellSetModelPickerShortcutsEnabled", { enabled: false }),
        )
        .catch(() => undefined);
    };
  }, []);

  const isTabLoading = tab !== STARRED_TAB && props.modelsLoading && rows.length === 0;
  let shortcutIndex = 0;

  return (
    <view className="ComposerModelPickerPanelLynx" bindkeydown={handleKeyDown}>
      <ComposerModelPickerTabs
        tab={tab}
        providerTabs={providerTabs}
        onTabChange={setTab}
        onAddProviders={
          lockedProvider === null && props.onOpenProviderSettings
            ? () => {
                "background only";
                props.onClose();
                props.onOpenProviderSettings?.();
              }
            : undefined
        }
      />
      <view className="ComposerModelPickerSearchLynx">
        <SearchIconGlyph />
        <Input
          ref={searchRef}
          nativeInput
          unstyled
          size="sm"
          type="search"
          className="ComposerModelPickerSearchInputLynx"
          aria-label="Search models"
          placeholder={tab === STARRED_TAB ? "Search starred…" : "Search models…"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </view>
      <scroll-view
        className="ComposerModelPickerListLynx"
        scroll-orientation="vertical"
        role="tabpanel"
      >
        {isTabLoading ? (
          <view className="ComposerModelPickerLoadingLynx" aria-label="Loading models">
            {Array.from({ length: 5 }, (_, index) => (
              <view
                key={index}
                className={`ComposerModelPickerSkeletonLynx${
                  index % 3 === 0 ? " ComposerModelPickerSkeletonLynx--short" : ""
                }`}
              />
            ))}
          </view>
        ) : rows.length > 0 ? (
          groupRows(rows).map((group) => (
            <view key={group.key} className="ComposerModelPickerGroupLynx" role="group">
              {group.label !== null ? (
                <text className="ComposerModelPickerGroupLabelLynx">{group.label}</text>
              ) : null}
              {group.rows.map((row) => {
                const index = shortcutIndex++;
                return (
                  <ComposerModelPickerRowElement
                    key={row.key}
                    row={row}
                    shortcutHint={
                      row.selectableModel !== null && index < MODEL_PICKER_SHORTCUT_ROW_LIMIT
                        ? `${SHORTCUT_MODIFIER_LABEL}${index + 1}`
                        : null
                    }
                    selection={traitSelectionFor(row.provider, row.model)}
                    starredModelSlots={starredModelSlots}
                    onSelect={selectRow}
                    onToggleStar={toggleStarredModel}
                    onUnstarModel={unstarModel}
                  />
                );
              })}
            </view>
          ))
        ) : (
          <text className="ComposerModelPickerEmptyLynx">
            {normalizedQuery.length > 0
              ? "No matches"
              : tab === STARRED_TAB
                ? "Star a model to pin it here together with its effort and speed, then pick it in one click."
                : "No models found"}
          </text>
        )}
      </scroll-view>
      <ComposerModelPickerTraitFooter
        provider={props.modelSelection.provider}
        model={props.modelSelection.model}
        selection={props.currentSelection}
        onCommit={(patch) => {
          "background only";
          props.onModelSelectionChange(
            buildModelSelection(
              props.modelSelection.provider,
              props.modelSelection.model,
              buildNextProviderOptions(
                props.modelSelection.provider,
                props.modelSelection.options,
                patch,
              ),
            ),
          );
        }}
      />
    </view>
  );
}

// Rows arrive ordered by group; each run of equal labels becomes one labelled group.
function groupRows(rows: ReadonlyArray<PickerRow>) {
  const groups: Array<{ key: string; label: string | null; rows: PickerRow[] }> = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.label === row.groupLabel) {
      last.rows.push(row);
    } else {
      groups.push({ key: row.key, label: row.groupLabel, rows: [row] });
    }
  }
  return groups;
}

function SearchIconGlyph() {
  const { svgColors } = useTheme();
  return (
    <SearchIcon
      className="ComposerModelPickerSearchIconLynx"
      color={svgColors.foreground}
      size={14}
    />
  );
}

function ComposerModelPickerTabs(props: {
  readonly tab: ComposerModelPickerTab;
  readonly providerTabs: ReadonlyArray<ProviderTab>;
  readonly onTabChange: (tab: ComposerModelPickerTab) => void;
  readonly onAddProviders?: (() => void) | undefined;
}) {
  const { svgColors } = useTheme();
  return (
    <view className="ComposerModelPickerTabsLynx" role="tablist" aria-label="Model sources">
      <PickerTabButton
        label="Starred"
        active={props.tab === STARRED_TAB}
        onSelect={() => props.onTabChange(STARRED_TAB)}
      >
        {(color) => (
          <svg
            className="ComposerModelPickerTabGlyphLynx"
            content={colorizeLynxSvg(starFilledSvg, color)}
          />
        )}
      </PickerTabButton>
      {props.providerTabs.map((entry) => (
        <PickerTabButton
          key={entry.provider}
          label={
            entry.unavailableLabel ? `${entry.label} · ${entry.unavailableLabel}` : entry.label
          }
          active={props.tab === entry.provider}
          disabled={entry.unavailableLabel !== null}
          onSelect={() => props.onTabChange(entry.provider)}
        >
          {(color) => (
            <view className="ComposerModelPickerTabProviderIconLynx">
              <OpenAIProviderIcon
                provider={entry.provider}
                color={resolveProviderGlyphColor(entry.provider, color)}
              />
            </view>
          )}
        </PickerTabButton>
      ))}
      {props.onAddProviders ? (
        <PickerTabButton label="Add providers" active={false} onSelect={props.onAddProviders}>
          {() => (
            <PlusIcon
              className="ComposerModelPickerTabGlyphLynx"
              color={svgColors.mutedForeground70}
              size={14}
            />
          )}
        </PickerTabButton>
      ) : null}
    </view>
  );
}

function PickerTabButton(props: {
  readonly label: string;
  readonly active: boolean;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
  readonly children: (color: string) => ReactNode;
}) {
  const { svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerModelPickerTabLynx${
      props.active ? " ComposerModelPickerTabLynx--active" : ""
    }${props.disabled ? " ComposerModelPickerTabLynx--disabled" : ""}`,
    accessibleLabel: props.label,
    accessibilityValue: props.active ? "Selected" : undefined,
    disabled: props.disabled,
    onActivate: props.onSelect,
  });
  const color =
    props.active || interaction.className.includes("ui-hover")
      ? svgColors.foreground
      : svgColors.mutedForeground70;
  return (
    <view
      className={interaction.className}
      role="tab"
      aria-label={props.label}
      aria-selected={props.active}
      {...interaction.eventProps}
    >
      {props.children(color)}
      {props.active ? <view className="ComposerModelPickerTabIndicatorLynx" /> : null}
    </view>
  );
}

function ComposerModelPickerRowElement(props: {
  readonly row: PickerRow;
  readonly shortcutHint: string | null;
  readonly selection: ComposerTraitSelection;
  readonly starredModelSlots: ReadonlySet<string>;
  readonly onSelect: (row: PickerRow) => void;
  readonly onToggleStar: (entry: StarredModel) => void;
  readonly onUnstarModel: (entry: Pick<StarredModel, "provider" | "model">) => void;
}) {
  const { row } = props;
  const { svgColors } = useTheme();
  const starEntry: StarredModel = row.preset ?? {
    provider: row.provider,
    model: row.model,
    ...resolveStarredTraits(props.selection),
  };
  // Provider rows ignore pinned traits: the provider's current traits are shared by all of
  // its models, so matching them would hide the star of every other preset.
  const starred = row.preset !== null || props.starredModelSlots.has(starredModelSlotKey(row));
  const content = (
    <view className="ComposerModelPickerRowContentLynx">
      {row.preset ? (
        <view className="ComposerModelPickerRowProviderLynx">
          <OpenAIProviderIcon
            provider={row.provider}
            color={resolveProviderGlyphColor(row.provider, svgColors.mutedForeground70)}
          />
        </view>
      ) : null}
      <text
        className={`ComposerModelPickerRowNameLynx${
          row.detail !== null ? " ComposerModelPickerRowNameLynx--withDetail" : ""
        }`}
      >
        {row.name}
      </text>
      <text className="ComposerModelPickerRowDetailLynx">{row.detail ?? ""}</text>
      {props.shortcutHint ? (
        <view className="ComposerModelPickerKbdLynx">
          <text className="ComposerModelPickerKbdTextLynx">{props.shortcutHint}</text>
        </view>
      ) : null}
      {row.selectableModel !== null ? (
        <ModelStarButton
          starred={starred}
          label={
            starred
              ? `Remove ${row.name} from starred`
              : `Star ${row.name} with its current effort and speed`
          }
          onToggle={() =>
            row.preset === null && starred
              ? props.onUnstarModel(row)
              : props.onToggleStar(starEntry)
          }
        />
      ) : null}
    </view>
  );
  return (
    <MenuItem
      className={`ComposerModelPickerRowLynx${
        row.selected ? " ComposerModelPickerRowLynx--selected" : ""
      }`}
      disabled={row.selectableModel === null && !row.role}
      closeOnClick={false}
      onClick={() => props.onSelect(row)}
    >
      {content}
    </MenuItem>
  );
}

function ModelStarButton(props: {
  readonly starred: boolean;
  readonly label: string;
  readonly onToggle: () => void;
}) {
  const { resolvedTheme, svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerModelPickerStarLynx${
      props.starred ? " ComposerModelPickerStarLynx--starred" : ""
    }`,
    accessibleLabel: props.label,
    accessibilityValue: props.starred ? "On" : "Off",
    onActivate: props.onToggle,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.label}
      aria-pressed={props.starred}
      {...lynxNestedInteractiveEventProps(interaction.eventProps)}
    >
      <svg
        className="ComposerModelPickerStarGlyphLynx"
        content={colorizeLynxSvg(
          props.starred ? starFilledSvg : starSvg,
          props.starred ? (resolvedTheme === "dark" ? "#fbbf24" : "#f59e0b") : svgColors.foreground,
        )}
      />
    </view>
  );
}

/**
 * Electron's `ComposerModelPickerTraitRows` in slider mode: the effort slider card owns
 * effort and speed; thinking and context keep their "<Trait> … <value> ›" rows.
 */
function ComposerModelPickerTraitFooter(props: {
  readonly provider: ProviderKind;
  readonly model: string;
  readonly selection: ComposerTraitSelection;
  readonly onCommit: (patch: Record<string, unknown>) => void;
}) {
  const { provider, selection } = props;
  const usesEffortSlider = selection.effortLevels.length > 0;
  const contextWindowTraitId = selection.contextWindowDescriptor?.id ?? "contextWindow";
  const contextWindowValue = selection.contextWindow ?? selection.defaultContextWindow ?? "";
  const rows: ReactNode[] = [];
  if (selection.thinkingEnabled !== null) {
    rows.push(
      <TraitRow
        key="thinking"
        label="Thinking"
        value={selection.thinkingEnabled ? "on" : "off"}
        valueLabel={selection.thinkingEnabled ? "On" : "Off"}
        options={[
          { value: "on", label: "On", isDefault: true },
          { value: "off", label: "Off" },
        ]}
        onValueChange={(value) => props.onCommit({ thinking: value === "on" })}
      />,
    );
  }
  if (selection.contextWindowOptions.length > 1) {
    rows.push(
      <TraitRow
        key="context"
        label={selection.contextWindowDescriptor?.label ?? "Context"}
        value={contextWindowValue}
        valueLabel={
          selection.contextWindowOptions.find((option) => option.value === contextWindowValue)
            ?.label ?? contextWindowValue
        }
        options={selection.contextWindowOptions.map((option) => ({
          value: option.value,
          label: option.label,
          isDefault: option.value === selection.defaultContextWindow,
        }))}
        onValueChange={(value) => props.onCommit({ [contextWindowTraitId]: value })}
      />,
    );
  }
  if (supportsComposerFastModeControl(selection) && !usesEffortSlider) {
    rows.push(
      <TraitRow
        key="speed"
        label="Speed"
        value={selection.fastModeEnabled ? "on" : "off"}
        valueLabel={selection.fastModeEnabled ? "Fast" : "Standard"}
        options={[
          { value: "off", label: "Standard", isDefault: true },
          { value: "on", label: "Fast" },
        ]}
        onValueChange={(value) => props.onCommit({ fastMode: value === "on" })}
      />,
    );
  }
  if (rows.length === 0 && !usesEffortSlider) return null;
  return (
    <view className="ComposerModelPickerFooterLynx">
      {usesEffortSlider ? (
        <ComposerEffortSliderCard
          provider={provider}
          selection={selection}
          onCommit={props.onCommit}
        />
      ) : null}
      {rows}
    </view>
  );
}

function ComposerEffortSliderCard(props: {
  readonly provider: ProviderKind;
  readonly selection: ComposerTraitSelection;
  readonly onCommit: (patch: Record<string, unknown>) => void;
}) {
  const { provider, selection } = props;
  const { svgColors } = useTheme();
  const { effortLevels, defaultEffort, effort, fastModeEnabled, ultrathinkPromptControlled } =
    selection;
  const supportsFastMode = supportsComposerFastModeControl(selection);
  const ladderIndex = resolveComposerEffortLadderIndex(selection);
  const statusLabel =
    resolveComposerTraitStatusLabel(selection) ?? effortLevels[ladderIndex]?.label ?? "Effort";
  const effortIsDefault = ultrathinkPromptControlled || effort === defaultEffort;
  const canReset = fastModeEnabled || !effortIsDefault;

  const changeIndex = (nextIndex: number) => {
    "background only";
    if (nextIndex === ladderIndex) return;
    const nextLevel = effortLevels[nextIndex];
    if (!nextLevel) return;
    const plan = planComposerEffortChange({
      provider,
      selection,
      prompt: "",
      value: nextLevel.value,
    });
    // Prompt-injected levels (Ultrathink) need the composer prompt, which this card lacks.
    if (plan?.kind === "options") props.onCommit(plan.patch);
  };
  const reset = () => {
    "background only";
    const effortPlan =
      defaultEffort && !effortIsDefault
        ? planComposerEffortChange({ provider, selection, prompt: "", value: defaultEffort })
        : null;
    props.onCommit({
      ...(effortPlan?.kind === "options" ? effortPlan.patch : {}),
      ...(fastModeEnabled ? { fastMode: false } : {}),
    });
  };

  return (
    <view className="ComposerEffortSliderCardLynx" data-slot="effort-slider-card">
      <view className="ComposerEffortSliderCardHeaderLynx">
        {supportsFastMode ? (
          <CardIconButton
            label="Fast mode"
            pressed={fastModeEnabled}
            onActivate={() => props.onCommit({ fastMode: !fastModeEnabled })}
          >
            <svg
              className="ComposerEffortSliderCardGlyphLynx"
              content={colorizeLynxSvg(
                fastModeEnabled ? fastModeSvg : fastModeOutlineSvg,
                fastModeEnabled ? svgColors.iconAccent : svgColors.mutedForeground70,
              )}
            />
          </CardIconButton>
        ) : (
          <view className="ComposerEffortSliderCardSpacerLynx" />
        )}
        <text className="ComposerEffortSliderCardLabelLynx">{statusLabel}</text>
        <CardIconButton label="Reset effort and speed" disabled={!canReset} onActivate={reset}>
          <svg
            className="ComposerEffortSliderCardGlyphLynx"
            content={colorizeLynxSvg(resetSvg, svgColors.mutedForeground70)}
          />
        </CardIconButton>
      </view>
      <view className="ComposerEffortSliderCardTrackLynx">
        <ComposerEffortSlider
          labels={effortLevels.map((level) => level.label)}
          index={ladderIndex}
          disabled={ultrathinkPromptControlled}
          onIndexChange={changeIndex}
        />
      </view>
      {ultrathinkPromptControlled ? (
        <text className="ComposerEffortSliderCardNoteLynx">
          Remove Ultrathink from the prompt to change effort.
        </text>
      ) : null}
    </view>
  );
}

function CardIconButton(props: {
  readonly label: string;
  readonly pressed?: boolean;
  readonly disabled?: boolean;
  readonly onActivate: () => void;
  readonly children: ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerEffortSliderCardButtonLynx${
      props.disabled ? " ComposerEffortSliderCardButtonLynx--disabled" : ""
    }`,
    accessibleLabel: props.label,
    accessibilityValue: props.pressed === undefined ? undefined : props.pressed ? "On" : "Off",
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.label}
      aria-pressed={props.pressed}
      {...interaction.eventProps}
    >
      {props.children}
    </view>
  );
}

// Footer row "<Trait> ……… <value> ›" opening a radio submenu. Picking a value closes only
// the submenu, so model and traits can be composed (and starred) in one visit.
function TraitRow(props: {
  readonly label: string;
  readonly value: string;
  readonly valueLabel: string;
  readonly options: ReadonlyArray<{ value: string; label: string; isDefault?: boolean }>;
  readonly onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <MenuSub open={open} onOpenChange={setOpen}>
      <MenuSubTrigger className="ComposerModelPickerTraitRowLynx">
        <view className="ComposerModelPickerTraitRowContentLynx">
          <text className="ComposerModelPickerTraitRowLabelLynx">{props.label}</text>
          <text className="ComposerModelPickerTraitRowValueLynx">{props.valueLabel}</text>
        </view>
      </MenuSubTrigger>
      <MenuSubPopup
        align="end"
        className="LxComposerPickerMenuPopup ComposerModelPickerTraitPopupLynx"
      >
        {props.options.map((option) => (
          <MenuItem
            key={option.value}
            selectionRole="radio"
            selected={option.value === props.value}
            closeOnClick={false}
            trailing={
              option.value === props.value ? (
                <CheckIcon className="LxMenuIndicatorIcon" />
              ) : undefined
            }
            onClick={() => {
              "background only";
              props.onValueChange(option.value);
              setOpen(false);
            }}
          >
            {`${option.label}${option.isDefault ? " (default)" : ""}`}
          </MenuItem>
        ))}
      </MenuSubPopup>
    </MenuSub>
  );
}
