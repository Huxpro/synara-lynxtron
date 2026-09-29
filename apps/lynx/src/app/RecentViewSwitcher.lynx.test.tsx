import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { RecentViewSwitcherLynx } from "./RecentViewSwitcher.lynx";

describe("Native recent-view switcher", () => {
  it("renders shared display entries and selected state", () => {
    render(
      <RecentViewSwitcherLynx
        selectedIndex={1}
        entries={[
          {
            key: "thread:one",
            view: { kind: "thread", threadId: "one" as never },
            kind: "thread",
            icon: { kind: "chat" },
            title: "First chat",
            subtitle: "Project · Chat",
            isCurrent: true,
            isPinned: false,
            isSplit: false,
            isTerminal: false,
          },
          {
            key: "settings:appearance",
            view: { kind: "settings", section: "appearance" },
            kind: "settings",
            icon: { kind: "settings" },
            title: "Settings",
            subtitle: "Appearance",
            isCurrent: false,
            isPinned: false,
            isSplit: false,
            isTerminal: false,
          },
        ]}
      />,
    );

    expect(elementTree.root?.textContent).toContain("First chat");
    expect(elementTree.root?.textContent).toContain("Settings");
    expect(elementTree.root?.textContent).toContain("2 recent views");
    expect(elementTree.root?.querySelectorAll(".RecentViewSwitcherRow--selected")).toHaveLength(1);
    expect(elementTree.root?.querySelectorAll(".LxKbd")).toHaveLength(4);
    expect(elementTree.root?.querySelector('[accessibility-label="Pinned"]')).toBeNull();
  });

  it("uses Electron-authority icon identities with explicit secondary paint", () => {
    const source = readFileSync(new URL("./RecentViewSwitcher.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain("import consoleSvg from '@synara-central-icons/console.svg?raw'");
    expect(source).toContain("import chatSvg from '@synara-central-icons/bubble-text.svg?raw'");
    expect(source).toContain("import pluginSvg from '@synara-central-icons/puzzle.svg?raw'");
    expect(source).toContain(
      "import settingsSvg from '@synara-central-icons/settings-gear-4.svg?raw'",
    );
    expect(source).toContain("import windowSvg from '@synara-central-icons/window.svg?raw'");
    expect(source).toContain(
      "import splitViewSvg from '@synara-central-icons/sidebar-simple-left-wide.svg?raw'",
    );
    expect(source).toContain("import pinFilledSvg from '@synara-central-icons-fill/pin.svg?raw'");
    expect(source).toContain("const secondary = semanticIconColor('secondary')");
    expect(source).toContain("colorizeLynxSvg(consoleSvg, primary)");
    expect(source).toContain("colorizeLynxSvg(chatSvg, secondary)");
    expect(source).not.toContain("<LayoutColumnsIcon");
    expect(source).not.toContain("<PuzzleIcon");
    expect(source).not.toContain("<SettingsIcon");
  });

  it("keeps the popup and current pill on explicit physical borders", () => {
    const styles = readFileSync(new URL("./recent-view-switcher.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.RecentViewSwitcherPopup\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.RecentViewSwitcherCurrent\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.RecentViewSwitcherFooter\s*\{[^}]*border-top-width:\s*1px;[^}]*border-top-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);/s,
    );
  });

  it("preserves pinned and split view metadata as visible trailing icons", () => {
    render(
      <RecentViewSwitcherLynx
        selectedIndex={0}
        entries={[
          {
            key: "thread:pin",
            view: { kind: "thread", threadId: "pin" as never },
            kind: "thread",
            icon: { kind: "chat" },
            title: "Pinned",
            subtitle: "Project · Chat",
            isCurrent: false,
            isPinned: true,
            isSplit: false,
            isTerminal: false,
          },
          {
            key: "thread:split",
            view: { kind: "thread", threadId: "split" as never },
            kind: "thread",
            icon: { kind: "terminal", iconKey: "terminal" },
            title: "Split",
            subtitle: "Project · Terminal",
            isCurrent: false,
            isPinned: false,
            isSplit: true,
            isTerminal: true,
          },
        ]}
      />,
    );

    expect(elementTree.root?.querySelector('[accessibility-label="Pinned"]')).not.toBeNull();
    expect(elementTree.root?.querySelector('[accessibility-label="Split view"]')).not.toBeNull();
  });
});
