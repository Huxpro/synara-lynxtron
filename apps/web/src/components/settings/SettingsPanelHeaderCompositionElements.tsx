// FILE: SettingsPanelHeaderCompositionElements.tsx
// Purpose: Browser elements beneath the shared settings panel header.

import type { ReactNode } from "react";

import { Button } from "../ui/button";
import { RotateCcwIcon } from "../../lib/icons";

type ChildrenProps = {
  readonly children?: ReactNode;
};

export function SettingsPanelHeaderRootElement(props: ChildrenProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      {props.children}
    </div>
  );
}

export function SettingsPanelHeaderCopyElement(props: ChildrenProps) {
  return <div className="min-w-0">{props.children}</div>;
}

export function SettingsPanelHeaderTitleElement(props: ChildrenProps) {
  return (
    <h1 className="text-[length:var(--type-settings-header-title-size)] leading-[var(--type-settings-header-title-line-height)] font-medium tracking-tight text-foreground">
      {props.children}
    </h1>
  );
}

export function SettingsPanelHeaderDescriptionElement(props: ChildrenProps) {
  return (
    <p className="mt-1.5 text-[length:var(--type-settings-header-description-size)] leading-[var(--type-settings-header-description-line-height)] text-muted-foreground">
      {props.children}
    </p>
  );
}

export function SettingsPanelHeaderRestoreElement(props: {
  readonly disabled: boolean;
  readonly onRestore: () => void;
}) {
  return (
    <Button
      size="xs"
      variant="outline"
      className="shrink-0"
      disabled={props.disabled}
      onClick={props.onRestore}
    >
      <RotateCcwIcon className="size-3.5" />
      Restore defaults
    </Button>
  );
}
