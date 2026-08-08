import { describe, expect, it } from '@rstest/core';

import {
  createLynxSidebarResizeSession,
  isLynxSidebarPrimaryPointer,
  moveLynxSidebarResizeSession,
  readLynxSidebarPointerX,
  resolveLynxSidebarWidth,
} from './sidebarResize.lynx.logic';

describe('Lynx sidebar resize logic', () => {
  it('normalizes mouse and touch coordinates', () => {
    expect(readLynxSidebarPointerX({ clientX: 280 })).toBe(280);
    expect(readLynxSidebarPointerX({ detail: { x: 290 } })).toBe(290);
    expect(
      readLynxSidebarPointerX({ touches: [{ pageX: 300 }] })
    ).toBe(300);
    expect(readLynxSidebarPointerX({})).toBeNull();
    expect(isLynxSidebarPrimaryPointer({ button: 0 })).toBe(true);
    expect(isLynxSidebarPrimaryPointer({ button: 2 })).toBe(false);
  });

  it('uses the Web desktop bounds and compact offcanvas width', () => {
    expect(
      resolveLynxSidebarWidth({ requestedWidth: 100, viewportWidth: 1280 })
    ).toBe(208);
    expect(
      resolveLynxSidebarWidth({ requestedWidth: 420, viewportWidth: 1024 })
    ).toBe(384);
    expect(
      resolveLynxSidebarWidth({ requestedWidth: 256, viewportWidth: 600 })
    ).toBe(588);
  });

  it('tracks movement and ends safely after a missed mouseup', () => {
    const session = createLynxSidebarResizeSession({
      startWidth: 256,
      startX: 256,
    });
    const moved = moveLynxSidebarResizeSession({
      event: { clientX: 320, buttons: 1 },
      session,
      viewportWidth: 1280,
    });
    expect(moved).toEqual({
      kind: 'moved',
      session: {
        moved: true,
        startWidth: 256,
        startX: 256,
        width: 320,
      },
    });
    expect(
      moveLynxSidebarResizeSession({
        event: { clientX: 330, buttons: 0 },
        session,
        viewportWidth: 1280,
      })
    ).toEqual({ kind: 'ended-missed-mouseup' });
  });
});
