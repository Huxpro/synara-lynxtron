import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { SidebarSearchPaletteView } from './SidebarSearchPaletteElements.lynx';

describe('SidebarSearchPalette Lynx elements', () => {
  it('preserves nested visual children instead of flattening the row to text', () => {
    render(
      <SidebarSearchPaletteView className="PaletteRowProbe">
        <view className="PaletteIconProbe" />
        <view className="PaletteColumnsProbe">
          <text>Thread title</text>
        </view>
      </SidebarSearchPaletteView>
    );

    expect(elementTree.root?.querySelector('.PaletteRowProbe')).not.toBeNull();
    expect(elementTree.root?.querySelector('.PaletteIconProbe')).not.toBeNull();
    expect(elementTree.root?.querySelector('.PaletteColumnsProbe')).not.toBeNull();
  });
});
