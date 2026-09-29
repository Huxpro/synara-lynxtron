import { describe, expect, it } from "@rstest/core";

import { parseSettingsRouteLocation, settingsRouteLocation } from "./settingsRoute.logic";

describe("Settings route identity", () => {
  it("round-trips section and encoded search target", () => {
    const location = settingsRouteLocation("appearance", "setting-terminal-font");

    expect(location).toBe("/settings/appearance?target=setting-terminal-font");
    expect(parseSettingsRouteLocation(location)).toEqual({
      section: "appearance",
      target: "setting-terminal-font",
    });
  });

  it("keeps section-only and root Settings routes stable", () => {
    expect(settingsRouteLocation("general")).toBe("/settings/general");
    expect(parseSettingsRouteLocation("/settings/general")).toEqual({
      section: "general",
      target: null,
    });
    expect(parseSettingsRouteLocation("/settings")).toEqual({
      section: null,
      target: null,
    });
  });

  it("rejects unrelated routes and empty targets", () => {
    expect(parseSettingsRouteLocation("/thread/example")).toBeNull();
    expect(parseSettingsRouteLocation("/settings/appearance?target=%20")).toEqual({
      section: "appearance",
      target: null,
    });
  });
});
