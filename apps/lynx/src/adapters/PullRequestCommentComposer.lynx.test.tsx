import type {
  PullRequestActionResult,
  PullRequestCommentInput,
  PullRequestDetail,
} from "@synara/contracts";
import { describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { queryClient } from "../app/queries";
import { PullRequestCommentComposer } from "./PullRequestCommentComposer.lynx";

function detail(): PullRequestDetail {
  return {
    projectId: "project-1" as PullRequestDetail["projectId"],
    projectTitle: "Synara",
    workspaceRoot: "/workspace/synara",
    repository: "acme/synara",
    number: 42,
    title: "Post comments from Lynx",
    body: "",
    url: "https://github.com/acme/synara/pull/42",
    author: null,
    state: "open",
    isDraft: false,
    mergeable: "MERGEABLE",
    mergeability: "mergeable",
    mergeStateStatus: "CLEAN",
    reviewDecision: null,
    additions: 1,
    deletions: 0,
    changedFiles: 1,
    headBranch: "feature/comments",
    baseBranch: "main",
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    mergedAt: null,
    closedAt: null,
    maintainerCanModify: true,
    reviewers: [],
    labels: [],
    checks: [],
    comments: [],
    commentsTruncated: false,
    commentsIncomplete: false,
    commits: [],
    mergeCapabilities: {
      merge: true,
      squash: true,
      rebase: true,
      deleteBranchOnMerge: false,
    },
  };
}

function result(): PullRequestActionResult {
  return {
    projectId: "project-1" as PullRequestActionResult["projectId"],
    repository: "acme/synara",
    number: 42,
    workspaceRoot: "/workspace/synara",
  };
}

function textarea(): Element {
  const element = elementTree.root?.querySelector(".SharedPrCommentComposerInput");
  if (!element) throw new Error("expected PR comment textarea");
  return element;
}

function submitButton(): Element {
  const element = elementTree.root?.querySelector(".SharedPrCommentComposerSubmit");
  if (!element) throw new Error("expected PR comment submit button");
  return element;
}

function input(value: string, isComposing = false) {
  textarea().dispatchEvent(
    new CustomEvent("bindEvent:input", {
      bubbles: true,
      detail: {
        value,
        selectionStart: value.length,
        selectionEnd: value.length,
        isComposing,
      },
    }),
  );
}

function keydown(key: string, shiftKey = false) {
  const event = new Event("catchEvent:keydown", { bubbles: true });
  Object.assign(event, { key, shiftKey });
  textarea().dispatchEvent(event);
}

function renderComposer(
  postComment: (input: PullRequestCommentInput) => Promise<PullRequestActionResult>,
) {
  return render(<PullRequestCommentComposer detail={detail()} postComment={postComment} />);
}

describe("Lynx pull request comment composer", () => {
  it("matches the Web body-text editor inside the shared pill geometry", () => {
    const styles = readFileSync(
      new URL("./pull-request-summary-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SharedPrCommentComposerControl\s*\{[^}]*min-height:\s*42px;[^}]*gap:\s*8px;[^}]*padding:\s*4px 6px 4px 12px;[^}]*border-radius:\s*22px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrCommentComposerInput\s*\{[^}]*min-height:\s*34px;[^}]*max-height:\s*126px;[^}]*padding:\s*7px 0;[^}]*font-family:\s*var\(--font-ui-family\);[^}]*font-size:\s*var\(--app-font-size-ui-lg\);[^}]*line-height:\s*20px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrCommentComposerSubmit\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-radius:\s*14px;/s,
    );
  });

  it("uses a readable destructive callout while retaining the draft", () => {
    const styles = readFileSync(
      new URL("./pull-request-summary-composition-elements.css", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SharedPrCommentComposerError\s*\{[^}]*margin-top:\s*8px;[^}]*padding:\s*8px 10px;[^}]*border:\s*1px solid var\(--pr-comment-error-border\);[^}]*border-radius:\s*6px;[^}]*background-color:\s*var\(--pr-comment-error-surface\);/s,
    );
    expect(styles).toMatch(
      /\.SharedPrCommentComposerErrorTitle,\s*\.SharedPrCommentComposerErrorDescription\s*\{[^}]*color:\s*var\(--destructive\);[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s,
    );
    expect(appStyles).toContain("--pr-comment-error-surface: rgba(224, 46, 42, 0.04);");
    expect(appStyles).toContain("--pr-comment-error-border: rgba(227, 67, 63, 0.3);");
  });

  it("submits normalized comments once through the injected poster", async () => {
    queryClient.clear();
    let resolveRequest: ((value: PullRequestActionResult) => void) | undefined;
    const postComment = rs.fn(
      () =>
        new Promise<PullRequestActionResult>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const selectedDetail = detail();
    renderComposer(postComment);

    expect(textarea().getAttribute("placeholder")).toBe("Leave a comment");
    fireEvent.tap(submitButton());
    expect(postComment).not.toHaveBeenCalled();

    input(" \n Ship this from Lynx. \n ");
    await waitFor(() => expect(textarea()).toBeTruthy());
    const pendingTextarea = textarea();
    keydown("Enter");
    keydown("Enter");

    expect(postComment).toHaveBeenCalledTimes(1);
    expect(postComment).toHaveBeenCalledWith({
      projectId: selectedDetail.projectId,
      repository: "acme/synara",
      number: 42,
      body: "Ship this from Lynx.",
    });
    resolveRequest?.(result());

    await waitFor(() => {
      expect(textarea()).not.toBe(pendingTextarea);
    });
  });

  it("posts through upstream's comment mutation, which refreshes upstream's caches", () => {
    const source = readFileSync(
      new URL("./PullRequestCommentComposer.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(".build(queryClient, pullRequestCommentMutationOptions(queryClient))");
    expect(source).not.toContain('"pull-request-detail"');
    expect(source).not.toContain("invalidateQueries");
  });

  it("preserves newline and IME behavior, then keeps the draft recoverable after failure", async () => {
    queryClient.clear();
    const postComment = rs
      .fn()
      .mockRejectedValueOnce(new Error("gh auth expired"))
      .mockResolvedValueOnce(result());
    renderComposer(postComment);

    input("First line");
    await waitFor(() => expect(textarea()).toBeTruthy());
    keydown("Enter", true);
    expect(postComment).not.toHaveBeenCalled();

    input("拼", true);
    await waitFor(() => expect(textarea()).toBeTruthy());
    keydown("Enter");
    expect(postComment).not.toHaveBeenCalled();

    input(" Retry this comment. ", false);
    await waitFor(() => expect(textarea()).toBeTruthy());
    fireEvent.tap(submitButton());

    await waitFor(() => {
      expect(
        elementTree.root?.querySelector(".SharedPrCommentComposerErrorTitle")?.textContent,
      ).toBe("Could not post comment");
      expect(
        elementTree.root?.querySelector(".SharedPrCommentComposerErrorDescription")?.textContent,
      ).toBe("gh auth expired");
    });

    fireEvent.tap(submitButton());
    await waitFor(() => expect(postComment).toHaveBeenCalledTimes(2));
    expect(postComment).toHaveBeenLastCalledWith(
      expect.objectContaining({ body: "Retry this comment." }),
    );
  });
});
