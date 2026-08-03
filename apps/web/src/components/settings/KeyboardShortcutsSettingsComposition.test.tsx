import type { ResolvedKeybindingsConfig } from "@synara/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KeyboardShortcutsSettingsComposition } from "./KeyboardShortcutsSettingsComposition";

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
});
