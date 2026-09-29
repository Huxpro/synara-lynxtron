import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsSidebarChromeComposition } from "./SettingsSidebarChromeComposition";

describe("SettingsSidebarChromeComposition", () => {
  it("owns Back then the available Settings search surface", () => {
    const markup = renderToStaticMarkup(
      <SettingsSidebarChromeComposition
        onBack={vi.fn()}
        searchCapability="available"
        searchValue=""
      />,
    );

    expect(markup.indexOf("Back to app")).toBeLessThan(
      markup.indexOf('aria-label="Search settings"'),
    );
    expect(markup).toContain('placeholder="Search settings..."');
    expect(markup).not.toContain("Search unavailable in this runtime");
  });

  it("replaces the input with explicit unavailable capability copy", () => {
    const markup = renderToStaticMarkup(
      <SettingsSidebarChromeComposition onBack={vi.fn()} searchCapability="unavailable" />,
    );

    expect(markup).toContain("Back to app");
    expect(markup).toContain("Search unavailable in this runtime");
    expect(markup).not.toContain('aria-label="Search settings"');
    expect(markup).not.toContain("<input");
  });
});
