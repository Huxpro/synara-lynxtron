import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native composer footer responsiveness", () => {
  const composerSource = readFileSync(
    new URL("../components/composer/Composer.lynx.tsx", import.meta.url),
    "utf8",
  );
  const modelSource = readFileSync(
    new URL("../components/composer/ComposerModelControl.lynx.tsx", import.meta.url),
    "utf8",
  );
  const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../components/composer/composer.css", import.meta.url), "utf8");
  const compositionSource = readFileSync(
    new URL("../adapters/ComposerInputCompositionElements.lynx.tsx", import.meta.url),
    "utf8",
  );

  it("reuses the Web compact breakpoint with the actual post-dock chat width", () => {
    expect(composerSource).toContain("shouldUseCompactComposerFooter");
    expect(composerSource).toContain("readonly availableWidth?: number | null");
    expect(composerSource).toContain(
      "const compactFooter = shouldUseCompactComposerFooter(availableWidth)",
    );
    expect(routerSource).toContain("availableWidth={threadHeaderAvailableWidth}");
  });

  it("compacts the shared footer anatomy and hides verbose labels", () => {
    expect(composerSource).toContain("<ComposerFooterRowComposition compact={compactFooter}>");
    expect(composerSource).toContain(
      "<ComposerFooterContentComposition\n          compact={compactFooter}",
    );
    expect(composerSource).toContain("voiceBusy={isVoiceRecording || isVoiceTranscribing}");
    expect(composerSource).toContain(
      "setVoiceWaveformLevels((current) => [...current, state.level ?? 0].slice(-160",
    );
    expect(composerSource).toContain("}, 50);");
    expect(composerSource).toContain("setIsVoiceTranscribing(true);\n    setVoiceDurationMs(0);");
    expect(composerSource).toContain(
      "if (isVoiceRecording) {\n                      void submitVoiceRecording();",
    );
    expect(css).toMatch(
      /\.ComposerFooterActionsLynx--voice-busy\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;/s,
    );
    expect(composerSource).toContain("hideLabel={compactFooter}");
    expect(composerSource).toContain("compact={compactFooter}");
    expect(modelSource).toContain("readonly compact?: boolean");
    expect(modelSource).toContain("hideModelLabel={props.compact ?? false}");
    expect(compositionSource).toContain("ComposerFooterActionsLynx--compact");
    expect(css).toMatch(
      /\.ComposerFooterLeadingLynx--compact\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*overflow:\s*hidden;/s,
    );
    expect(css).toMatch(
      /\.ComposerFooterRowLynx--compact \.ComposerFooterActionsLynx\s*\{[^}]*gap:\s*2px;/s,
    );
  });

  it("uses the shared Electron composer placeholder copy", () => {
    expect(composerSource).toContain("DEFAULT_CHAT_COMPOSER_PLACEHOLDER");
    expect(composerSource).toContain('from "@synara/shared/composerPlaceholder"');
    expect(composerSource).toContain(": DEFAULT_CHAT_COMPOSER_PLACEHOLDER");
    expect(composerSource).not.toContain("Ask anything, @mention a path, or use $skill");
  });

  it("applies the configured chat font size only to the editor content", () => {
    expect(composerSource).toContain("chatFontSizePx = DEFAULT_CHAT_FONT_SIZE_PX");
    expect(composerSource).toContain(
      "const normalizedChatFontSizePx = normalizeChatFontSizePx(chatFontSizePx)",
    );
    expect(composerSource).toContain(
      '"--type-composer-editor-size": `${normalizedChatFontSizePx}px`',
    );
    expect(composerSource).toContain("style={{ fontSize: `${normalizedChatFontSizePx}px` }}");
    expect(composerSource).toContain("fontSizePx={normalizedChatFontSizePx}");
    expect(composerSource).toContain(
      '"--composer-empty-editor-height": `${emptyEditorMinHeightPx}px`',
    );
    expect(composerSource).toContain("resolveNativeComposerMaxLines({");
    expect(composerSource).toContain("maxlines={nativeEditorMaxLines}");
    expect(composerSource).not.toContain("maxlines={6}");
    expect(css).toMatch(
      /\.ComposerTextarea--empty\s*\{[^}]*height:\s*var\(--composer-empty-editor-height\);/s,
    );
    expect(routerSource).toContain("chatFontSizePx={appearance.chatFontSizePx}");
  });
});
