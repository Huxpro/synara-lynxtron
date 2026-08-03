import type { ResolvedKeybindingsConfig } from "@synara/contracts";
import { useState } from "react";

import { ShortcutKbd } from "~/components/ui/shortcut-kbd";
import { getNavigatorPlatform } from "~/platform/env";
import {
  buildShortcutSheetSections,
  filterShortcutSheetSections,
  type ShortcutSheetContext,
} from "~/shortcutsSheet";
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
}: {
  readonly keybindings: ResolvedKeybindingsConfig;
  readonly platform?: string;
}) {
  const [query, setQuery] = useState("");
  const sections = buildShortcutSheetSections({
    keybindings,
    projectScripts: [],
    platform,
    context: SETTINGS_SHORTCUT_CONTEXT,
  });
  const filteredSections = filterShortcutSheetSections(sections, query);

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
