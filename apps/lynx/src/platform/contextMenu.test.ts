import { describe, expect, it } from '@rstest/core';

import { contextMenuBridgePayload } from './contextMenu';

describe('contextMenuBridgePayload', () => {
  it('publishes rounded cursor coordinates and preserves action metadata', () => {
    expect(
      contextMenuBridgePayload(
        [
          { id: 'copy-thread-id', label: 'Copy Thread ID' },
          { id: 'archive', label: 'Archive', separatorBefore: true },
        ],
        { x: 42.6, y: 19.2 }
      )
    ).toEqual({
      items: [
        { id: 'copy-thread-id', label: 'Copy Thread ID' },
        { id: 'archive', label: 'Archive', separatorBefore: true },
      ],
      position: { x: 43, y: 19 },
    });
  });
});
