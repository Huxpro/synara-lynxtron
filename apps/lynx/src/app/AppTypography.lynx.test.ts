import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  appTypographyCssVariables,
  buildAppTypographyClassesCss,
} from "@synara-web/lib/appTypography";
import { MAX_CHAT_FONT_SIZE_PX, MIN_CHAT_FONT_SIZE_PX } from "@synara-web/chatFontSize";

import {
  resolveSliceTypographyVariables,
  SLICE_TYPOGRAPHY_CLASS_PREFIX,
  sliceTypographyClassName,
} from "./appTypography.logic";

describe("Lynx root typography", () => {
  it("selects the generated class for the chosen base size", () => {
    expect(sliceTypographyClassName(12)).toBe("SliceRoot--font-12");
    expect(sliceTypographyClassName(99)).toBe("SliceRoot--font-18");
    expect(sliceTypographyClassName(undefined)).toBe("SliceRoot--font-13");
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

  it("puts upstream's scale for the chosen size in the root inline map", () => {
    for (let size = MIN_CHAT_FONT_SIZE_PX; size <= MAX_CHAT_FONT_SIZE_PX; size += 1) {
      const variables = resolveSliceTypographyVariables(size, 12);
      expect(variables).toMatchObject(appTypographyCssVariables(size, 12));
      // Lynx does not resolve a custom property whose value is another var().
      expect(Object.values(variables).filter((value) => value.includes("var("))).toEqual([]);
    }
    expect(resolveSliceTypographyVariables(16, 12)).toMatchObject({
      "--app-font-size-ui": "16px",
      "--app-font-size-ui-lg": "17px",
      "--app-font-size-ui-sm": "15px",
      "--app-font-size-ui-xs": "13px",
      "--app-font-size-terminal": "12px",
      "--type-settings-row-title-size": "16px",
      "--type-settings-row-title-line-height": "24px",
      "--type-settings-header-description-line-height": "26px",
      "--type-ui-row-size": "15px",
    });
    expect(resolveSliceTypographyVariables(undefined, 12)).toEqual(
      resolveSliceTypographyVariables(13, 12),
    );
    expect(resolveSliceTypographyVariables(99, 12)["--app-font-size-ui"]).toBe("18px");
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    expect(app).toContain("resolveSliceTypographyVariables(appearance.chatFontSizePx");
    expect(app).toContain("style={rootVariables}");
  });

  it("resolves every --type-* role to the value its stylesheet fallback has at the default size", () => {
    const app = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    const roles = Object.entries(resolveSliceTypographyVariables(13, 12)).filter(([name]) =>
      name.startsWith("--type-"),
    );
    expect(roles.length).toBeGreaterThan(0);
    for (const [name, value] of roles) {
      expect(app, name).toContain(`  ${name}: ${value};`);
    }
    // Every `--type-*` role App.css restates is one the inline map resolves.
    const restated = [...app.matchAll(/^ {2}(--type-[\w-]+):/gm)].map((match) => match[1]);
    expect(restated.toSorted()).toEqual(roles.map(([name]) => name).toSorted());
  });
});
