import { describe, expect, it } from '@rstest/core';

import { resolveBrowserViewBounds } from './browserViewBounds.lynx';

describe('Native Browser host bounds', () => {
  it('preserves a correctly measured content slot', () => {
    expect(
      resolveBrowserViewBounds(
        { left: 448, top: 32, width: 416, height: 1052 },
        { left: 448, top: 112, width: 416, height: 972 },
        80
      )
    ).toEqual({ x: 448, y: 112, width: 416, height: 972 });
  });

  it('keeps a cold-start measurement below both Browser chrome rows', () => {
    expect(
      resolveBrowserViewBounds(
        { left: 448, top: 32, width: 416, height: 1052 },
        { left: 448, top: 32, width: 416, height: 1052 },
        80
      )
    ).toEqual({ x: 448, y: 112, width: 416, height: 972 });
  });

  it('rejects a measurement with no content below the chrome boundary', () => {
    expect(
      resolveBrowserViewBounds(
        { left: 448, top: 32, width: 416, height: 80 },
        { left: 448, top: 32, width: 416, height: 80 },
        80
      )
    ).toBeNull();
  });
});
