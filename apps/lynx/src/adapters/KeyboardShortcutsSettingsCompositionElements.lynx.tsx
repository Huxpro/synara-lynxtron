import type { ReactNode } from 'react';

import { Input } from '../components/ui/input.lynx';
import './keyboard-shortcuts-settings-composition-elements.css';

type ChildrenProps = {
  readonly children: ReactNode;
};

export function KeyboardShortcutsRootElement({ children }: ChildrenProps) {
  return <view className="SharedKeyboardShortcutsRoot">{children}</view>;
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
        if (event.key !== 'Escape' || query.length === 0) return;
        event.preventDefault?.();
        event.stopPropagation?.();
        onEscape();
      }}
      className="SharedKeyboardShortcutsSearch"
    />
  );
}

export function KeyboardShortcutsCardElement({ children }: ChildrenProps) {
  return <view className="SharedKeyboardShortcutsCard">{children}</view>;
}

export function KeyboardShortcutsHeaderElement({
  commandLabel,
  keybindingLabel,
}: {
  readonly commandLabel: string;
  readonly keybindingLabel: string;
}) {
  return (
    <view className="SharedKeyboardShortcutsHeader">
      <text className="SharedKeyboardShortcutsHeaderText">{commandLabel}</text>
      <text className="SharedKeyboardShortcutsHeaderText">{keybindingLabel}</text>
    </view>
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
    <view
      className={`SharedKeyboardShortcutsRow${
        muted ? ' SharedKeyboardShortcutsRow--muted' : ''
      }`}
    >
      {copy}
      {shortcut}
    </view>
  );
}

export function KeyboardShortcutsCopyElement({ children }: ChildrenProps) {
  return <view className="SharedKeyboardShortcutsCopy">{children}</view>;
}

export function KeyboardShortcutsTitleElement({ children }: ChildrenProps) {
  return <text className="SharedKeyboardShortcutsTitle">{children}</text>;
}

export function KeyboardShortcutsDescriptionElement({ children }: ChildrenProps) {
  return <text className="SharedKeyboardShortcutsDescription">{children}</text>;
}

export function KeyboardShortcutsShortcutElement({ children }: ChildrenProps) {
  return <view className="SharedKeyboardShortcutsShortcut">{children}</view>;
}

export function KeyboardShortcutsEmptyElement({ children }: ChildrenProps) {
  return (
    <view className="SharedKeyboardShortcutsEmpty">
      <text className="SharedKeyboardShortcutsEmptyText">{children}</text>
    </view>
  );
}
