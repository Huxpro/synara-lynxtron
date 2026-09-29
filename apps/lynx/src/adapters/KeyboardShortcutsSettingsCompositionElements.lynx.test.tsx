import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Keyboard Shortcuts settings anatomy", () => {
  it("matches the Web header rhythm and divider ownership", () => {
    const styles = readFileSync(
      new URL("./keyboard-shortcuts-settings-composition-elements.css", import.meta.url),
      "utf8",
    );
    expect(styles).toMatch(
      /\.SharedKeyboardShortcutsCard,\s*\.SharedKeyboardShortcutsEmpty\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-radius:\s*8px;/s,
    );

    expect(styles).toMatch(
      /\.SharedKeyboardShortcutsHeader\s*\{[^}]*padding:\s*8px 12px;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SharedKeyboardShortcutsHeaderText\s*\{[^}]*font-size:\s*11px;[^}]*font-weight:\s*500;[^}]*line-height:\s*16\.5px;/s,
    );
    expect(styles).toMatch(
      /\.SharedKeyboardShortcutsRow\s*\{[^}]*min-height:\s*59px;[^}]*padding:\s*10px 12px;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SharedKeyboardShortcutsRow:last-child\s*\{[^}]*border-bottom-width:\s*0;/s,
    );
    expect(styles).not.toMatch(/\.SharedKeyboardShortcutsRow\s*\{[^}]*border-top:/s);
  });
});
