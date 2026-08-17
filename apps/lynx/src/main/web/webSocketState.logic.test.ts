import { describe, expect, it } from '@rstest/core';

import {
  isWebSocketOpen,
  WEB_SOCKET_OPEN_STATE,
} from './webSocketState.logic';

describe('Lynx-for-Web socket state', () => {
  it('uses the protocol readyState value without relying on constructor statics', () => {
    expect(WEB_SOCKET_OPEN_STATE).toBe(1);
    expect(isWebSocketOpen({ readyState: 1 })).toBe(true);
    expect(isWebSocketOpen({ readyState: 0 })).toBe(false);
    expect(isWebSocketOpen({ readyState: 2 })).toBe(false);
    expect(isWebSocketOpen({ readyState: 3 })).toBe(false);
  });
});
