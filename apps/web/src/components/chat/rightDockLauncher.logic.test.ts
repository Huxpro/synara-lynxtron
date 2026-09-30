import { describe, expect, it } from "vitest";

import { resolveRightDockLauncherEntries } from "./rightDockLauncher.logic";

describe("right dock launcher", () => {
  const everything = {
    hasWorkspace: true,
    hasGitRepository: true,
    hasReview: true,
    hasDeviceSupport: true,
  };

  it("lists every tool in Electron's order with the launcher labels", () => {
    expect(resolveRightDockLauncherEntries(everything).map((entry) => entry.label)).toEqual([
      "Review",
      "Terminal",
      "Browser",
      "Files",
      "Side chats",
      "iOS Simulator",
      "Source control",
    ]);
  });

  it("hides tools this workspace or renderer cannot open", () => {
    expect(
      resolveRightDockLauncherEntries({
        ...everything,
        hasReview: false,
        hasDeviceSupport: false,
        supportedKinds: new Set(["diff", "terminal", "explorer", "git"]),
      }).map((entry) => entry.kind),
    ).toEqual(["terminal", "explorer", "git"]);
  });
});
