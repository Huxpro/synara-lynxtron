import { describe, expect, it } from '@rstest/core';
import fs from 'node:fs';

import { resolveWebRelayEndpoint } from './webRelayEndpoint.logic';

describe('Lynx-for-Web relay endpoint', () => {
  it('lets the same-origin runtime config override a stale build endpoint', () => {
    expect(
      resolveWebRelayEndpoint(
        ' ws://127.0.0.1:58134 ',
        'ws://127.0.0.1:59999',
        'ws://127.0.0.1:58090'
      )
    ).toBe('ws://127.0.0.1:58134');
  });

  it('falls back from runtime to build and then the product default', () => {
    expect(
      resolveWebRelayEndpoint(
        undefined,
        'ws://127.0.0.1:58133',
        'ws://127.0.0.1:58090'
      )
    ).toBe('ws://127.0.0.1:58133');
    expect(
      resolveWebRelayEndpoint(undefined, '', 'ws://127.0.0.1:58090')
    ).toBe('ws://127.0.0.1:58090');
  });

  it('keeps recovery active after both a dropped socket and a cold-start failure', () => {
    const host = fs.readFileSync(
      new URL('./web-host.ts', import.meta.url),
      'utf8'
    );

    expect(host).toContain('startRelayRecovery(baseUrl);');
    expect(host).toContain('startRelayRecovery(configuredRelayBaseUrl());');
  });
});
