import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  createHostInputProbeMatrix,
  formatHostInputProbeReport,
  hostInputProbeSummary,
  recordHostEventArrival,
  recordHostEventBinding,
} from './HostInputProbe.logic';

describe('host input probe matrix', () => {
  it('includes a dynamic spread event control', () => {
    const source = readFileSync(
      new URL('./HostInputProbe.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('id="host-input-probe-dynamic-spread"');
    expect(source).toContain('{...dynamicSpreadEvents}');
    expect(source).toContain('Dynamic spread taps: ${dynamicSpreadTapCount}');
    expect(source).toContain('id="host-input-probe-dynamic-fixed"');
    expect(source).toContain('bindtap={dynamicFixedTap}');
    expect(source).toContain('Dynamic fixed taps: ${dynamicFixedTapCount}');
    expect(source).toContain('id="host-input-probe-dynamic-prop"');
    expect(source).toContain('bindtap={props.onActivate}');
    expect(source).toContain('Dynamic prop taps: ${props.count}');
  });

  it('distinguishes binding existence from event delivery', () => {
    const initial = createHostInputProbeMatrix('Lynx-for-Web', 100);
    const bound = recordHostEventBinding(
      initial,
      'keydown:Enter',
      'view-control'
    );
    const delivered = recordHostEventArrival(
      bound,
      'keydown:Enter',
      'view-control',
      'key=Enter',
      200
    );

    expect(hostInputProbeSummary(initial)).toEqual({
      total: 25,
      bound: 0,
      delivered: 0,
      bindingOnly: 0,
    });
    expect(hostInputProbeSummary(bound)).toEqual({
      total: 25,
      bound: 1,
      delivered: 0,
      bindingOnly: 1,
    });
    expect(
      delivered.events.find(
        (event) =>
          event.eventName === 'keydown:Enter' &&
          event.sourceName === 'view-control'
      )
    ).toMatchObject({
      bindingExists: true,
      eventArrived: true,
      handlerCallCount: 1,
      lastArrivalMs: 200,
      lastDetail: 'key=Enter',
    });
  });

  it('keeps composing and committed textarea input as separate observations', () => {
    const initial = createHostInputProbeMatrix('Native', 100);
    const composing = recordHostEventArrival(
      initial,
      'input:composing',
      'textarea',
      'value=拼;isComposing=true',
      200
    );
    const committed = recordHostEventArrival(
      composing,
      'input:committed',
      'textarea',
      'value=拼音;isComposing=false',
      300
    );

    expect(
      committed.events
        .filter((event) => event.eventName.startsWith('input:'))
        .map((event) => [event.eventName, event.handlerCallCount])
    ).toEqual([
      ['input:composing', 1],
      ['input:committed', 1],
    ]);
  });

  it('formats a stable human-readable report', () => {
    const matrix = recordHostEventBinding(
      createHostInputProbeMatrix('Lynx-for-Web', 0),
      'focus',
      'view-control'
    );

    expect(formatHostInputProbeReport(matrix)).toContain(
      'Host Input Probe — Lynx-for-Web'
    );
    expect(formatHostInputProbeReport(matrix)).toContain('Bindings: 1/25');
    expect(formatHostInputProbeReport(matrix)).toContain('Delivered: 0/25');
  });
});
