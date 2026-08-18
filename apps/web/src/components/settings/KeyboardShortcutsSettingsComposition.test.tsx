import type { ResolvedKeybindingsConfig } from "@synara/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KeyboardShortcutsSettingsComposition } from "./KeyboardShortcutsSettingsComposition";
import { buildShortcutSheetSections, filterShortcutSheetSections } from "../../shortcutsSheet";

const keybindings: ResolvedKeybindingsConfig = [
  {
    command: "sidebar.search",
    shortcut: {
      key: "k",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      modKey: true,
    },
  },
  {
    command: "chat.new",
    shortcut: {
      key: "n",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      modKey: true,
    },
  },
];

describe("KeyboardShortcutsSettingsComposition", () => {
  it("renders the canonical searchable command table from resolved server keybindings", () => {
    const markup = renderToStaticMarkup(
      <KeyboardShortcutsSettingsComposition keybindings={keybindings} platform="MacIntel" />,
    );

    expect(markup).toContain('aria-label="Search shortcuts"');
    expect(markup).toContain("Command");
    expect(markup).toContain("Keybinding");
    expect(markup).toContain("Show keyboard shortcuts");
    expect(markup).toContain("Search projects and threads");
    expect(markup).toContain("New thread");
    expect(markup).toContain("⌘");
    expect(markup).toContain("K");
    expect(markup).toContain("N");
  });

  it("renders host-owned supplemental shortcuts through the shared table", () => {
    const markup = renderToStaticMarkup(
      <KeyboardShortcutsSettingsComposition
        keybindings={keybindings}
        platform="MacIntel"
        includeDesktopShellShortcuts
      />,
    );

    expect(markup).toContain("Reload app");
    expect(markup).toContain("Reload the current Lynx bundle while preserving the active route.");
    expect(markup).toContain("R");
  });

  it("uses Ctrl labels for desktop shell shortcuts outside macOS", () => {
    const markup = renderToStaticMarkup(
      <KeyboardShortcutsSettingsComposition
        keybindings={keybindings}
        platform="Win32"
        includeDesktopShellShortcuts
      />,
    );

    expect(markup).toContain("Ctrl");
    expect(markup).toContain("Shift");
  });

  it("keeps both desktop reload actions discoverable through shortcut filtering", () => {
    const sections = buildShortcutSheetSections({
      keybindings,
      projectScripts: [],
      platform: "MacIntel",
      context: {
        terminalFocus: false,
        terminalOpen: false,
        terminalWorkspaceOpen: false,
      },
    });
    const filtered = filterShortcutSheetSections(
      [
        ...sections,
        {
          id: "desktop-shell",
          title: "Desktop shell",
          description: "Shortcuts owned by the Lynxtron application window.",
          entries: [
            {
              id: "reload",
              label: "Reload app",
              description: "Reload the current Lynx bundle.",
              shortcutLabel: "⌘R",
            },
            {
              id: "force-reload",
              label: "Force reload app",
              description: "Force reload the current Lynx bundle.",
              shortcutLabel: "⌘⇧R",
            },
          ],
        },
      ],
      "reload",
    );

    expect(filtered.flatMap((section) => section.entries).map((entry) => entry.label)).toEqual([
      "Reload app",
      "Force reload app",
    ]);
  });
});
