import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx composer focus chrome", () => {
  it("lets a click on the editor flow restore the native textarea focus", () => {
    const source = readFileSync(new URL("./Composer.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./composer.css", import.meta.url), "utf8");

    expect(source).toMatch(
      /className={`ComposerProjectedEditorFlow[\s\S]*?bindtap={restoreNativeFocus}/,
    );
    expect(source).toContain("bridgeCall('shellReleaseTerminalInputFocus')");
    expect(source).toContain(".then(focusComposer, focusComposer)");
    expect(source).toContain("success: restoreSelection");
    expect(source).toContain("nativeFocusRequestPendingRef.current = true");
    expect(source).toContain("nativeFocusRequestPendingRef.current = false");
    expect(source).toContain("bindtap={restoreNativeFocus}");
    expect(source).toContain("claimComposerInputOwnership();");
    expect(source).toContain("claimComposerInputFocus();");
    expect(source).toContain("capture-bindtap={restoreNativeFocus}");
    expect(source).toContain("subscribeTerminalInputFocusOwner((owner) => {");
    expect(source).toContain("setFocused(false);");
    expect(source).toContain("setNativeEditorFocusEpoch((current) => current + 1);");
    expect(source).toContain("key={nativeEditorFocusEpoch}");
    expect(source).toContain("bridgeCall('shellSetComposerInputBounds'");
    expect(source).toContain("ref={editorRegionRef}");
    expect(source).not.toContain("ComposerNativeFocusCatcher");
  });

  it("selects the live Native value without resetting the textarea value", () => {
    const source = readFileSync(new URL("./Composer.lynx.tsx", import.meta.url), "utf8");
    const selectAllStart = source.indexOf("async function selectAllNativeEditorText()");
    const selectAllEnd = source.indexOf("async function copyOrCutNativeEditorText", selectAllStart);
    const selectAllSource = source.slice(selectAllStart, selectAllEnd);

    expect(selectAllSource).toContain("await readNativeEditorSnapshot()");
    expect(selectAllSource).toContain("method: 'select'");
    expect(selectAllSource).not.toContain("method: 'setSelectionRange'");
    expect(selectAllSource).not.toContain("setNativeValue(");
    expect(source).toContain("void selectAllNativeEditorText();");
  });

  it("keeps the themed surface border unchanged while the editor is focused", () => {
    const styles = readFileSync(new URL("./composer.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.ComposerInputSurfaceLynx\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.ComposerInputSurfaceLynx--focused\s*\{[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
  });

  it("declares the command menu border color on every physical side", () => {
    const styles = readFileSync(new URL("./composer.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.ComposerCommandMenuLynx\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
  });

  it("suppresses the native textarea focus decoration in every theme", () => {
    const styles = readFileSync(new URL("./composer.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.ComposerTextarea\s*\{[^}]*border:\s*0 solid transparent;[^}]*outline:\s*none;[^}]*box-shadow:\s*none;/s,
    );
  });

  it("preserves the distinct light and dark border tokens", () => {
    const themeStyles = readFileSync(
      new URL("../../generated/native-theme-variables.css", import.meta.url),
      "utf8",
    );

    expect(themeStyles).toMatch(
      /\.SliceRoot--theme-light\s*\{[^}]*--border:\s*rgba\(13,\s*13,\s*13,\s*0\.069\);/s,
    );
    expect(themeStyles).toMatch(
      /\.SliceRoot--theme-dark\s*\{[^}]*--border:\s*rgba\(252,\s*252,\s*252,\s*0\.072\);/s,
    );
  });
});
