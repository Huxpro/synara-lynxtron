// FILE: ComposerModelEffortPicker.tsx
// Purpose: Combined composer picker for model + effort/reasoning + speed in a single trigger.
// Layer: Chat composer presentation
// Depends on: provider/model menu items, traits menu content (which owns the fast-mode
//   toggle in its Effort header), shared menu primitives, and composer trait helpers.

import {
  type ModelSlug,
  type ProviderAgentDescriptor,
  type ProviderKind,
  type ProviderModelDescriptor,
  type ProviderModelOptions,
  type ServerProviderStatus,
  type ThreadId,
} from "@synara/contracts";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { type ProviderModelOption } from "../../providerModelOptions";
import type { FavoriteModelProvider } from "../../lib/modelFavorites";
import { Button } from "../ui/button";
import { Menu, MenuSeparator, MenuSub, MenuSubTrigger, MenuTrigger } from "../ui/menu";
import { ShortcutKbd } from "../ui/shortcut-kbd";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { PROVIDER_ICON_COMPONENT_BY_PROVIDER } from "../ProviderIcon";
import {
  COMPOSER_PICKER_MODEL_SUBMENU_HEIGHT_CLASS_NAME,
  COMPOSER_PICKER_TRIGGER_TEXT_CLASS_NAME,
} from "./composerPickerStyles";
import { ComposerModelTriggerComposition } from "./ComposerModelTriggerComposition";
import { ComposerPickerMenuPopup, ComposerPickerMenuSubPopup } from "./ComposerPickerMenuPopup";
import { getComposerTraitSelection, hasVisibleComposerTraitControls } from "./composerTraits";
import {
  getProviderIconClassName,
  ProviderModelMenuItems,
  resolveProviderModelLabel,
} from "./ProviderModelPicker";
import { TraitsMenuContent } from "./TraitsPicker";

type ComposerModelEffortPickerProps = {
  // Model picker data.
  provider: ProviderKind;
  model: ModelSlug;
  lockedProvider: ProviderKind | null;
  providers?: ReadonlyArray<ServerProviderStatus>;
  modelOptionsByProvider: Record<ProviderKind, ReadonlyArray<ProviderModelOption>>;
  loadingModelProviders?: Partial<Record<ProviderKind, boolean>>;
  hiddenProviders?: ReadonlyArray<ProviderKind>;
  providerOrder?: ReadonlyArray<ProviderKind>;
  compact?: boolean;
  // Narrow-composer degradation: drop the model name (provider icon stays)
  // and/or the effort/status label; both remain available to assistive tech.
  hideModelLabel?: boolean;
  hideStatusLabel?: boolean;
  disabled?: boolean;
  onProviderModelChange: (provider: ProviderKind, model: ModelSlug) => void;
  onSelectionCommitted?: () => void;

  // Traits/effort/speed data.
  threadId: ThreadId;
  runtimeModel?: ProviderModelDescriptor | undefined;
  runtimeModels?: ReadonlyArray<ProviderModelDescriptor> | null | undefined;
  runtimeAgents?: ReadonlyArray<ProviderAgentDescriptor> | null | undefined;
  modelOptions: ProviderModelOptions[ProviderKind] | undefined;
  prompt: string;
  onPromptChange: (prompt: string) => void;

  // Shared menu control.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  shortcutLabel?: string | null;
  initialOpen?: boolean;
  initialSubmenuOpen?: boolean;
  initialSearchQuery?: string;
  favoriteModelSlugsOverride?: Partial<Record<FavoriteModelProvider, ReadonlyArray<string>>>;
  onFavoriteModelSlugsChange?: (
    provider: FavoriteModelProvider,
    slugs: ReadonlyArray<string>,
  ) => void;
};

// Renders a single composer trigger that combines model selection, reasoning
// effort, and the optional speed/fast-mode toggle. The primary menu hosts the
// reasoning radio group (with fast mode as an icon toggle in its Effort
// header); the model is reachable via a sub-menu so the footer stays compact.
export function ComposerModelEffortPicker(props: ComposerModelEffortPickerProps) {
  const { onOpenChange, open } = props;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.initialOpen ?? false);
  const isMenuOpen = open ?? uncontrolledOpen;

  const setMenuOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const activeProvider = props.lockedProvider ?? props.provider;
  const ProviderIcon = PROVIDER_ICON_COMPONENT_BY_PROVIDER[activeProvider];
  const modelLabel = resolveProviderModelLabel({
    provider: props.provider,
    lockedProvider: props.lockedProvider,
    model: props.model,
    modelOptionsByProvider: props.modelOptionsByProvider,
  });

  const traitSelection = getComposerTraitSelection(
    props.provider,
    props.model,
    props.prompt,
    props.modelOptions,
    props.runtimeModel,
  );

  const {
    caps,
    effort,
    effortLevels,
    thinkingEnabled,
    fastModeEnabled,
    fastModeDescriptor,
    ultrathinkPromptControlled,
  } = traitSelection;

  const supportsFastModeControl = fastModeDescriptor !== null || caps.supportsFastMode;
  const hasTraitsTopSection = hasVisibleComposerTraitControls(traitSelection);

  const effortLabel = effort
    ? (effortLevels.find((level) => level.value === effort)?.label ?? effort)
    : null;
  const triggerStatusLabel = ultrathinkPromptControlled
    ? "Ultrathink"
    : effortLabel
      ? effortLabel
      : thinkingEnabled !== null
        ? `Thinking ${thinkingEnabled ? "On" : "Off"}`
        : null;
  const showsFastBadge = supportsFastModeControl && fastModeEnabled;

  const handleAfterModelSelection = () => {
    setMenuOpen(false);
    props.onSelectionCommitted?.();
  };

  const handleAfterTraitsSelection = () => {
    setMenuOpen(false);
    props.onSelectionCommitted?.();
  };

  const hiddenTriggerTitle = [
    props.hideModelLabel ? modelLabel : null,
    props.hideStatusLabel ? triggerStatusLabel : null,
  ]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" · ");

  const triggerButton = (
    <Button
      size="sm"
      variant="chrome"
      disabled={props.disabled ?? false}
      className={cn(
        "min-w-0 shrink-0 justify-start gap-1.5 whitespace-nowrap px-2 sm:px-2.5 [&_svg]:mx-0",
        COMPOSER_PICKER_TRIGGER_TEXT_CLASS_NAME,
      )}
      aria-label="Change model and reasoning"
      {...(hiddenTriggerTitle.length > 0 ? { title: hiddenTriggerTitle } : {})}
    />
  );

  const triggerContent = (
    <ComposerModelTriggerComposition
      provider={activeProvider}
      modelLabel={modelLabel}
      statusLabel={triggerStatusLabel}
      showFastBadge={showsFastBadge}
      hideModelLabel={props.hideModelLabel ?? false}
      hideStatusLabel={props.hideStatusLabel ?? false}
    />
  );

  return (
    <Menu
      open={isMenuOpen}
      onOpenChange={(nextOpen) => {
        if (props.disabled) {
          setMenuOpen(false);
          return;
        }
        setMenuOpen(nextOpen);
      }}
    >
      {props.shortcutLabel ? (
        <Tooltip>
          <TooltipTrigger render={<MenuTrigger render={triggerButton} />}>
            {triggerContent}
          </TooltipTrigger>
          {!isMenuOpen ? (
            <TooltipPopup side="top" sideOffset={6} variant="picker">
              <span className="inline-flex items-center gap-2 px-1 py-0.5">
                <span>Change model</span>
                <ShortcutKbd
                  shortcutLabel={props.shortcutLabel}
                  className="h-4 min-w-4 px-1 text-[length:var(--app-font-size-ui-2xs,9px)] text-muted-foreground"
                />
              </span>
            </TooltipPopup>
          ) : null}
        </Tooltip>
      ) : (
        <MenuTrigger render={triggerButton}>{triggerContent}</MenuTrigger>
      )}
      <ComposerPickerMenuPopup align="end" side="top" fixedWidth>
        {hasTraitsTopSection ? (
          <TraitsMenuContent
            provider={props.provider}
            threadId={props.threadId}
            model={props.model}
            {...(props.runtimeModel ? { runtimeModel: props.runtimeModel } : {})}
            {...(props.runtimeModels !== undefined ? { runtimeModels: props.runtimeModels } : {})}
            {...(props.runtimeAgents !== undefined ? { runtimeAgents: props.runtimeAgents } : {})}
            modelOptions={props.modelOptions}
            prompt={props.prompt}
            onPromptChange={props.onPromptChange}
            onSelectionComplete={handleAfterTraitsSelection}
          />
        ) : null}

        {hasTraitsTopSection ? <MenuSeparator /> : null}

        <MenuSub defaultOpen={props.initialSubmenuOpen ?? false}>
          <MenuSubTrigger>
            <ProviderIcon
              aria-hidden="true"
              className={cn("size-3 shrink-0", getProviderIconClassName(activeProvider))}
            />
            <span className="truncate">{modelLabel}</span>
          </MenuSubTrigger>
          <ComposerPickerMenuSubPopup
            fixedWidth
            className={COMPOSER_PICKER_MODEL_SUBMENU_HEIGHT_CLASS_NAME}
          >
            <ProviderModelMenuItems
              provider={props.provider}
              model={props.model}
              lockedProvider={props.lockedProvider}
              {...(props.providers ? { providers: props.providers } : {})}
              modelOptionsByProvider={props.modelOptionsByProvider}
              {...(props.loadingModelProviders
                ? { loadingModelProviders: props.loadingModelProviders }
                : {})}
              {...(props.hiddenProviders ? { hiddenProviders: props.hiddenProviders } : {})}
              {...(props.providerOrder ? { providerOrder: props.providerOrder } : {})}
              {...(props.disabled !== undefined ? { disabled: props.disabled } : {})}
              onProviderModelChange={props.onProviderModelChange}
              onAfterSelection={handleAfterModelSelection}
              initialSearchQuery={props.initialSearchQuery}
              {...(props.favoriteModelSlugsOverride
                ? { favoriteModelSlugsOverride: props.favoriteModelSlugsOverride }
                : {})}
              {...(props.onFavoriteModelSlugsChange
                ? { onFavoriteModelSlugsChange: props.onFavoriteModelSlugsChange }
                : {})}
            />
          </ComposerPickerMenuSubPopup>
        </MenuSub>
      </ComposerPickerMenuPopup>
    </Menu>
  );
}
