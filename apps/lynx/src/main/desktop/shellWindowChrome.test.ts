import { describe, expect, it } from "@rstest/core";
import { getMacTrafficLightPosition } from "@synara/shared/desktopChrome";

import { resolveShellWindowChrome } from "./shellWindowChrome";

describe("shell window chrome", () => {
  it("embeds the macOS traffic lights in the shared top chrome", () => {
    expect(resolveShellWindowChrome("darwin")).toEqual({
      titleBarStyle: "hiddenInset",
      trafficLightPosition: getMacTrafficLightPosition(),
    });
  });

  it("uses renderer-owned window chrome on Windows", () => {
    expect(resolveShellWindowChrome("win32")).toEqual({ frame: false });
  });

  it("uses a windowless LynxWindow on Linux, the only mode Lynxtron supports there", () => {
    expect(resolveShellWindowChrome("linux")).toEqual({
      windowless: true,
      deviceScaleFactor: 1,
    });
  });

  it("keeps the native frame on other platforms", () => {
    expect(resolveShellWindowChrome("freebsd")).toEqual({});
  });
});
