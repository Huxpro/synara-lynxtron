import { describe, expect, it } from '@rstest/core';

import {
  DEFAULT_SYNARA_HTTP_ORIGIN,
  DEFAULT_SYNARA_SOCKET_URL,
  resolveRuntimeHttpOrigin,
  resolveRuntimeSocketUrl,
} from './runtimeEndpoint.logic';

describe('runtime endpoint projection', () => {
  it('keeps explicit, configured, and default socket precedence', () => {
    expect(resolveRuntimeSocketUrl('ws://explicit:1', 'ws://configured:2')).toBe(
      'ws://explicit:1'
    );
    expect(resolveRuntimeSocketUrl(null, 'ws://configured:2')).toBe(
      'ws://configured:2'
    );
    expect(resolveRuntimeSocketUrl(null, '  ')).toBe(DEFAULT_SYNARA_SOCKET_URL);
  });

  it('projects ws and wss endpoints to the matching HTTP origin', () => {
    expect(resolveRuntimeHttpOrigin('ws://127.0.0.1:58110/path')).toBe(
      'http://127.0.0.1:58110'
    );
    expect(resolveRuntimeHttpOrigin('wss://synara.example/ws')).toBe(
      'https://synara.example'
    );
    expect(resolveRuntimeHttpOrigin('not-a-socket-url')).toBe(
      DEFAULT_SYNARA_HTTP_ORIGIN
    );
  });
});
