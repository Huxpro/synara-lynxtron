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

  it('injects the isolated endpoint into both Web renderer bundles', () => {
    const rsbuildConfig = fs.readFileSync(
      new URL('../../../rsbuild.config.ts', import.meta.url),
      'utf8'
    );
    const rspeedyConfig = fs.readFileSync(
      new URL('../../../lynx.config.ts', import.meta.url),
      'utf8'
    );

    expect(rsbuildConfig).toContain(
      "const configuredSynaraWsUrl = process.env.SYNARA_WS_URL?.trim() ?? ''"
    );
    expect(rsbuildConfig).toContain(
      "'process.env.SYNARA_WS_URL': JSON.stringify(configuredSynaraWsUrl)"
    );
    expect(rspeedyConfig).toContain(
      "'process.env.SYNARA_WS_URL': JSON.stringify(configuredSynaraWsUrl)"
    );
    const host = fs.readFileSync(
      new URL('./web-host.ts', import.meta.url),
      'utf8'
    );
    expect(host).toContain('return process.env.SYNARA_WS_URL;');
    expect(host).not.toContain(
      "if (typeof process === 'undefined') return undefined;"
    );
  });

  it('stages shared public icon URLs for the standalone Web renderer', () => {
    const rsbuildConfig = fs.readFileSync(
      new URL('../../../rsbuild.config.ts', import.meta.url),
      'utf8'
    );

    expect(rsbuildConfig).toContain(
      "from: '../web/public/central-icons-reversed/'"
    );
    expect(rsbuildConfig).toContain("to: 'central-icons-reversed'");
    expect(rsbuildConfig).toContain(
      "from: '../web/public/central-icons-fill/'"
    );
    expect(rsbuildConfig).toContain("to: 'central-icons-fill'");
  });

  it('keeps recovery active after both a dropped socket and a cold-start failure', () => {
    const host = fs.readFileSync(
      new URL('./web-host.ts', import.meta.url),
      'utf8'
    );

    expect(host).toContain('startRelayRecovery(baseUrl);');
    expect(host).toContain('startRelayRecovery(configuredRelayBaseUrl());');
    expect(host).toContain('invalidateRelaySocket(socket, baseUrl, error);');
    expect(host).toContain("import { isWebSocketOpen } from './webSocketState.logic';");
    expect(host).toContain('if (!isWebSocketOpen(socket))');
    expect(host).toContain('isWebSocketOpen(relaySocket)');
    expect(host).not.toContain('WebSocket.OPEN');
  });
});
