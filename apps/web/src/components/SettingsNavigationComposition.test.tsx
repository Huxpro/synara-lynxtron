import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { SettingsNavigationComposition } from "./SettingsNavigationComposition";
import { resolveSettingsNavigationCompositionGroups } from "./SettingsNavigationComposition.logic";

describe("SettingsNavigationComposition", () => {
  it("keeps the canonical group and item order while projecting availability", () => {
    const groups = resolveSettingsNavigationCompositionGroups({
      activeSection: "appearance",
      availableSections: ["general", "appearance"],
    });

    expect(groups.map((group) => group.label)).toEqual(["App", "Synara"]);
    expect(groups[0]?.items.slice(0, 3).map((item) => item.id)).toEqual([
      "general",
      "profile",
      "appearance",
    ]);
    expect(groups[0]?.items.find((item) => item.id === "appearance")).toMatchObject({
      active: true,
      available: true,
    });
    expect(groups[0]?.items.find((item) => item.id === "profile")).toMatchObject({
      active: false,
      available: false,
    });
  });

  it("renders disabled unavailable rows from the same physical composition", () => {
    const markup = renderToStaticMarkup(
      <SettingsNavigationComposition
        activeSection="general"
        availableSections={["general", "appearance"]}
        onSelectSection={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Settings sections"');
    expect(markup).toContain('aria-label="General"');
    expect(markup).toContain('aria-label="Appearance"');
    expect(markup).toContain("General");
    expect(markup).toContain("Appearance");
    expect(markup).toContain("Providers");
    expect(markup).toContain("disabled");
  });
});
