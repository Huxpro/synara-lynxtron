// FILE: SettingsSidebarChromeCompositionElements.tsx
// Purpose: Browser host elements for the physical-shared Settings sidebar chrome.

import type { KeyboardEvent, ReactNode } from "react";

import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import { SearchInput } from "~/components/ui/search-input";
import { SidebarLeadingIcon } from "~/components/SidebarLeadingIcon";
import {
  SETTINGS_SIDEBAR_ICON_CLASS_NAME,
  SETTINGS_SIDEBAR_ITEM_CLASS_NAME,
  SETTINGS_SIDEBAR_ITEM_LABEL_CLASS_NAME,
  SETTINGS_SIDEBAR_ROW_FILL_HOVER_CLASS_NAME,
  SETTINGS_SIDEBAR_SECTION_LABEL_CLASS_NAME,
} from "~/settingsSidebarNavStyles";

type ChildrenProps = { readonly children?: ReactNode | undefined };

export function SettingsSidebarChromeRootElement(props: ChildrenProps) {
  return <div>{props.children}</div>;
}

export function SettingsSidebarBackRegionElement(props: ChildrenProps) {
  return <div className="mb-3">{props.children}</div>;
}

export function SettingsSidebarBackButtonElement(
  props: ChildrenProps & { readonly onActivate: () => void },
) {
  return (
    <button
      type="button"
      className={cn(SETTINGS_SIDEBAR_ITEM_CLASS_NAME, SETTINGS_SIDEBAR_ROW_FILL_HOVER_CLASS_NAME)}
      onClick={props.onActivate}
    >
      {props.children}
    </button>
  );
}

export function SettingsSidebarBackIconElement() {
  return (
    <SidebarLeadingIcon size="sm" tone="text-inherit">
      <CentralIcon name="arrow-left" className={SETTINGS_SIDEBAR_ICON_CLASS_NAME} />
    </SidebarLeadingIcon>
  );
}

export function SettingsSidebarBackLabelElement(props: ChildrenProps) {
  return <span className={SETTINGS_SIDEBAR_ITEM_LABEL_CLASS_NAME}>{props.children}</span>;
}

export function SettingsSidebarSearchRegionElement(props: ChildrenProps) {
  return <div className="mb-3 px-1">{props.children}</div>;
}

export function SettingsSidebarSearchElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly accessibleLabel: string;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly onSubmit?: (() => void) | undefined;
  readonly onEscape?: (() => void) | undefined;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      props.onSubmit?.();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      props.onEscape?.();
    }
  };

  return (
    <SearchInput
      value={props.value}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      placeholder={props.placeholder}
      aria-label={props.accessibleLabel}
      onChange={(event) => props.onValueChange?.(event.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

export function SettingsSidebarSearchUnavailableElement(props: ChildrenProps) {
  return <p className={SETTINGS_SIDEBAR_SECTION_LABEL_CLASS_NAME}>{props.children}</p>;
}
