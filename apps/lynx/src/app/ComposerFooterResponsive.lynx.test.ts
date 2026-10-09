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
  const voiceHookSource = readFileSync(
    new URL("../components/composer/useNativeComposerVoice.lynx.ts", import.meta.url),
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
      "<ComposerFooterContentComposition\n            compact={compactFooter}",
    );
    expect(composerSource).toContain("voiceBusy={isVoiceRecording || isVoiceTranscribing}");
    // The recording lifecycle lives in the composer's voice hook.
    expect(voiceHookSource).toContain(
      "[...current, scaleNativeVoiceWaveformLevel(state.level ?? 0)].slice(-160)",
    );
    expect(voiceHookSource).toContain("}, 50);");
    expect(voiceHookSource).toContain("setIsTranscribing(true);\n    setDurationMs(0);");
    expect(composerSource).toContain(
      "if (isVoiceRecording) {\n                        void submitVoiceRecording();",
    );
    expect(css).toMatch(
      /\.ComposerFooterActionsLynx--voice-busy\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;/s,
    );
    // Labels follow upstream's measured footer tiers (context meter, effort, model name)
    // and its 480px container rule for the access-mode label, not the compact breakpoint.
    expect(composerSource).toContain("resolveNextComposerFooterTier({");
    expect(composerSource).toContain(
      "const footerPlan = composerFooterPlanForTier(footerTier.tier, true);",
    );
    expect(composerSource).toContain("hideModelLabel={!footerPlan.showModelLabel}");
    expect(composerSource).toContain("hideStatusLabel={!footerPlan.showTraitsLabel}");
    expect(composerSource).toContain(
      "footerRowWidth <= COMPOSER_RUNTIME_LABEL_MIN_FOOTER_WIDTH_PX",
    );
    expect(compositionSource).toContain('useFooterWidthReport("actions")');
    expect(composerSource).toContain("compact={compactFooter}");
    expect(modelSource).toContain("readonly compact?: boolean");
    expect(modelSource).toContain("hideModelLabel={props.compact ?? false}");
    expect(compositionSource).toContain("ComposerFooterActionsLynx--compact");
    expect(css).toMatch(
      /\.ComposerFooterLeadingLynx--compact\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*overflow:\s*hidden;/s,
    );
    // Upstream's actions keep `gap-2` (the base 8px) at every width and never shrink.
    expect(css).toMatch(
      /\.ComposerFooterRowLynx--compact \.ComposerFooterActionsLynx\s*\{[^}]*flex-shrink:\s*0;/s,
    );
    expect(css).not.toMatch(
      /\.ComposerFooterRowLynx--compact \.ComposerFooterActionsLynx\s*\{[^}]*gap:/s,
    );
  });

  it("uses the shared Electron composer placeholder copy", () => {
    expect(composerSource).toContain('from "@synara/shared/composerPlaceholder"');
    expect(composerSource).toContain("resolveChatComposerPlaceholder({");
    expect(composerSource).toContain("phase: resolveSessionPhase(sessionStatus)");
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
