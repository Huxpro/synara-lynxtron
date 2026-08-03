import type { ReactNode } from "react";

import { Input } from "~/components/ui/input";
import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import {
  SETTINGS_CARD_CLASS_NAME,
  SETTINGS_CARD_ROW_CLASS_NAME,
  SETTINGS_CARD_ROW_DESCRIPTION_CLASS_NAME,
  SETTINGS_CARD_ROW_TITLE_CLASS_NAME,
  SETTINGS_EMPTY_STATE_CLASS_NAME,
} from "~/settingsPanelStyles";

type ChildrenProps = {
  readonly children: ReactNode;
};

export function KeyboardShortcutsRootElement({ children }: ChildrenProps) {
  return <div className="space-y-4">{children}</div>;
}

export function KeyboardShortcutsSearchElement({
  query,
  onQueryChange,
  onEscape,
}: {
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly onEscape: () => void;
}) {
  return (
    <div className="relative w-full">
      <Input
        type="search"
        size="sm"
        variant="soft"
        nativeInput
        placeholder="Search shortcuts..."
        value={query}
        aria-label="Search shortcuts"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || query.length === 0) return;
          event.preventDefault();
          event.stopPropagation();
          onEscape();
        }}
        className="[&>[data-slot=input]]:pr-9"
      />
      <CentralIcon
        name="cmd-box"
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
      />
    </div>
  );
}

export function KeyboardShortcutsCardElement({ children }: ChildrenProps) {
  return (
    <div className={cn(SETTINGS_CARD_CLASS_NAME, "divide-y divide-[color:var(--color-border)]")}>
      {children}
    </div>
  );
}

export function KeyboardShortcutsHeaderElement({
  commandLabel,
  keybindingLabel,
}: {
  readonly commandLabel: string;
  readonly keybindingLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2 text-[11px] font-medium text-muted-foreground">
      <span>{commandLabel}</span>
      <span>{keybindingLabel}</span>
    </div>
  );
}

export function KeyboardShortcutsRowElement({
  muted,
  copy,
  shortcut,
}: {
  readonly muted: boolean;
  readonly copy: ReactNode;
  readonly shortcut: ReactNode;
}) {
  return (
    <div
      className={cn(
        SETTINGS_CARD_ROW_CLASS_NAME,
        "flex items-center justify-between gap-4",
        muted && "opacity-75",
      )}
    >
      {copy}
      {shortcut}
    </div>
  );
}

export function KeyboardShortcutsCopyElement({ children }: ChildrenProps) {
  return <div className="min-w-0 space-y-0.5">{children}</div>;
}

export function KeyboardShortcutsTitleElement({ children }: ChildrenProps) {
  return <div className={cn(SETTINGS_CARD_ROW_TITLE_CLASS_NAME, "truncate")}>{children}</div>;
}

export function KeyboardShortcutsDescriptionElement({ children }: ChildrenProps) {
  return (
    <div className={cn(SETTINGS_CARD_ROW_DESCRIPTION_CLASS_NAME, "truncate")}>{children}</div>
  );
}

export function KeyboardShortcutsShortcutElement({ children }: ChildrenProps) {
  return <div className="shrink-0">{children}</div>;
}

export function KeyboardShortcutsEmptyElement({ children }: ChildrenProps) {
  return (
    <div
      className={cn(
        SETTINGS_EMPTY_STATE_CLASS_NAME,
        "px-4 py-10 text-center text-sm text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}
