import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("shared control state design tokens", () => {
  it("routes disabled control paint through one cross-renderer token", () => {
    const tokens = source("../tokens.css");
    // The fork's token in the controls Lynx mirrors. checkbox, input, input-group and
    // textarea follow upstream's literal `opacity-64`, which is the same 0.64.
    const webSources = [
      "./ui/autocomplete.tsx",
      "./ui/badge.tsx",
      "./ui/button.tsx",
      "./ui/combobox.tsx",
      "./ui/select.tsx",
      "./ui/switch.tsx",
      "./ui/toggle.tsx",
      "./chat/composerPickerStyles.ts",
    ].map(source);
    const native = source("../../../lynx/src/components/ui/primitives.css");

    expect(tokens).toContain("--control-disabled-opacity: 0.64;");
    for (const contents of webSources) {
      expect(contents).not.toContain("opacity-64");
    }
    expect(webSources.join("\n")).toContain("opacity-[var(--control-disabled-opacity)]");
    expect(native.match(/opacity:\s*var\(--control-disabled-opacity\);/g)).toHaveLength(6);
  });

  it("shares explicit focus roles while retaining the prominent-button exception", () => {
    const tokens = source("../tokens.css");
    const native = source("../../../lynx/src/components/ui/primitives.css");

    expect(tokens).toContain("--control-focus-ring-color:");
    expect(tokens).toContain("--control-input-focus-border:");
    expect(native).toContain("var(--control-focus-ring-color)");
    expect(native).toContain("var(--control-input-focus-border)");
    expect(native).toMatch(/\.LxButton--prominent\.ui-disabled\s*\{[^}]*opacity:\s*0\.2;/s);
  });
});
