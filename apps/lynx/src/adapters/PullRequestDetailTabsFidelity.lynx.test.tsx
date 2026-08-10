import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  PullRequestDetailCapabilityElement,
  PullRequestDetailTabElement,
  PullRequestDetailTabsRootElement,
} from './PullRequestDetailTabsCompositionElements.lynx';

describe('Pull Request detail tabs fidelity', () => {
  it('publishes one named tab group with selected action semantics', () => {
    render(
      <PullRequestDetailTabsRootElement>
        <PullRequestDetailTabElement
          active
          available
          label="Summary"
          onActivate={() => undefined}
        />
      </PullRequestDetailTabsRootElement>
    );

    const root = elementTree.root?.querySelector('.SharedPrDetailTabs');
    const tab = elementTree.root?.querySelector('.SharedPrDetailTab');
    expect(root?.getAttribute('aria-label')).toBe('Pull request detail tabs');
    expect(root?.getAttribute('accessibility-element')).toBe('false');
    expect(tab?.getAttribute('accessibility-traits')).toBe('button');
    expect(tab?.getAttribute('accessibility-value')).toBe('Selected');
  });

  it('uses the standard PR meta role for visible capability copy', () => {
    render(
      <PullRequestDetailCapabilityElement>
        Code is unavailable.
      </PullRequestDetailCapabilityElement>
    );
    expect(
      elementTree.root?.querySelector('.SharedPrDetailCapabilityText')
        ?.textContent
    ).toBe('Code is unavailable.');
    const styles = readFileSync(
      new URL('./pull-request-detail-tabs-composition-elements.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.SharedPrDetailCapabilityText\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
    );
  });
});
