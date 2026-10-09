import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Pull Request repository batch projection", () => {
  it("preserves repository batch metadata consumed by the route", () => {
    const queries = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const route = readFileSync(new URL("./FeatureListsPage.tsx", import.meta.url), "utf8");

    expect(queries).toContain("readonly repositoryBatches: readonly PullRequestRepositoryBatch[]");
    expect(queries).toContain("readonly errors: readonly PullRequestListError[]");
    expect(queries).toContain("errors: result.errors");
    expect(queries).toContain("repositoryBatches: result.repositoryBatches");
    expect(route).toContain(
      "data?.repositoryBatches.filter((batch) => batch.truncated).length ?? 0",
    );
  });
});
