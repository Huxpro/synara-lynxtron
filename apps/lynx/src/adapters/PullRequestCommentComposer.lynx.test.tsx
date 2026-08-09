import type {
  PullRequestActionResult,
  PullRequestCommentInput,
  PullRequestDetail,
} from '@synara/contracts';
import { describe, expect, it, rs } from '@rstest/core';
import {
  fireEvent,
  render,
  waitFor,
} from '@lynx-js/react/testing-library';

import { queryClient } from '../app/queries';
import { PullRequestCommentComposer } from './PullRequestCommentComposer.lynx';

function detail(): PullRequestDetail {
  return {
    projectId: 'project-1' as PullRequestDetail['projectId'],
    projectTitle: 'Synara',
    workspaceRoot: '/workspace/synara',
    repository: 'acme/synara',
    number: 42,
    title: 'Post comments from Lynx',
    body: '',
    url: 'https://github.com/acme/synara/pull/42',
    author: null,
    state: 'open',
    isDraft: false,
    mergeable: 'MERGEABLE',
    mergeability: 'mergeable',
    mergeStateStatus: 'CLEAN',
    reviewDecision: null,
    additions: 1,
    deletions: 0,
    changedFiles: 1,
    headBranch: 'feature/comments',
    baseBranch: 'main',
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z',
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
    projectId: 'project-1' as PullRequestActionResult['projectId'],
    repository: 'acme/synara',
    number: 42,
    workspaceRoot: '/workspace/synara',
  };
}

function textarea(): Element {
  const element = elementTree.root?.querySelector(
    '.SharedPrCommentComposerInput'
  );
  if (!element) throw new Error('expected PR comment textarea');
  return element;
}

function submitButton(): Element {
  const element = elementTree.root?.querySelector(
    '.SharedPrCommentComposerSubmit'
  );
  if (!element) throw new Error('expected PR comment submit button');
  return element;
}

function input(value: string, isComposing = false) {
  textarea().dispatchEvent(
    new CustomEvent('bindEvent:input', {
      bubbles: true,
      detail: {
        value,
        selectionStart: value.length,
        selectionEnd: value.length,
        isComposing,
      },
    })
  );
}

function keydown(key: string, shiftKey = false) {
  const event = new Event('catchEvent:keydown', { bubbles: true });
  Object.assign(event, { key, shiftKey });
  textarea().dispatchEvent(event);
}

function renderComposer(
  postComment: (
    input: PullRequestCommentInput
  ) => Promise<PullRequestActionResult>
) {
  return render(
    <PullRequestCommentComposer
      detail={detail()}
      postComment={postComment}
    />
  );
}

describe('Lynx pull request comment composer', () => {
  it('submits normalized comments once and revalidates detail and list data', async () => {
    queryClient.clear();
    let resolveRequest: ((value: PullRequestActionResult) => void) | undefined;
    const postComment = rs.fn(
      () =>
        new Promise<PullRequestActionResult>((resolve) => {
          resolveRequest = resolve;
        })
    );
    const selectedDetail = detail();
    const detailKey = [
      'pull-request-detail',
      selectedDetail.projectId,
      selectedDetail.repository,
      selectedDetail.number,
    ];
    const listKey = ['pull-requests', 'open', null];
    queryClient.setQueryData(detailKey, selectedDetail);
    queryClient.setQueryData(listKey, []);
    renderComposer(postComment);

    expect(textarea().getAttribute('placeholder')).toBe('Leave a comment');
    fireEvent.tap(submitButton());
    expect(postComment).not.toHaveBeenCalled();

    input(' \n Ship this from Lynx. \n ');
    await waitFor(() => expect(textarea()).toBeTruthy());
    const pendingTextarea = textarea();
    keydown('Enter');
    keydown('Enter');

    expect(postComment).toHaveBeenCalledTimes(1);
    expect(postComment).toHaveBeenCalledWith({
      projectId: selectedDetail.projectId,
      repository: 'acme/synara',
      number: 42,
      body: 'Ship this from Lynx.',
    });
    resolveRequest?.(result());

    await waitFor(() => {
      expect(textarea()).not.toBe(pendingTextarea);
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    });
  });

  it('preserves newline and IME behavior, then keeps the draft recoverable after failure', async () => {
    queryClient.clear();
    const postComment = rs
      .fn()
      .mockRejectedValueOnce(new Error('gh auth expired'))
      .mockResolvedValueOnce(result());
    renderComposer(postComment);

    input('First line');
    await waitFor(() => expect(textarea()).toBeTruthy());
    keydown('Enter', true);
    expect(postComment).not.toHaveBeenCalled();

    input('拼', true);
    await waitFor(() => expect(textarea()).toBeTruthy());
    keydown('Enter');
    expect(postComment).not.toHaveBeenCalled();

    input(' Retry this comment. ', false);
    await waitFor(() => expect(textarea()).toBeTruthy());
    fireEvent.tap(submitButton());

    await waitFor(() => {
      expect(
        elementTree.root?.querySelector(
          '.SharedPrCommentComposerErrorTitle'
        )?.textContent
      ).toBe('Could not post comment');
      expect(
        elementTree.root?.querySelector(
          '.SharedPrCommentComposerErrorDescription'
        )?.textContent
      ).toBe('gh auth expired');
    });

    fireEvent.tap(submitButton());
    await waitFor(() => expect(postComment).toHaveBeenCalledTimes(2));
    expect(postComment).toHaveBeenLastCalledWith(
      expect.objectContaining({ body: 'Retry this comment.' })
    );
  });
});
