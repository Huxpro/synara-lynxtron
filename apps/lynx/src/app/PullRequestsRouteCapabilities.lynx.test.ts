import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Pull Requests detail capabilities", () => {
  it("wires Summary, Timeline, and Code to real detail and diff data", () => {
    const source = readFileSync(new URL("./FeatureListsPage.tsx", import.meta.url), "utf8");

    expect(source).toContain("availableTabs={['summary', 'timeline', 'code']}");
    expect(source).toContain("enabled: selectedInput !== null && activeDetailTab === 'code'");
    expect(source).toContain("return fetchPullRequestDiff(selectedInput)");
    expect(source).toContain("buildPullRequestCodeView(");
    expect(source).toContain('<PullRequestCodeStateComposition kind="loading"');
    expect(source).toContain("selectedDiffError ? (");
    expect(source).toContain("onRetry={() => void refetchSelectedDiff()}");
    expect(source).toContain("<PullRequestCodeComposition");
    expect(source).toContain("truncated={selectedDiff?.truncated ?? false}");
    expect(source).toContain("onToggleFile={(fileKey)");
    expect(source).toContain("onShowMoreFile={(fileKey)");
    expect(source).toContain("onShowMoreRaw={() =>");
    expect(source).toContain("<PullRequestTimelineComposition detail={selectedDetail} />");
    expect(source).toContain("<PullRequestSummaryComposition");
    expect(source).toContain("commentingAvailable");
  });

  it("keeps the typed RPC path in the background query owner", () => {
    const queries = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const client = readFileSync(new URL("../data/synaraClient.lynx.ts", import.meta.url), "utf8");

    expect(queries).toContain("export async function fetchPullRequestDiff");
    expect(queries).toContain("fetchSynaraPullRequestDiff");
    expect(queries).toContain("export async function postPullRequestComment");
    expect(queries).toContain("postSynaraPullRequestComment");
    expect(client).toContain("transportRequest<PullRequestDiffResult>('pullRequests.diff', input)");
    expect(client).toContain(
      "transportRequest<PullRequestActionResult>('pullRequests.comment', input)",
    );
  });
});
