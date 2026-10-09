import type { ReactNode } from "react";

import { FastModeIcon, FastModeOutlineIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { MenuGroup, MenuGroupLabel, MenuRadioGroup, MenuRadioItem } from "../ui/menu";

export function ComposerTraitFastModeToggleElement(props: {
  readonly enabled: boolean;
  readonly onToggle: () => void;
}) {
  const Icon = props.enabled ? FastModeIcon : FastModeOutlineIcon;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Fast mode"
            aria-pressed={props.enabled}
            className="-my-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
            onClick={props.onToggle}
          />
        }
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5",
            props.enabled ? "text-[hsl(var(--chart-4))]" : "text-muted-foreground/70",
          )}
        />
      </TooltipTrigger>
      <TooltipPopup side="top" variant="picker">
        {props.enabled ? "Fast mode on" : "Fast mode off"}
      </TooltipPopup>
    </Tooltip>
  );
}

export function ComposerTraitSectionElement(props: {
  readonly children: ReactNode;
  readonly label: string;
  readonly labelTrailing?: ReactNode | undefined;
  readonly note?: ReactNode | undefined;
}) {
  return (
    <MenuGroup>
      {props.labelTrailing ? (
        <MenuGroupLabel className="flex items-center justify-between gap-2">
          {props.label}
          {props.labelTrailing}
        </MenuGroupLabel>
      ) : (
        <MenuGroupLabel>{props.label}</MenuGroupLabel>
      )}
      {props.note}
      {props.children}
    </MenuGroup>
  );
}

export function ComposerTraitRadioGroupElement(props: {
  readonly children: ReactNode;
  readonly value: string;
}) {
  return <MenuRadioGroup value={props.value}>{props.children}</MenuRadioGroup>;
}

export function ComposerTraitRadioItemElement(props: {
  readonly active: boolean;
  readonly description?: string | null | undefined;
  readonly disabled: boolean;
  readonly isDefault: boolean;
  readonly label: string;
  readonly value: string;
  readonly onSelect: () => void;
  readonly onSelectionComplete?: (() => void) | undefined;
}) {
  const item = (
    <MenuRadioItem
      value={props.value}
      {...(props.disabled ? { disabled: true } : {})}
      onClick={() => {
        props.onSelect();
        props.onSelectionComplete?.();
      }}
    >
      {props.label}
      {props.isDefault ? " (default)" : ""}
    </MenuRadioItem>
  );
  return props.description ? (
    <Tooltip>
      <TooltipTrigger render={item} />
      <TooltipPopup
        side="right"
        variant="picker"
        className="max-w-80 whitespace-normal leading-tight"
      >
        {props.description}
      </TooltipPopup>
    </Tooltip>
  ) : (
    item
  );
}
