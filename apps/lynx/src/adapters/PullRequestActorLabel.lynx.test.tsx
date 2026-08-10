import { describe, expect, it } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { PullRequestActorLabel } from './PullRequestActorLabel.lynx';

describe('Pull Request actor label fidelity', () => {
  it('renders the GitHub avatar and login as one named actor', () => {
    render(
      <PullRequestActorLabel
        actor={{
          login: 'octocat',
          name: 'The Octocat',
          avatarUrl: 'https://avatars.example/octocat.png',
        }}
        variant="reviewer"
      />
    );

    const label = elementTree.root?.querySelector('.SharedPrActorLabel');
    expect(label?.getAttribute('accessibility-label')).toBe('octocat');
    expect(label?.querySelector('.SharedPrActorAvatar')?.getAttribute('src')).toBe(
      'https://avatars.example/octocat.png'
    );
    expect(label?.querySelector('.SharedPrActorLogin')?.textContent).toBe(
      'octocat'
    );
  });

  it('falls back to initials and the canonical ghost login', () => {
    const { rerender } = render(
      <PullRequestActorLabel
        actor={{
          login: 'reviewer',
          name: 'Reviewer',
          avatarUrl: 'https://avatars.example/reviewer.png',
        }}
        variant="author"
      />
    );
    const image = elementTree.root?.querySelector('.SharedPrActorAvatar');
    fireEvent(image!, new Event('bindEvent:error', { bubbles: true }));
    expect(
      elementTree.root?.querySelector('.SharedPrActorAvatarInitial')?.textContent
    ).toBe('R');

    rerender(<PullRequestActorLabel actor={null} variant="author" />);
    expect(
      elementTree.root?.querySelector('.SharedPrActorLabel')?.getAttribute(
        'accessibility-label'
      )
    ).toBe('ghost');
    expect(
      elementTree.root?.querySelector('.SharedPrActorLogin')?.textContent
    ).toBe('ghost');
  });
});
