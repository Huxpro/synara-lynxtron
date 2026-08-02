import type { PullRequestDetail } from "@synara/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PullRequestSummaryComposition } from "./PullRequestSummaryComposition";

function detail(overrides: Partial<PullRequestDetail> = {}): PullRequestDetail {
  return {
    projectId: "project-1" as PullRequestDetail["projectId"],
    projectTitle: "Synara",
    workspaceRoot: "/workspace/synara",
    repository: "acme/synara",
    number: 42,
    title: "Share the pull request summary anatomy",
    body: "Canonical **description**.",
    url: "https://github.com/acme/synara/pull/42",
    author: {
      login: "octocat",
      name: "Octo Cat",
      avatarUrl: null,
      url: null,
    },
    state: "open",
    isDraft: false,
    mergeable: "CONFLICTING",
    mergeability: "conflicting",
    mergeStateStatus: "DIRTY",
    reviewDecision: "REVIEW_REQUIRED",
    additions: 12,
    deletions: 4,
    changedFiles: 3,
    headBranch: "feature/shared-summary",
    baseBranch: "main",
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-30T10:00:00.000Z",
    mergedAt: null,
    closedAt: null,
    maintainerCanModify: true,
    reviewers: [
      {
        login: "reviewer",
        name: null,
        avatarUrl: null,
        url: null,
      },
    ],
    labels: [],
    checks: [
      {
        name: "Web production",
        status: "success",
        description: null,
        url: "https://github.com/acme/synara/actions/1",
        startedAt: null,
        completedAt: "2026-07-30T10:05:00.000Z",
      },
    ],
    comments: [
      {
        id: "comment-1",
        kind: "review-comment",
        author: {
          login: "reviewer",
          name: null,
          avatarUrl: null,
          url: null,
        },
        body: "Please keep this **shared**.",
        createdAt: "2026-07-30T10:10:00.000Z",
        updatedAt: null,
        url: null,
        path: "apps/web/src/summary.tsx",
        reviewState: null,
      },
    ],
    commentsTruncated: false,
    commentsIncomplete: false,
    commits: [],
    mergeCapabilities: {
      merge: true,
      squash: true,
      rebase: true,
      deleteBranchOnMerge: false,
    },
    ...overrides,
  };
}

describe("PullRequestSummaryComposition", () => {
  it("owns the canonical intro, metadata, and section order", () => {
    const markup = renderToStaticMarkup(
      <PullRequestSummaryComposition
        detail={detail()}
        commentingAvailable={false}
        nowMs={new Date("2026-07-30T12:00:00.000Z").getTime()}
      />,
    );

    expect(markup).toContain("Share the pull request summary anatomy");
    expect(markup).toContain("octocat");
    expect(markup).toContain("2h");
    expect(markup).toContain("Ready for review");
    expect(markup).toContain("feature/shared-summary");
    expect(markup).toContain("Conflicts with main");
    expect(markup).toContain("reviewer");
    expect(markup).toContain("1 comment");
    expect(markup).toContain("All checks passed");
    const descriptionSection = markup.indexOf(">Description</span>");
    const checksSection = markup.indexOf(">Checks</span>", descriptionSection);
    const commentsSection = markup.indexOf(">Comments</span>", checksSection);
    expect(descriptionSection).toBeGreaterThan(-1);
    expect(descriptionSection).toBeLessThan(checksSection);
    expect(checksSection).toBeLessThan(commentsSection);
    expect(markup).toContain("Canonical");
    expect(markup).toContain("Web production");
    expect(markup).toContain("Please keep this");
    expect(markup).not.toContain("Add a comment");
  });

  it("owns empty and incomplete copy without exposing the comment composer", () => {
    const markup = renderToStaticMarkup(
      <PullRequestSummaryComposition
        detail={detail({
          body: "",
          checks: [],
          comments: [],
          commentsIncomplete: true,
        })}
        commentingAvailable={false}
      />,
    );

    expect(markup).toContain("No description provided.");
    expect(markup).toContain("No checks reported.");
    expect(markup).toContain("No comments");
    expect(markup).toContain("Some unresolved review comments could not be loaded.");
    expect(markup).not.toContain("Add a comment");
  });
});
