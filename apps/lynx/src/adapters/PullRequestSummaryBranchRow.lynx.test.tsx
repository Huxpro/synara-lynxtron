import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { PullRequestSummaryBranchRow } from "./PullRequestSummaryBranchRow.lynx";

describe("Pull Request summary branch row fidelity", () => {
  it("renders branch identities and semantic diff stats separately", () => {
    render(
      <PullRequestSummaryBranchRow
        label="Branches"
        headBranch="feature/fidelity"
        baseBranch="main"
        additions={1_234}
        deletions={56}
      />,
    );

    expect(
      elementTree.root?.querySelector(".SharedPrSummaryMetaLabelIcon")?.getAttribute("content"),
    ).toContain('stroke="rgba(13, 13, 13, 0.6)"');
    const branches = Array.from(
      elementTree.root?.querySelectorAll(".SharedPrSummaryBranchName") ?? [],
    );
    expect(branches.map((branch) => branch.textContent)).toEqual(["feature/fidelity", "main"]);
    expect(elementTree.root?.querySelector(".SharedPrSummaryDiffStat--addition")?.textContent).toBe(
      "+1,234",
    );
    expect(elementTree.root?.querySelector(".SharedPrSummaryDiffStat--deletion")?.textContent).toBe(
      "-56",
    );
  });
});
