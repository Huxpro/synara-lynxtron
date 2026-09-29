import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Thread sidebar bootstrap", () => {
  it("owns one shared sidebar query in the product route", () => {
    const source = readFileSync(new URL("./FeatureListsPage.tsx", import.meta.url), "utf8");

    expect(source).toContain('queryKey: ["sidebar-snapshot"]');
    expect(source).toContain("queryFn: fetchSidebarSnapshot");
  });
});
