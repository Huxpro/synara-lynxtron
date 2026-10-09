import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("semantic icon consumer audit", () => {
  it("routes thread-header chrome through semantic icon roles", () => {
    const source = readFileSync(new URL("./ThreadHeaderActions.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./thread-header-actions.css", import.meta.url), "utf8");
    expect(source).toContain('semanticIconColor("primary")');
    expect(source).toContain('color="var(--color-icon-secondary)"');
    expect(source).not.toContain('color="var(--muted-foreground)"');
    expect(styles).toMatch(
      /\.ThreadHeaderTextActionIcon\s*\{[^}]*color:\s*var\(--color-icon-primary\);/s,
    );
  });

  it("keeps composer neutral icons stable across hover and pressed states", () => {
    const styles = readFileSync(
      new URL("../components/composer/composer.css", import.meta.url),
      "utf8",
    );
    for (const className of [
      "ComposerModelTriggerFastIconLynx",
      "ComposerModelTriggerStatusIconLynx",
      "ComposerCommandIconLynx",
      "ComposerVoiceIconLynx",
      "ComposerModelSearchIconLynx",
      "ComposerProviderBackIconLynx",
      "ComposerTraitFastModeToggleIconLynx",
      "ComposerExtrasItemIconLynx",
      "ComposerReferenceTileIconLynx",
      "ComposerReferenceActionChevronLynx",
    ]) {
      expect(styles).toMatch(
        new RegExp(`\\.${className}[\\s\\S]{0,180}color:\\s*var\\(--color-icon-secondary\\);`),
      );
    }
    const model = readFileSync(
      new URL("../components/composer/ComposerModelControl.lynx.tsx", import.meta.url),
      "utf8",
    );
    const picker = readFileSync(
      new URL("../adapters/ComposerProjectPickerCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const meter = readFileSync(
      new URL("../adapters/ComposerInputCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(model).toContain('semanticIconColor("secondary")');
    expect(picker).toContain('semanticIconColor("secondary")');
    expect(meter).toContain('semanticIconColor("primary")');
    expect(meter).toContain('semanticIconColor("secondary")');
    const composer = readFileSync(
      new URL("../components/composer/Composer.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(composer).toContain('semanticIconColor("primary")');
  });

  it("assigns Environment primary, secondary, and disabled icon roles explicitly", () => {
    const source = readFileSync(new URL("./EnvironmentPanel.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./environment-panel.css", import.meta.url), "utf8");
    expect(source).toContain('semanticIconColor("primary")');
    expect(source).toContain('semanticIconColor("secondary")');
    expect(source).toContain('semanticIconColor("disabled")');
    expect(source).not.toContain("svgColors.foreground");
    expect(source).not.toContain("svgColors.mutedForeground");
    expect(styles).toMatch(
      /\.EnvironmentCanonicalIcon\s*\{[^}]*color:\s*var\(--color-icon-primary\);/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentPinnedActionIcon\s*\{[^}]*color:\s*var\(--color-icon-secondary\);/s,
    );
  });

  it("normalizes right-dock, terminal, profile, and PR row action icons", () => {
    for (const [relativePath, expected] of [
      ["./ThreadRightDockTabs.lynx.tsx", 'semanticIconColor("secondary")'],
      ["./DockTerminalPane.lynx.tsx", 'semanticIconColor("secondary")'],
      // Profile actions paint with the foreground, like Electron's.
      ["./SettingsProfilePanel.lynx.tsx", "colorizeLynxSvg(pencilSvg, svgColors.foreground)"],
      [
        "../adapters/PullRequestRowCompositionElements.lynx.tsx",
        'semanticIconColor(props.pinned ? "primary" : "secondary")',
      ],
    ] as const) {
      const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
      expect(source).toContain(expected);
    }
  });

  it("classifies transcript, Diff, and full Editor raw SVG icons", () => {
    const transcript = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const diff = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");

    expect(transcript).toContain('semanticIconColor("primary")');
    // Transcript row actions read the same secondary role from the palette.
    expect(transcript).toContain("svgColors.iconSecondary");
    expect(transcript).not.toContain("svgColors.mutedForeground");
    expect(diff.match(/semanticIconColor\("secondary"\)/g)).toHaveLength(5);
    expect(router).toContain('semanticIconColor("accent")');
    expect(router.match(/semanticIconColor\("primary"\)/g)?.length).toBeGreaterThanOrEqual(5);
    expect(router.match(/semanticIconColor\("secondary"\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("classifies remaining route and shared-adapter neutral SVG icons", () => {
    for (const [relativePath, expected] of [
      ["./AppSnapWelcomeDialog.lynx.tsx", 'semanticIconColor("primary")'],
      [
        "../adapters/PullRequestRouteControlsCompositionElements.lynx.tsx",
        'semanticIconColor("primary")',
      ],
      // Upstream's sidebar rows draw provider glyphs in the foreground.
      [
        "../adapters/SidebarThreadProviderIdentityElements.lynx.tsx",
        "colorizeLynxSvg(source, svgColors.foreground)",
      ],
      ["../adapters/KanbanCardCompositionElements.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../adapters/PullRequestCommentComposer.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../adapters/SidebarListSectionHeaderElements.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../components/markdown/ExternalLinkIcon.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../components/OpenAIProviderIcon.lynx.tsx", 'semanticIconColor("secondary")'],
      ["./ProfileUsageKindIcon.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../adapters/DesktopTitlebarControls.lynx.tsx", 'semanticIconColor("primary")'],
      [
        "../adapters/ProviderModelOptionGroupListCompositionElements.lynx.tsx",
        'semanticIconColor("secondary")',
      ],
      ["./EmptyThreadContextTray.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../components/sidebar/Sidebar.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../components/markdown/MarkdownInlineTokenIcon.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../adapters/PullRequestStateIcon.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../adapters/PullRequestSummaryMetaIcon.lynx.tsx", 'semanticIconColor("secondary")'],
      ["../adapters/PullRequestCheckStatusIcon.lynx.tsx", 'semanticIconColor("secondary")'],
    ] as const) {
      const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
      expect(source).toContain(expected);
    }
  });
});
