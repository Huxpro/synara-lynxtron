import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { render } from "@lynx-js/react/testing-library";

import {
  ComposerTraitFastModeToggleElement,
  ComposerTraitSectionElement,
} from "./ComposerTraitRadioSectionCompositionElements.lynx";

describe("native composer trait picker contract", () => {
  it("matches the shared Web group-label typography and spacing", () => {
    const composerStyles = readFileSync(
      new URL("../components/composer/composer.css", import.meta.url),
      "utf8",
    );

    render(
      <ComposerTraitSectionElement label="Effort">
        <text>Medium</text>
      </ComposerTraitSectionElement>,
    );

    expect(elementTree.root?.querySelector(".ComposerTraitSectionLabelLynx")?.textContent).toBe(
      "Effort",
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitSectionHeaderLynx\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*6px 8px;/s,
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitSectionLynx\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*\}/s,
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitSectionLabelLynx\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm, 12px\);[^}]*line-height:\s*16px;[^}]*font-weight:\s*400;[^}]*opacity:\s*0\.45;/s,
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitOptionLabelLynx\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm, 12px\);[^}]*line-height:\s*18px;/s,
    );
    const source = readFileSync(
      new URL("./ComposerTraitRadioSectionCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("<CheckIcon size={12} />");
    expect(source).not.toContain("{props.active ? '✓' : ''}");
    expect(source.indexOf("ComposerTraitOptionCopyLynx")).toBeLessThan(
      source.indexOf("ComposerTraitOptionCheckLynx"),
    );
    expect(composerStyles).toMatch(/\.ComposerTraitOptionCheckLynx\s*\{[^}]*margin-left:\s*auto;/s);
  });

  it("matches the shared Web geometry and accessibility identity", () => {
    const composerStyles = readFileSync(
      new URL("../components/composer/composer.css", import.meta.url),
      "utf8",
    );

    render(<ComposerTraitFastModeToggleElement enabled={false} onToggle={() => {}} />);

    const toggle = elementTree.root?.querySelector(".ComposerTraitFastModeToggleLynx");
    if (!toggle) throw new Error("expected Fast mode toggle");

    expect(toggle.getAttribute("aria-label")).toBe("Fast mode");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(
      elementTree.root
        ?.querySelector(".ComposerTraitFastModeToggleIconLynx")
        ?.getAttribute("content"),
    ).toContain("stroke=");
    expect(composerStyles).toMatch(
      /\.ComposerTraitFastModeToggleLynx\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*margin-top:\s*-4px;[^}]*margin-bottom:\s*-4px;[^}]*border-radius:\s*8px;/s,
    );
    expect(composerStyles).toMatch(
      /\.ComposerTraitFastModeToggleIconLynx\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s,
    );
    expect(composerStyles).not.toContain(".ComposerTraitFastModeToggleLynx--active");
    expect(composerStyles).toMatch(
      /\.ComposerTraitFastModeToggleLynx\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s,
    );
    expect(composerStyles).not.toContain(".ComposerTraitOptionLynx--active");
    expect(composerStyles).toMatch(
      /\.ComposerTraitOptionLynx\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s,
    );
    expect(composerStyles).not.toMatch(
      /\.ComposerTrait(?:FastModeToggle|Option)Lynx\.ui-pressed\s*\{[^}]*opacity:/s,
    );
  });
});
