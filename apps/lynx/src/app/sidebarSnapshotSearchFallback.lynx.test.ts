import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("sidebar snapshot search fallback", () => {
  it("does not block project and thread navigation on the optional message index", () => {
    const source = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const shell = source.indexOf("const snapshot = await fetchSynaraSidebarShellSnapshot()");
    const fallback = source.indexOf("const searchSnapshot = sidebarSearchSnapshotCache ??", shell);
    const refresh = source.indexOf(
      "refreshSidebarSearchSnapshotInBackground(\n    fetchSynaraSidebarSearchSnapshot",
      fallback,
    );

    expect(shell).toBeGreaterThan(-1);
    expect(fallback).toBeGreaterThan(shell);
    expect(refresh).toBeGreaterThan(fallback);
    expect(source).toContain("threads: []");
    expect(source).toContain(
      "refreshSidebarSearchSnapshotInBackground(\n    fetchSynaraSidebarSearchSnapshot\n  )",
    );
    expect(source).toContain("fetchSnapshot: () => Promise<OrchestrationSidebarSearchSnapshot>");
    expect(source).toContain("sidebarSearchSnapshotRequest = fetchSnapshot()");
    expect(source).not.toContain("const searchSnapshot = await fetchSynaraSidebarSearchSnapshot()");
  });
});
