import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('sidebar segmented picker Lynx chrome', () => {
  it('matches the Web track and thumb radii and raised material', () => {
    const styles = readFileSync(
      new URL('./sidebar-segmented-picker-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SidebarSegmentedTrack\s*\{[^}]*width:\s*calc\(100% \+ 1px\);[^}]*border:\s*1px solid var\(--border\);[^}]*border-radius:\s*10px;[^}]*background-color:\s*var\(--color-background-elevated-secondary\);[^}]*box-shadow:\s*inset 0 1px 2px rgba\(0,\s*0,\s*0,\s*0\.06\);/s
    );
    expect(styles).toMatch(
      /\.SidebarSegmentedThumb\s*\{[^}]*top:\s*-1\.5px;[^}]*bottom:\s*-1\.5px;[^}]*border:\s*1px solid var\(--border\);[^}]*border-radius:\s*8px;[^}]*background-color:\s*var\(--color-background-elevated-secondary-opaque\);[^}]*box-shadow:\s*0 1px 1\.5px rgba\(0,\s*0,\s*0,\s*0\.04\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.5\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.SidebarSegmentedTrack\s*\{[^}]*background-color:\s*var\(--background\);[^}]*box-shadow:\s*inset 0 1px 2px rgba\(0,\s*0,\s*0,\s*0\.25\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.SidebarSegmentedThumb\s*\{[^}]*background-color:\s*var\(--composer-surface\);[^}]*box-shadow:\s*0 1px 1\.5px rgba\(0,\s*0,\s*0,\s*0\.16\),\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.04\);/s
    );
  });
});
