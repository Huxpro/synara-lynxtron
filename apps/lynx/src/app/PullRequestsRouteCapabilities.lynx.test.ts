import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Lynx Pull Requests detail capabilities", () => {
  it("wires Summary, Timeline, and Code to real detail and diff data", () => {
    const source = read("./PullRequestDetailPane.lynx.tsx");

    expect(source).toContain('["summary", "timeline", "code"]');
    expect(source).toContain("useQuery(pullRequestDetailQueryOptions(input))");
    expect(source).toMatch(
      /useQuery\(\{\s*\.\.\.pullRequestDiffQueryOptions\(input\),\s*enabled: activeDetailTab === "code",\s*\}\)/s,
    );
    expect(source).toContain("buildPullRequestCodeView(");
    expect(source).toContain('<PullRequestCodeStateComposition kind="loading"');
    expect(source).toContain("diffQuery.isError ? (");
    expect(source).toContain("<PullRequestCodeComposition");
    expect(source).toContain("truncated={diffQuery.data?.truncated ?? false}");
    expect(source).toContain("onToggleFile={(fileKey)");
    expect(source).toContain("onShowMoreFile={(fileKey)");
    expect(source).toContain("onShowMoreRaw={() =>");
    expect(source).toContain("<PullRequestTimelineComposition detail={selectedDetail} />");
    expect(source).toContain("<PullRequestSummaryComposition");
    expect(source).toContain("commentingAvailable");
  });

  it("reads and writes through upstream's query and mutation options", () => {
    const pane = read("./PullRequestDetailPane.lynx.tsx");
    const page = read("./GitHubInboxPage.lynx.tsx");
    const issue = read("./GitHubIssueDetailPane.lynx.tsx");
    const composer = read("../adapters/PullRequestCommentComposer.lynx.tsx");

    expect(pane).toContain("useMutation(pullRequestActionMutationOptions(queryClient))");
    expect(page).toContain(
      "useQuery(githubInboxListQueryOptions(listState, settings.githubInboxSort))",
    );
    expect(page).toContain("useMutation(pullRequestSetPinnedMutationOptions(queryClient))");
    expect(page).toContain("useMutation(pullRequestsForceRefreshMutationOptions(queryClient))");
    expect(issue).toContain("useQuery(githubIssueDetailQueryOptions(props.input))");
    expect(issue).toContain("useMutation(githubIssueCommentMutationOptions(queryClient))");
    expect(composer).toContain("pullRequestCommentMutationOptions(queryClient)");
    // No Lynx-owned keys or fetch helpers: every cache entry is upstream's.
    for (const source of [pane, page, issue, composer]) {
      expect(source).not.toContain("queryKey:");
      expect(source).not.toContain("queryFn:");
      expect(source).not.toContain("ensureNativeApi");
      expect(source).not.toContain("synaraClient");
    }
  });

  it("resets the detail per item and clears failed-action recovery on a new run", () => {
    const page = read("./GitHubInboxPage.lynx.tsx");
    const pane = read("./PullRequestDetailPane.lynx.tsx");

    // The pane is keyed by identity, so tab, diff paging and recovery state remount.
    expect(page).toContain("key={`pullRequest:${pullRequestDetailInputKey(detailInput)}`}");
    expect(page).toContain("key={`issue:${pullRequestDetailInputKey(detailInput)}`}");
    const run = pane.match(/const runPullRequestAction = [\s\S]*?\n  \};/)?.[0];
    expect(run).toBeDefined();
    expect(run!.indexOf("actionGateRef.current.tryAcquire()")).toBeLessThan(
      run!.indexOf("setLastFailedAction(null);"),
    );
    expect(run).toContain(".catch(() => setLastFailedAction(actionInput))");
  });
});
