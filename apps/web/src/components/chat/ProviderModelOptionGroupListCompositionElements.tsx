import type { ReactNode } from "react";

import { StarFilledIcon, StarIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../ui/collapsible";
import { DisclosureChevron } from "../ui/DisclosureChevron";
import { MenuGroup, MenuGroupLabel, MenuRadioItem } from "../ui/menu";
import {
  COMPOSER_PICKER_MODEL_GROUP_HEADER_CLASS_NAME,
  COMPOSER_PICKER_MODEL_ROW_LABEL_INDENT_CLASS_NAME,
  COMPOSER_PICKER_RADIUS_CLASS_NAME,
} from "./composerPickerStyles";
import type { FavoriteModelProvider } from "./ProviderModelOptionGroupListComposition";

export function ProviderModelOptionListFrameElement(props: { readonly children: ReactNode }) {
  return <div className="flex flex-col gap-px">{props.children}</div>;
}

export function ProviderModelGroupElement(props: { readonly children: ReactNode }) {
  return <MenuGroup className="flex flex-col gap-px px-0.5">{props.children}</MenuGroup>;
}

export function ProviderModelGroupLabelElement(props: { readonly children: ReactNode }) {
  return <MenuGroupLabel>{props.children}</MenuGroupLabel>;
}

export function ProviderModelCollapsibleGroupElement(props: {
  readonly children: ReactNode;
  readonly label: string;
  readonly count: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Collapsible open={props.open} onOpenChange={props.onOpenChange} className="px-0.5">
      <CollapsibleTrigger
        className={cn(
          COMPOSER_PICKER_MODEL_GROUP_HEADER_CLASS_NAME,
          props.open && "text-foreground/75",
        )}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <DisclosureChevron open={props.open} className="col-start-1 size-3 shrink-0 opacity-50" />
        <span className="col-start-2 min-w-0 truncate normal-case tracking-normal">
          {props.label}
        </span>
        <span className="col-start-3 shrink-0 justify-self-end rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-1.5 py-px text-ui-2xs font-normal tabular-nums normal-case tracking-normal text-muted-foreground/70">
          {props.count}
        </span>
      </CollapsibleTrigger>
      <CollapsiblePanel className="flex flex-col gap-px pb-0.5">{props.children}</CollapsiblePanel>
    </Collapsible>
  );
}

export function ProviderModelRadioItemElement(props: {
  readonly active: boolean;
  readonly costMultiplierLabel: string | null;
  readonly description?: string | undefined;
  readonly favoriteProvider: FavoriteModelProvider | null;
  readonly isFavorite: boolean;
  readonly modelName: string;
  readonly modelSlug: string;
  readonly onAfterSelection?: (() => void) | undefined;
  readonly onSelect: () => void;
  readonly onToggleFavorite: () => void;
}) {
  const supportsFavorites = props.favoriteProvider !== null;
  const preserveChildLayout = supportsFavorites || props.costMultiplierLabel !== null;
  return (
    <MenuRadioItem
      value={props.modelSlug}
      preserveChildLayout={preserveChildLayout}
      className={props.costMultiplierLabel ? "grid-cols-[minmax(0,1fr)_auto]" : undefined}
      trailing={
        supportsFavorites ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={props.isFavorite}
            aria-label={
              props.isFavorite
                ? `Remove ${props.modelName} from favourites`
                : `Add ${props.modelName} to favourites`
            }
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground/50 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60",
              COMPOSER_PICKER_RADIUS_CLASS_NAME,
              props.isFavorite && "text-amber-400 hover:text-amber-300",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              props.onToggleFavorite();
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
          >
            {props.isFavorite ? (
              <StarFilledIcon aria-hidden="true" className="size-3" />
            ) : (
              <StarIcon aria-hidden="true" className="size-3" />
            )}
          </button>
        ) : props.costMultiplierLabel && props.description ? (
          <span
            title={props.description}
            className="shrink-0 text-ui-xs font-medium tabular-nums text-muted-foreground/65"
          >
            <span aria-hidden="true">{props.costMultiplierLabel}</span>
            <span className="sr-only">{props.description}</span>
          </span>
        ) : null
      }
      onClick={props.onAfterSelection}
    >
      {preserveChildLayout ? (
        <span
          className={cn(
            "block min-w-0 truncate",
            supportsFavorites && COMPOSER_PICKER_MODEL_ROW_LABEL_INDENT_CLASS_NAME,
          )}
        >
          {props.modelName}
        </span>
      ) : (
        props.modelName
      )}
    </MenuRadioItem>
  );
}
