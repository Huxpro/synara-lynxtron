import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { SettingsNavigationItemButtonElement } from './SettingsNavigationCompositionElements.lynx';

describe('Settings navigation semantics', () => {
  it('publishes current-page and Native selected/disabled state', () => {
    render(
      <view>
        <SettingsNavigationItemButtonElement
          active
          accessibleLabel="General"
          disabled={false}
          onSelect={() => {}}
        >
          <text>General</text>
        </SettingsNavigationItemButtonElement>
        <SettingsNavigationItemButtonElement
          active={false}
          accessibleLabel="Desktop"
          disabled
          onSelect={() => {}}
        >
          <text>Desktop</text>
        </SettingsNavigationItemButtonElement>
      </view>
    );

    const items =
      elementTree.root?.querySelectorAll('.SharedSettingsNavigationButton') ?? [];
    expect(items[0]?.getAttribute('aria-current')).toBe('page');
    expect(items[0]?.getAttribute('accessibility-value')).toBe('Current section');
    expect(items[0]?.getAttribute('accessibility-state')).toBe(
      '{"selected":true,"disabled":false}'
    );
    expect(items[1]?.getAttribute('aria-current')).toBeNull();
    expect(items[1]?.getAttribute('focusable')).toBe('false');
    expect(items[1]?.getAttribute('accessibility-state')).toBe(
      '{"selected":false,"disabled":true}'
    );
  });
});
