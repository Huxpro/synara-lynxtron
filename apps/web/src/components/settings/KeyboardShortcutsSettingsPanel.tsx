// FILE: KeyboardShortcutsSettingsPanel.tsx
// Purpose: Read-only keyboard-shortcuts reference for the settings screen — the same content
//          the Mod+/ sheet shows, presented as a searchable Command / Keybinding table.
// Layer: Settings UI components
// Depends on: shared shortcut-sheet builder/filter, server keybindings config, and the Kbd pill.

import type { ResolvedKeybindingsConfig } from "@synara/contracts";
import { useQuery } from "@tanstack/react-query";

import { serverConfigQueryOptions } from "~/lib/serverReactQuery";
import { KeyboardShortcutsSettingsComposition } from "./KeyboardShortcutsSettingsComposition";
// Stable empty reference while the server config query is still loading.
const EMPTY_KEYBINDINGS: ResolvedKeybindingsConfig = [];

export function KeyboardShortcutsSettingsPanel() {
  const serverConfigQuery = useQuery(serverConfigQueryOptions());
  const keybindings = serverConfigQuery.data?.keybindings ?? EMPTY_KEYBINDINGS;
  return <KeyboardShortcutsSettingsComposition keybindings={keybindings} />;
}
