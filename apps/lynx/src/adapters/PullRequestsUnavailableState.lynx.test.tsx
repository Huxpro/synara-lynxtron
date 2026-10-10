import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { PullRequestsUnavailableState } from "./PullRequestsUnavailableState.lynx";

describe("Pull Requests unavailable state fidelity", () => {
  it("renders reason-aware diagnostics and an actionable retry", () => {
    let retries = 0;
    render(
      <PullRequestsUnavailableState
        error={{
          _tag: "PullRequestsUnavailableError",
          reason: "gh-not-authenticated",
          message: "Run gh auth login before retrying.",
        }}
        retrying={false}
        onRetry={() => {
          retries += 1;
        }}
      />,
    );

    const copy = elementTree.root?.querySelector(".SharedPrUnavailableCopy");
    expect(copy?.getAttribute("accessibility-label")).toBe(
      "Sign in to GitHub CLI. Run gh auth login before retrying.",
    );
    expect(elementTree.root?.querySelector(".SharedPrUnavailableTitle")?.textContent).toBe(
      "Sign in to GitHub CLI",
    );
    expect(elementTree.root?.querySelector(".SharedPrUnavailableDescription")?.textContent).toBe(
      "Run gh auth login before retrying.",
    );

    fireEvent.tap(elementTree.root?.querySelector(".LxButton")!);
    expect(retries).toBe(1);
  });

  it("wires the route error branch to refetch instead of a dead empty state", () => {
    const routeSource = readFileSync(
      new URL("../app/GitHubInboxPage.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./pull-requests-unavailable-state.css", import.meta.url),
      "utf8",
    );

    expect(routeSource).toContain("<PullRequestsUnavailableState");
    expect(routeSource).toContain("retrying={listQuery.isFetching}");
    expect(routeSource).toContain("onRetry={() => void listQuery.refetch()}");
    expect(styles).toMatch(
      /\.SharedPrUnavailable\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*180px;[^}]*gap:\s*12px;[^}]*padding:\s*64px 24px;/s,
    );
    expect(styles).toMatch(/\.SharedPrUnavailableCopy\s*\{[^}]*max-width:\s*384px;/s);
  });
});
