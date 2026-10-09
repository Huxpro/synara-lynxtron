import { describe, expect, it } from "vitest";

import { resolveThemePackEditorModel } from "./ThemePackEditorComposition.logic";
import { DEFAULT_THEME_STATE, resolveThemePack } from "../../theme/theme.logic";

describe("resolveThemePackEditorModel", () => {
  it("projects active system context and variant-compatible themes", () => {
    const pack = resolveThemePack(DEFAULT_THEME_STATE, "dark");
    const model = resolveThemePackEditorModel({
      variant: "dark",
      isActive: true,
      mode: "system",
      pack,
    });

    expect(model.titleLabel).toBe("Dark theme");
    expect(model.contextLabel).toBe("System is currently using this dark slot.");
    expect(model.codeThemeLabel).toBe("Synara");
    expect(model.codeThemes.every((option) => option.id !== "proof")).toBe(true);
  });

  it("describes inactive locked slots without changing option order", () => {
    const pack = resolveThemePack(DEFAULT_THEME_STATE, "light");
    const model = resolveThemePackEditorModel({
      variant: "light",
      isActive: false,
      mode: "dark",
      pack,
    });

    expect(model.contextLabel).toBe("Inactive while the app is locked to dark.");
    expect(model.codeThemes[0]?.id).toBe("absolutely");
    expect(model.codeThemes.some((option) => option.id === "proof")).toBe(true);
  });
});
