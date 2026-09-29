import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { buildAppTypographyClassesCss } from "@synara-web/lib/appTypography";

import { SLICE_TYPOGRAPHY_CLASS_PREFIX, sliceTypographyClassName } from "./appTypography.logic";

describe("Lynx root typography", () => {
  it("selects the generated class for the chosen base size", () => {
    expect(sliceTypographyClassName(12)).toBe("SliceRoot--font-12");
    expect(sliceTypographyClassName(99)).toBe("SliceRoot--font-18");
    expect(sliceTypographyClassName(undefined)).toBe("SliceRoot--font-12");
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    expect(app).toContain("sliceTypographyClassName(appearance.chatFontSizePx)");
  });

  it("keeps the generated variables in step with the shared web scale", () => {
    // Stale? Run `bun scripts/generate-typography-tokens.ts` in apps/lynx.
    const generated = readFileSync(
      new URL("../generated/native-typography-variables.css", import.meta.url),
      "utf8",
    );
    expect(generated).toContain(buildAppTypographyClassesCss(`.${SLICE_TYPOGRAPHY_CLASS_PREFIX}`));
    const app = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    expect(app).toContain("native-typography-variables.css");
  });
});
