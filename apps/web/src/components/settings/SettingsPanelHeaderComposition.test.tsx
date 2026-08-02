import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  SettingsPanelHeaderComposition,
} from "./SettingsPanelHeaderComposition";
import { resolveSettingsPanelHeader } from "./SettingsPanelHeaderComposition.logic";

describe("SettingsPanelHeaderComposition", () => {
  it("uses the canonical settings taxonomy copy", () => {
    expect(resolveSettingsPanelHeader("general")).toEqual({
      title: "General",
      description: "Default provider, thread mode, and sidebar organization.",
    });
    expect(resolveSettingsPanelHeader("appearance").title).toBe("Appearance");
  });

  it("owns title, description, and restore availability", () => {
    const markup = renderToStaticMarkup(
      <SettingsPanelHeaderComposition
        section="appearance"
        restoreDisabled
        onRestore={vi.fn()}
      />,
    );
    expect(markup).toContain("Theme, typography, and timestamp formatting.");
    expect(markup).toContain("Restore defaults");
    expect(markup).toContain("disabled");
  });
});
