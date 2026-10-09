import { describe, expect, it } from "vitest";

import type { WhatsNewEntry } from "../whatsNew/logic";
import { helpMenuReleaseTitle, resolveHelpMenuReleaseEntries } from "./SidebarHelpMenu.logic";

function entry(version: string, titles: readonly string[]): WhatsNewEntry {
  return {
    version,
    date: "Sep 1",
    features: titles.map((title, index) => ({
      id: `${version}-${index}`,
      title,
      description: title,
    })),
  } as WhatsNewEntry;
}

describe("sidebar Help menu", () => {
  it("lists the three newest releases, newest first", () => {
    const entries = [
      entry("0.9.1", ["a"]),
      entry("0.10.0", ["b"]),
      entry("0.9.3", ["c"]),
      entry("0.8.0", ["d"]),
    ];
    expect(resolveHelpMenuReleaseEntries(entries).map((release) => release.version)).toEqual([
      "0.10.0",
      "0.9.3",
      "0.9.1",
    ]);
  });

  it("labels a release by its headline feature, or its version", () => {
    expect(helpMenuReleaseTitle(entry("1.0.0", ["Meet Synara Beta", "More"]))).toBe(
      "Meet Synara Beta",
    );
    expect(helpMenuReleaseTitle(entry("1.0.1", []))).toBe("Version 1.0.1");
  });
});
