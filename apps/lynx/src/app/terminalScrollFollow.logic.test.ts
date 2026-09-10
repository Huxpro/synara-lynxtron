import { describe, expect, it } from '@rstest/core';

import { resolveTerminalPinnedFromScroll } from './terminalScrollFollow.logic';

describe('resolveTerminalPinnedFromScroll', () => {
  const base = {
    bottomEpsilon: 30,
    currentPinned: true,
    nativeUserEventSource: 2,
    viewportHeight: 119,
  } as const;

  it('detaches on a real upward scroll and reattaches at the live edge', () => {
    expect(
      resolveTerminalPinnedFromScroll({
        ...base,
        detail: { isDragging: true, scrollTop: 100, scrollHeight: 361 },
      })
    ).toBe(false);
    expect(
      resolveTerminalPinnedFromScroll({
        ...base,
        currentPinned: false,
        detail: { isDragging: true, scrollTop: 242, scrollHeight: 361 },
      })
    ).toBe(true);
  });

  it('ignores programmatic scroll events and uses delta only for user fallback', () => {
    expect(
      resolveTerminalPinnedFromScroll({
        ...base,
        currentPinned: false,
        detail: { scrollTop: 242, scrollHeight: 361 },
      })
    ).toBe(false);
    expect(
      resolveTerminalPinnedFromScroll({
        ...base,
        detail: { isDragging: true, deltaY: -4 },
        viewportHeight: null,
      })
    ).toBe(false);
  });
});
