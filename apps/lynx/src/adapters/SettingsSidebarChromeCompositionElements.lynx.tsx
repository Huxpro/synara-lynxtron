import { useEffect, useRef, type ReactNode } from "@lynx-js/react";
import type { InputRef } from "@lynx-js/lynx-ui";

import { ArrowLeftIcon, SearchIcon } from "../lib/icons.lynx";
import { Input } from "../components/ui/input";
import "./settings-sidebar-chrome-composition-elements.css";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

type ChildrenProps = { readonly children?: ReactNode };

export function SettingsSidebarChromeRootElement(props: ChildrenProps) {
  return <view className="SharedSettingsSidebarChrome">{props.children}</view>;
}

export function SettingsSidebarBackRegionElement(props: ChildrenProps) {
  return <view className="SharedSettingsSidebarBackRegion">{props.children}</view>;
}

export function SettingsSidebarBackButtonElement(
  props: ChildrenProps & { readonly onActivate: () => void },
) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedSettingsSidebarBackButton",
    accessibleLabel: "Back to app",
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} aria-label="Back to app" {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

export function SettingsSidebarBackIconElement() {
  return (
    <view className="SharedSettingsSidebarBackIcon">
      <ArrowLeftIcon size={16} color="var(--foreground)" />
    </view>
  );
}

export function SettingsSidebarBackLabelElement(props: ChildrenProps) {
  return <text className="SharedSettingsSidebarBackLabel">{props.children}</text>;
}

export function SettingsSidebarSearchRegionElement(props: ChildrenProps) {
  return <view className="SharedSettingsSidebarSearchRegion">{props.children}</view>;
}

export function SettingsSidebarSearchElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly accessibleLabel: string;
  readonly onValueChange?: (value: string) => void;
  readonly onSubmit?: () => void;
  readonly onEscape?: () => void;
}) {
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (props.value.length === 0) {
      void inputRef.current?.setValue("").catch(() => undefined);
    }
  }, [props.value]);
  return (
    <view className="SharedSettingsSidebarSearch">
      <view className="SharedSettingsSidebarSearchIcon">
        <SearchIcon size={14} color="var(--muted-foreground)" />
      </view>
      <Input
        ref={inputRef}
        className="SharedSettingsSidebarSearchInput"
        size="sm"
        variant="soft"
        defaultValue={props.value}
        placeholder={props.placeholder}
        aria-label={props.accessibleLabel}
        confirmType="search"
        onChange={(event) => props.onValueChange?.(event.target.value)}
        onConfirm={props.onSubmit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation?.();
            props.onEscape?.();
          }
        }}
      />
    </view>
  );
}

export function SettingsSidebarSearchUnavailableElement(props: ChildrenProps) {
  return (
    <view
      className="SharedSettingsSidebarSearchUnavailable"
      aria-label="Search settings unavailable"
      aria-disabled="true"
      accessibility-element
      accessibility-label="Search settings unavailable"
      accessibility-trait="search"
      accessibility-state={{ disabled: true }}
      focusable={false}
    >
      <view className="SharedSettingsSidebarSearchIcon">
        <SearchIcon size={14} color="var(--muted-foreground)" />
      </view>
      <text className="SharedSettingsSidebarSearchUnavailableText">{props.children}</text>
    </view>
  );
}
