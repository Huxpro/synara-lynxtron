import type { SpaceIconName } from "@synara/contracts";
import type { ReactNode } from "react";

import { PlusIcon, RefreshCwIcon, XIcon } from "~/lib/icons";
import { SpaceIcon } from "../SpaceIcon";
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuSeparator, MenuTrigger } from "../ui/menu";
import { FolderClosed } from "../FolderClosed";
import { PickerTriggerButton } from "./PickerTriggerButton";
import { ComposerPickerMenuPopup } from "./ComposerPickerMenuPopup";
import { PickerPanelShell } from "./PickerPanelShell";

export function ComposerProjectPickerFrameElement(props: {
  readonly children?: ReactNode | undefined;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly align: "start" | "center" | "end";
  readonly side: "top" | "bottom";
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly triggerClassName?: string | undefined;
  readonly triggerLabel: string;
  readonly triggerTestId?: string | undefined;
}) {
  return (
    <Menu open={props.open} onOpenChange={props.onOpenChange}>
      <MenuTrigger
        render={
          <PickerTriggerButton
            data-testid={props.triggerTestId ?? "project-picker-trigger"}
            icon={<FolderClosed className="size-3.5" />}
            label={
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="min-w-0 truncate text-[var(--color-text-foreground)]">
                  {props.primaryLabel}
                </span>
                {props.secondaryLabel ? (
                  <span className="min-w-0 truncate text-muted-foreground/60 text-ui">
                    {props.secondaryLabel}
                  </span>
                ) : null}
              </span>
            }
            hideChevron
            className={props.triggerClassName}
            aria-label={props.triggerLabel}
          />
        }
      />
      <ComposerPickerMenuPopup align={props.align} side={props.side} className="min-w-72">
        {props.children}
      </ComposerPickerMenuPopup>
    </Menu>
  );
}

export function ComposerProjectPickerPanelElement(props: {
  readonly children?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
  readonly placeholder: string;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
}) {
  return (
    <PickerPanelShell
      searchPlaceholder={props.placeholder}
      query={props.query}
      onQueryChange={props.onQueryChange}
      stopSearchKeyPropagation
      autoFocusSearch
      widthClassName="w-full"
      bleedParentPadding
      listMaxHeightClassName="max-h-64"
      footer={props.footer}
    >
      {props.children}
    </PickerPanelShell>
  );
}

export function ComposerProjectPickerGroupElement(props: {
  readonly children?: ReactNode | undefined;
  readonly separatorBefore: boolean;
}) {
  return (
    <>
      {props.separatorBefore ? <MenuSeparator /> : null}
      <MenuGroup>{props.children}</MenuGroup>
    </>
  );
}

export function ComposerProjectPickerGroupLabelElement(props: {
  readonly children?: ReactNode | undefined;
  readonly icon: SpaceIconName | "black-hole";
}) {
  return (
    <MenuGroupLabel className="flex items-center gap-1.5">
      <SpaceIcon icon={props.icon} className="size-3 shrink-0" />
      <span className="min-w-0 truncate">{props.children}</span>
    </MenuGroupLabel>
  );
}

export function ComposerProjectPickerOptionElement(props: {
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <MenuItem data-project-picker-option={props.primaryLabel} onClick={props.onSelect}>
      <span className="flex w-full min-w-0 items-center gap-2">
        <FolderClosed className="size-3.5 shrink-0 text-muted-foreground/70" />
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="min-w-0 truncate">{props.primaryLabel}</span>
          {props.secondaryLabel ? (
            <span className="min-w-0 truncate text-muted-foreground/60 text-ui">
              {props.secondaryLabel}
            </span>
          ) : null}
        </span>
        <span className="ml-auto shrink-0 text-ui" aria-hidden={!props.selected}>
          {props.selected ? "✓" : ""}
        </span>
      </span>
    </MenuItem>
  );
}

export function ComposerProjectPickerEmptyElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return (
    <p className="px-3 py-6 text-center text-ui-sm text-muted-foreground/60">{props.children}</p>
  );
}

export function ComposerProjectPickerFooterElement(props: {
  readonly children?: ReactNode | undefined;
  readonly errorMessage: string | null;
}) {
  return (
    <>
      {props.children}
      {props.errorMessage ? (
        <p className="px-2 pb-1 text-destructive text-ui">{props.errorMessage}</p>
      ) : null}
    </>
  );
}

export function ComposerProjectPickerActionElement(props: {
  readonly children?: ReactNode | undefined;
  readonly kind: "add" | "reset" | "retry";
  readonly disabled?: boolean | undefined;
  readonly onActivate: () => void;
}) {
  const Icon = props.kind === "add" ? PlusIcon : props.kind === "reset" ? XIcon : RefreshCwIcon;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-ui transition-colors hover:bg-[var(--color-background-elevated-secondary)] hover:text-[var(--color-text-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={props.disabled}
      onClick={props.onActivate}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
      <span className="truncate">{props.children}</span>
    </button>
  );
}
