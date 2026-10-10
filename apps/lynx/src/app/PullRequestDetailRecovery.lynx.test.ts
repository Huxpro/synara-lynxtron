import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./PullRequestDetailPane.lynx.tsx", import.meta.url), "utf8");

describe("Pull Request detail recovery fidelity", () => {
  it("reuses the recoverable unavailable surface for a cold-load failure", () => {
    expect(source).toContain("pullRequestQueryErrorState(detailQuery)");
    expect(source).toMatch(
      /detailInitialError \? \(\s*<PullRequestsUnavailableState\s+error=\{detailInitialError\}\s+retrying=\{detailQuery\.isFetching\}\s+onRetry=\{\(\) => void detailQuery\.refetch\(\)\}/s,
    );
    expect(source).toContain("Could not refresh pull request details. Showing saved data.");
    expect(source).not.toContain("The detail could not be loaded. Close the panel and try again.");
  });

  it("keeps the existing detail skeleton and code-specific recovery paths", () => {
    expect(source).toContain("rowCount={4}");
    expect(source).toContain('label="Loading pull request details…"');
    expect(source).toContain('className="SharedPrDetailLoading"');
    expect(source).toContain("retrying={diffQuery.isFetching}");
    expect(source).toContain("onRetry={() => void diffQuery.refetch()}");
  });

  it("keeps detail skeletons inside the Web 20px panel inset", () => {
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.SharedPrDetailLoading\s*\{[^}]*width:\s*100%;[^}]*padding:\s*20px;/s);
  });
});
