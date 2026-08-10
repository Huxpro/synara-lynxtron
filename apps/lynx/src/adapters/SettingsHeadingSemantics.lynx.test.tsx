import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { SettingsPanelHeaderTitleElement } from './SettingsPanelHeaderCompositionElements.lynx';
import { SettingsRowTitleElement } from './SettingsRowElements.lynx';
import { SettingsSectionTitleElement } from './SettingsSectionElements.lynx';

describe('Settings heading semantics', () => {
  it('maps Web h1, h2, and h3 owners to Native header semantics', () => {
    render(
      <view>
        <SettingsPanelHeaderTitleElement>
          General
        </SettingsPanelHeaderTitleElement>
        <SettingsSectionTitleElement className="section">
          Core defaults
        </SettingsSectionTitleElement>
        <SettingsRowTitleElement>Default provider</SettingsRowTitleElement>
      </view>
    );

    for (const selector of [
      '.SharedSettingsPanelHeaderTitle',
      '.SharedSettingsSectionTitle',
      '.SharedSettingsRowTitle',
    ]) {
      const heading = elementTree.root?.querySelector(selector);
      expect(heading?.getAttribute('accessibility-element')).toBe('true');
      expect(heading?.getAttribute('accessibility-heading')).toBe('true');
      expect(heading?.getAttribute('accessibility-traits')).toBe('header');
    }
  });
});
