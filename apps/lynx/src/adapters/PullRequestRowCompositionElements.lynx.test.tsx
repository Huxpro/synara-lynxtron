import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  PullRequestRowPinElement,
  PullRequestRowStateElement,
} from './PullRequestRowCompositionElements.lynx';

describe('Pull Request row icon fidelity', () => {
  it('renders the canonical five-state Central identities without Unicode glyphs', () => {
    render(
      <view>
        <PullRequestRowStateElement state="open" isDraft={false} />
        <PullRequestRowStateElement state="open" isDraft />
        <PullRequestRowStateElement
          state="open"
          isDraft={false}
          mergeability="conflicting"
        />
        <PullRequestRowStateElement state="merged" isDraft={false} />
        <PullRequestRowStateElement state="closed" isDraft={false} />
      </view>
    );

    const states = Array.from(
      elementTree.root?.querySelectorAll('.SharedPrState') ?? []
    );
    expect(states.map((state) => state.getAttribute('accessibility-label'))).toEqual([
      'PR open',
      'PR draft',
      'PR has conflicts',
      'PR merged',
      'PR closed',
    ]);
    const contents = Array.from(
      elementTree.root?.querySelectorAll('.SharedPrStateIcon') ?? []
    ).map((icon) => icon.getAttribute('content'));
    expect(contents[0]).toContain('#00a240');
    expect(contents[2]).toContain('#e02e2a');
    expect(contents[3]).toContain('#5e6ad2');
    expect(new Set(contents).size).toBe(5);

    const source = readFileSync(
      new URL('./PullRequestRowCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain(
      "import draftSvg from '@synara-central-icons/draft.svg?raw';"
    );
    expect(source).toContain(
      "import pullRequestClosedSvg from '@synara-central-icons/request-closed.svg?raw';"
    );
    expect(source).not.toMatch(/[◌↗◆×●○]/);
  });

  it('switches between outline and filled Central pin assets', () => {
    render(
      <view>
        <PullRequestRowPinElement
          label="Pin pull request"
          pinned={false}
          onActivate={() => undefined}
        />
        <PullRequestRowPinElement
          label="Unpin pull request"
          pinned
          onActivate={() => undefined}
        />
      </view>
    );

    const icons = elementTree.root?.querySelectorAll('.SharedPrPinIcon') ?? [];
    expect(icons).toHaveLength(2);
    expect(icons[0]?.getAttribute('content')).not.toBe(
      icons[1]?.getAttribute('content')
    );
  });
});
