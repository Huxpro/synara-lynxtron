import type { PullRequestDetail } from "@synara/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PullRequestTimelineComposition } from "./PullRequestTimelineComposition";

function detail(): PullRequestDetail {
  return {
    projectId: "project-1" as PullRequestDetail["projectId"],
    projectTitle: "Widgets",
    workspaceRoot: "/tmp/widgets",
    repository: "acme/widgets",
    number: 42,
    title: "Improve widgets",
    body: "",
    url: "https://github.com/acme/widgets/pull/42",
    author: { login: "author", name: null, avatarUrl: null, url: null },
    state: "open",
    isDraft: false,
    mergeable: "MERGEABLE",
    mergeability: "mergeable",
    mergeStateStatus: "CLEAN",
    reviewDecision: null,
    additions: 1,
    deletions: 0,
    changedFiles: 1,
    headBranch: "feature/widgets",
    baseBranch: "main",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-03T10:00:00Z",
    mergedAt: null,
    closedAt: null,
    maintainerCanModify: true,
    reviewers: [],
    labels: [],
    checks: [],
    comments: [
      {
        id: "comment-1",
        kind: "review",
        author: { login: "reviewer", name: null, avatarUrl: null, url: null },
        body: "**Looks good**",
        createdAt: "2026-07-03T10:00:00Z",
        updatedAt: null,
        url: null,
        path: null,
        reviewState: "APPROVED",
      },
    ],
    commentsTruncated: false,
    commentsIncomplete: false,
    commits: [
      {
        oid: "abcdef1234567890",
        messageHeadline: "Fix the widget",
        messageBody: "",
        committedDate: "2026-07-02T10:00:00Z",
        authors: [],
      },
    ],
    mergeCapabilities: { merge: true, squash: true, rebase: true },
  };
}

describe("PullRequestTimelineComposition", () => {
  it("owns canonical event order, labels, preview and relative time", () => {
    const markup = renderToStaticMarkup(
      <PullRequestTimelineComposition
        detail={detail()}
        nowMs={new Date("2026-07-04T10:00:00Z").getTime()}
      />,
    );
    const opened = markup.indexOf("author opened this pull request");
    const commit = markup.indexOf("Commit abcdef1");
    const review = markup.indexOf("reviewer reviewed");
    expect(opened).toBeGreaterThan(-1);
    expect(opened).toBeLessThan(commit);
    expect(commit).toBeLessThan(review);
    expect(markup).toContain("Fix the widget");
    expect(markup).toContain("Looks good");
    expect(markup).toContain("3d");
  });
});
