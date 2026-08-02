import type { PullRequestListEntry } from "@synara/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  PullRequestListComposition,
  PullRequestListEmptyComposition,
  PullRequestListLoadingComposition,
} from "./PullRequestListComposition";
import type { PullRequestListGroup } from "./pullRequestList.logic";

function entry(overrides: Partial<PullRequestListEntry> = {}): PullRequestListEntry {
  return {
    projectId: "project-1" as PullRequestListEntry["projectId"],
    projectTitle: "Project One",
    repository: "acme/widgets",
    number: 42,
    title: "Keep the canonical row anatomy",
    url: "https://github.com/acme/widgets/pull/42",
    author: {
      login: "octocat",
      name: "Octo Cat",
      avatarUrl: null,
      url: null,
    },
    headBranch: "feature/shared-pr-row",
    baseBranch: "main",
    state: "open",
    isDraft: false,
    additions: 12,
    deletions: 4,
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-30T10:00:00.000Z",
    reviewDecision: null,
    viewerReviewRequested: false,
    isPinned: false,
    projectContexts: [
      {
        projectId: "project-1" as PullRequestListEntry["projectId"],
        projectTitle: "Project One",
        isPinned: false,
      },
    ],
    mergeability: "mergeable",
    labels: [],
    ...overrides,
  };
}

describe("PullRequestListComposition", () => {
  it("owns group order and canonical row anatomy", () => {
    const item = entry();
    const groups: PullRequestListGroup[] = [
      { key: "reviewRequested", label: "Review requested", entries: [item] },
    ];
    const markup = renderToStaticMarkup(
      <PullRequestListComposition
        entries={[item]}
        grouped={groups}
        showProjectTitle
        onSelect={vi.fn()}
        onTogglePinned={vi.fn()}
        nowMs={new Date("2026-07-30T12:00:00.000Z").getTime()}
      />,
    );

    expect(markup).toContain("Review requested");
    expect(markup).toContain(
      'aria-label="Keep the canonical row anatomy, pull request #42"',
    );
    expect(markup).toContain("Keep the canonical row anatomy");
    expect(markup).toContain("Project One");
    expect(markup).toContain("acme/widgets");
    expect(markup).toContain("feature/shared-pr-row");
    expect(markup).toContain("2h");
    expect(markup).toContain("+12");
    expect(markup).toContain("-4");
    expect(markup).toContain("Pin pull request #42 in Project One");
  });

  it("owns the loaded-empty and loading state copy", () => {
    const emptyMarkup = renderToStaticMarkup(
      <PullRequestListEmptyComposition
        title="No pull requests found"
        description="Try another involvement, state, project, or search filter."
      />,
    );
    const loadingMarkup = renderToStaticMarkup(<PullRequestListLoadingComposition rowCount={3} />);

    expect(emptyMarkup).toContain("No pull requests found");
    expect(emptyMarkup).toContain("Try another involvement");
    expect(emptyMarkup).toContain('role="status"');
    expect(emptyMarkup).toContain('aria-live="polite"');
    expect(loadingMarkup.match(/data-slot="skeleton"/g)).toHaveLength(3);
    expect(loadingMarkup).toContain('role="status"');
    expect(loadingMarkup).toContain('aria-label="Loading pull requests…"');
  });

  it("uses assertive semantics for an unavailable result", () => {
    const markup = renderToStaticMarkup(
      <PullRequestListEmptyComposition
        title="Pull requests unavailable"
        description="Check your connection and try again."
        intent="alert"
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
  });
});
