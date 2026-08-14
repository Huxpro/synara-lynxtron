import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PluginLibrary discovery states", () => {
  it("renders provider failures before placeholder empty states", () => {
    const source = readFileSync(new URL("./PluginLibrary.tsx", import.meta.url), "utf8");
    const errorBranch = source.indexOf('pluginStatus.kind === "error"');
    const emptyBranch = source.indexOf('pluginStatus.kind === "empty"');

    expect(source).toContain("resolveProviderDiscoveryStatus");
    expect(errorBranch).toBeGreaterThan(-1);
    expect(emptyBranch).toBeGreaterThan(errorBranch);
    expect(source).toContain("Verify the provider installation, then reload to try again.");
  });
});
