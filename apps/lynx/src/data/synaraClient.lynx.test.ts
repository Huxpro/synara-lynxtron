import { readFileSync } from 'node:fs';

import { describe, expect, it } from '@rstest/core';

describe('Lynx Synara relay state', () => {
  it('keeps the Lynxtron 0.0.9 feature socket in the Node host', () => {
    const hostSource = readFileSync(
      new URL('../main/desktop/nativeRpcHost.ts', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('./synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );

    expect(hostSource).toContain(
      "const featureManager = createManager(openFeatureSocket, {\n  closeWhenIdle: false,"
    );
    expect(hostSource).toContain('{ maxReconnectAttempts: 0 }');
    expect(hostSource).toContain('manager.dispose()');
    expect(clientSource).not.toContain('LynxWebSocketModule');
    expect(clientSource).not.toContain('featureManager');

    const mainSource = readFileSync(
      new URL('../main/desktop/main.ts', import.meta.url),
      'utf8'
    );
    expect(mainSource).toContain(
      "_tag: 'NativeRpcResult'"
    );
    expect(clientSource).toContain("parsed._tag === 'NativeRpcResult'");
  });

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
    expect(relayRequest).toContain("setRelayState('offline')");
    expect(relayRequest).toContain("setRelayState('connected')");
  });

  it('keeps streamed RPC backpressure and completion explicit on Web', () => {
    const hostSource = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('./synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );

    expect(hostSource).toContain("message._tag === 'Chunk'");
    expect(hostSource).toContain("_tag: 'Ack'");
    expect(hostSource).toContain('publishRelayGitActionProgress?.(value)');
    expect(hostSource).toContain('const timer = stream');
    expect(hostSource).toContain('? undefined');
    expect(clientSource).toContain("'synaraRpcStream'");
    expect(clientSource).toContain('gitActionProgressListeners.get(event.actionId)');
    expect(clientSource).toContain("event.kind === 'action_finished'");
    expect(clientSource).toContain(
      "'Git action stream completed without a final result'"
    );
  });

  it('uses canonical automation mutation tags', () => {
    const source = readFileSync(
      new URL('./synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    expect(source).toContain(
      "transportRequest<AutomationDefinition>('automation.update', input)"
    );
    expect(source).toContain(
      "transportRequest<AutomationDefinition>('automation.create', input)"
    );
    expect(source).toContain(
      "transportRequest('automation.delete', input)"
    );
  });
});
