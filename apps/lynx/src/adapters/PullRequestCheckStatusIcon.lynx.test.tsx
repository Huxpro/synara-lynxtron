import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { PullRequestCheckStatusIcon } from './PullRequestCheckStatusIcon.lynx';

describe('Pull Request check status icons', () => {
  it('renders success, failure, pending, and neutral identities in one footprint', () => {
    render(
      <>
        <PullRequestCheckStatusIcon status="success" />
        <PullRequestCheckStatusIcon status="failure" />
        <PullRequestCheckStatusIcon status="cancelled" />
        <PullRequestCheckStatusIcon status="pending" />
        <PullRequestCheckStatusIcon status="skipped" />
        <PullRequestCheckStatusIcon status="neutral" />
      </>
    );

    expect(
      elementTree.root?.querySelectorAll('.SharedPrSummaryCheckStatusIcon')
    ).toHaveLength(6);
    expect(
      elementTree.root?.querySelectorAll(
        '.SharedPrSummaryCheckStatusIcon--pending'
      )
    ).toHaveLength(1);
    expect(
      elementTree.root?.querySelectorAll(
        '.SharedPrSummaryCheckStatusIcon--neutral'
      )
    ).toHaveLength(2);
  });
});
