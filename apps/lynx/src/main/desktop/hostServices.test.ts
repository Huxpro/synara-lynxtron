import { describe, expect, it } from '@rstest/core';

import { resolveSynaraWsUrl } from './runtimeEndpoint.logic';

describe('Synara desktop runtime endpoint', () => {
  it('uses the product default when no override is configured', () => {
    expect(resolveSynaraWsUrl('')).toBe('ws://127.0.0.1:58090');
    expect(resolveSynaraWsUrl({ value: 'ws://bad-shape:1' })).toBe(
      'ws://127.0.0.1:58090'
    );
  });

  it('normalizes an isolated server override while preserving authentication', () => {
    expect(resolveSynaraWsUrl(' wss://synara.example:58155/stale?token=x ')).toBe(
      'wss://synara.example:58155?token=x'
    );
  });

  it('rejects non-WebSocket endpoints', () => {
    expect(() => resolveSynaraWsUrl('http://127.0.0.1:58155')).toThrow(
      'requires a ws:// or wss:// URL'
    );
  });
});
