import type { ResolvedKeybindingsConfig } from "@synara/contracts";
import { useState } from "react";

import { ShortcutKbd } from "~/components/ui/shortcut-kbd";
import { getNavigatorPlatform } from "~/platform/env";
import {
  buildShortcutSheetSections,
  filterShortcutSheetSections,
  type ShortcutSheetContext,
} from "~/shortcutsSheet";
import { isMacPlatform } from "~/lib/utils";
import {
  KeyboardShortcutsCardElement,
  KeyboardShortcutsCopyElement,
  KeyboardShortcutsDescriptionElement,
  KeyboardShortcutsEmptyElement,
  KeyboardShortcutsHeaderElement,
  KeyboardShortcutsRootElement,
  KeyboardShortcutsRowElement,
  KeyboardShortcutsSearchElement,
  KeyboardShortcutsShortcutElement,
  KeyboardShortcutsTitleElement,
} from "~/components/settings/KeyboardShortcutsSettingsCompositionElements";

const SETTINGS_SHORTCUT_CONTEXT: ShortcutSheetContext = {
  terminalFocus: false,
  terminalOpen: false,
  terminalWorkspaceOpen: false,
};

export function KeyboardShortcutsSettingsComposition({
  keybindings,
  platform = getNavigatorPlatform(),
  includeDesktopShellShortcuts = false,
}: {
  readonly keybindings: ResolvedKeybindingsConfig;
  readonly platform?: string;
  readonly includeDesktopShellShortcuts?: boolean;
}) {
  const [query, setQuery] = useState("");
  const sections = buildShortcutSheetSections({
    keybindings,
    projectScripts: [],
    platform,
    context: SETTINGS_SHORTCUT_CONTEXT,
  });
  const desktopModifier = isMacPlatform(platform) ? "⌘" : "Ctrl+";
  const filteredSections = filterShortcutSheetSections(
    includeDesktopShellShortcuts
      ? [
          ...sections,
          {
            id: "desktop-shell",
            title: "Desktop shell",
            description: "Shortcuts owned by the Lynxtron application window.",
            entries: [
              {
                id: "reload",
                label: "Reload app",
                description: "Reload the current Lynx bundle while preserving the active route.",
                shortcutLabel: `${desktopModifier}R`,
              },
              {
                id: "force-reload",
                label: "Force reload app",
                description:
                  "Reload the current Lynx bundle when the normal reload path is unavailable.",
                shortcutLabel: `${desktopModifier}${isMacPlatform(platform) ? "⇧" : "Shift+"}R`,
              },
            ],
          },
        ]
      : sections,
    query,
  );

  return (
    <KeyboardShortcutsRootElement>
      <KeyboardShortcutsSearchElement
        query={query}
        onQueryChange={setQuery}
        onEscape={() => setQuery("")}
      />

      {filteredSections.length > 0 ? (
        <KeyboardShortcutsCardElement>
          <KeyboardShortcutsHeaderElement
            commandLabel="Command"
            keybindingLabel="Keybinding"
          />
          {filteredSections.flatMap((section) =>
            section.entries.map((entry) => (
              <KeyboardShortcutsRowElement
                key={`${section.id}:${entry.id}`}
                muted={section.tone === "muted"}
                copy={
                  <KeyboardShortcutsCopyElement>
                    <KeyboardShortcutsTitleElement>{entry.label}</KeyboardShortcutsTitleElement>
                    <KeyboardShortcutsDescriptionElement>
                      {entry.description}
                    </KeyboardShortcutsDescriptionElement>
                  </KeyboardShortcutsCopyElement>
                }
                shortcut={
                  <KeyboardShortcutsShortcutElement>
                    <ShortcutKbd shortcutLabel={entry.shortcutLabel} />
                  </KeyboardShortcutsShortcutElement>
                }
              />
            )),
          )}
        </KeyboardShortcutsCardElement>
      ) : (
        <KeyboardShortcutsEmptyElement>
          No shortcuts match “{query}”.
        </KeyboardShortcutsEmptyElement>
      )}
    </KeyboardShortcutsRootElement>
  );
}
