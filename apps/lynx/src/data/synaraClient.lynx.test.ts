import { readFileSync } from 'node:fs';

import { describe, expect, it } from '@rstest/core';

describe('Lynx Synara relay state', () => {
  it('leaves connection lifecycle state to the Web relay socket owner', () => {
    const source = readFileSync(
      new URL('./synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const relayRequest = source.slice(
      source.indexOf('async function relayRequest'),
      source.indexOf('function transportRequest')
    );

    expect(source).toContain('onGlobalEvent(TRANSPORT_STATE_EVENT');
    expect(relayRequest).not.toContain(
      "setRelayState(relayEverConnected ? 'reconnecting' : 'connecting')"
    );
    expect(relayRequest).not.toContain("setRelayState('offline')");
    expect(relayRequest).toContain("setRelayState('connected')");
  });
});
