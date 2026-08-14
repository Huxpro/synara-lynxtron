import { describe, expect, it } from '@rstest/core';

import { resolveResponsiveSidebarOpen } from './sidebarVisibility.logic';

describe('resolveResponsiveSidebarOpen', () => {
  it('defaults closed before viewport hydration and on compact screens', () => {
    expect(
      resolveResponsiveSidebarOpen({
        userOverride: null,
        viewportWidth: 0,
        desktopMinimumWidth: 768,
      })
    ).toBe(false);
    expect(
      resolveResponsiveSidebarOpen({
        userOverride: null,
        viewportWidth: 390,
        desktopMinimumWidth: 768,
      })
    ).toBe(false);
  });

  it('defaults open on desktop and preserves explicit user overrides', () => {
    expect(
      resolveResponsiveSidebarOpen({
        userOverride: null,
        viewportWidth: 1280,
        desktopMinimumWidth: 768,
      })
    ).toBe(true);
    expect(
      resolveResponsiveSidebarOpen({
        userOverride: true,
        viewportWidth: 390,
        desktopMinimumWidth: 768,
      })
    ).toBe(true);
    expect(
      resolveResponsiveSidebarOpen({
        userOverride: false,
        viewportWidth: 1280,
        desktopMinimumWidth: 768,
      })
    ).toBe(false);
  });
});
