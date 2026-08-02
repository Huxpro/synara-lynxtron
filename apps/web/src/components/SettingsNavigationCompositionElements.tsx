// FILE: SettingsNavigationCompositionElements.tsx
// Purpose: Browser elements beneath the physical-shared settings navigation.

import type { ReactNode } from "react";

import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import { SidebarLeadingIcon } from "./SidebarLeadingIcon";
import {
  SETTINGS_SIDEBAR_ICON_CLASS_NAME,
  SETTINGS_SIDEBAR_ITEM_CLASS_NAME,
  SETTINGS_SIDEBAR_ITEM_LABEL_CLASS_NAME,
  SETTINGS_SIDEBAR_LIST_GAP_CLASS_NAME,
  SETTINGS_SIDEBAR_ROW_FILL_ACTIVE_CLASS_NAME,
  SETTINGS_SIDEBAR_ROW_FILL_HOVER_CLASS_NAME,
  SETTINGS_SIDEBAR_SECTION_CLASS_NAME,
  SETTINGS_SIDEBAR_SECTION_LABEL_CLASS_NAME,
} from "../settingsSidebarNavStyles";

export function SettingsNavigationRootElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <nav aria-label="Settings sections" className="flex flex-col">
      {props.children}
    </nav>
  );
}

export function SettingsNavigationGroupElement(props: {
  readonly groupId: string;
  readonly children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`settings-nav-${props.groupId}`}
      className={SETTINGS_SIDEBAR_SECTION_CLASS_NAME}
    >
      {props.children}
    </section>
  );
}

export function SettingsNavigationGroupLabelElement(props: {
  readonly groupId: string;
  readonly children?: ReactNode;
}) {
  return (
    <h2
      id={`settings-nav-${props.groupId}`}
      className={SETTINGS_SIDEBAR_SECTION_LABEL_CLASS_NAME}
    >
      {props.children}
    </h2>
  );
}

export function SettingsNavigationListElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <ul className={cn("flex flex-col", SETTINGS_SIDEBAR_LIST_GAP_CLASS_NAME)}>
      {props.children}
    </ul>
  );
}

export function SettingsNavigationItemElement(props: {
  readonly children?: ReactNode;
}) {
  return <li>{props.children}</li>;
}

export function SettingsNavigationItemButtonElement(props: {
  readonly active: boolean;
  readonly accessibleLabel: string;
  readonly disabled: boolean;
  readonly onSelect: () => void;
  readonly children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={props.accessibleLabel}
      aria-current={props.active ? "page" : undefined}
      aria-disabled={props.disabled || undefined}
      disabled={props.disabled}
      className={cn(
        SETTINGS_SIDEBAR_ITEM_CLASS_NAME,
        props.active
          ? SETTINGS_SIDEBAR_ROW_FILL_ACTIVE_CLASS_NAME
          : SETTINGS_SIDEBAR_ROW_FILL_HOVER_CLASS_NAME,
        props.disabled && "cursor-not-allowed opacity-45",
      )}
      onClick={props.onSelect}
    >
      {props.children}
    </button>
  );
}

export function SettingsNavigationIconElement(props: {
  readonly name: string;
}) {
  return (
    <SidebarLeadingIcon size="sm" tone="text-inherit">
      <CentralIcon name={props.name} className={SETTINGS_SIDEBAR_ICON_CLASS_NAME} />
    </SidebarLeadingIcon>
  );
}

export function SettingsNavigationItemLabelElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <span className={SETTINGS_SIDEBAR_ITEM_LABEL_CLASS_NAME}>
      {props.children}
    </span>
  );
}
