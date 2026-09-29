import { describe, expect, it } from "vitest";
import {
  SEMANTIC_ICON_TONES,
  resolveSemanticIconTone,
  semanticIconToneColor,
} from "./semanticIconTone";

describe("semantic icon tone contract", () => {
  it("maps every role to one renderer-independent CSS token", () => {
    expect(SEMANTIC_ICON_TONES).toEqual([
      "primary",
      "secondary",
      "tertiary",
      "accent",
      "inverse",
      "disabled",
    ]);
    expect(semanticIconToneColor("secondary")).toBe("var(--color-icon-secondary)");
    expect(semanticIconToneColor("inverse")).toBe("var(--color-text-button-primary)");
    expect(semanticIconToneColor("disabled")).toBe("var(--color-token-disabled-foreground)");
  });

  it("resolves raw renderer SVG colors from the same semantic roles", () => {
    const palette = {
      primary: "primary",
      secondary: "secondary",
      tertiary: "tertiary",
      accent: "accent",
      inverse: "inverse",
      disabled: "disabled",
    };
    expect(resolveSemanticIconTone("secondary", palette)).toBe("secondary");
    expect(resolveSemanticIconTone("accent", palette)).toBe("accent");
  });
});
