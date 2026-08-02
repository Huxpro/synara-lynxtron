import { describe, expect, it } from '@rstest/core';

import {
  createHostInputProbeMatrix,
  formatHostInputProbeReport,
  hostInputProbeSummary,
  recordHostEventArrival,
  recordHostEventBinding,
} from './HostInputProbe.logic';

describe('host input probe matrix', () => {
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
