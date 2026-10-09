import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Pull Requests detail capabilities", () => {
  it("wires Summary, Timeline, and Code to real detail and diff data", () => {
    const source = readFileSync(new URL("./FeatureListsPage.tsx", import.meta.url), "utf8");

    expect(source).toContain('availableTabs={["summary", "timeline", "code"]}');
    expect(source).toContain('enabled: selectedInput !== null && activeDetailTab === "code"');
    expect(source).toContain("return ensureNativeApi().pullRequests.diff(selectedInput)");
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

  it("reads and writes pull requests through the shared facade", () => {
    const source = readFileSync(new URL("./FeatureListsPage.tsx", import.meta.url), "utf8");
    const composer = readFileSync(
      new URL("../adapters/PullRequestCommentComposer.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("return ensureNativeApi().pullRequests.detail(selectedInput)");
    expect(source).toContain("ensureNativeApi().pullRequests.action(input)");
    expect(source).toContain("await ensureNativeApi().pullRequests.setPinned(input)");
    expect(composer).toContain("ensureNativeApi().pullRequests.comment(input)");
    expect(source).not.toContain("synaraClient");
  });
});
