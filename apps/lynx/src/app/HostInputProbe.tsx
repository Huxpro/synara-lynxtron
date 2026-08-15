import { useEffect, useState } from '@lynx-js/react';

import {
  createHostInputProbeMatrix,
  hostInputProbeSummary,
  recordHostEventArrival,
  recordHostEventBinding,
  type HostInputProbeMatrix,
} from './HostInputProbe.logic';
import { Button } from '../components/ui/button';
import './HostInputProbe.css';

declare const NativeModules: {
  readonly bridge?: {
    readonly call?: (
      method: string,
      params: Record<string, unknown>,
      callback: (result: unknown) => void
    ) => void;
  };
};

const BINDINGS = [
  ['focus', 'view-control'],
  ['blur', 'view-control'],
  ['keydown:Enter', 'view-control'],
  ['keydown:Space', 'view-control'],
  ['keydown:ArrowDown', 'view-control'],
  ['keydown:ArrowUp', 'view-control'],
  ['keydown:Escape', 'view-control'],
  ['keydown:Tab', 'view-control'],
  ['mouseenter', 'view-control'],
  ['mouseleave', 'view-control'],
  ['mousedown', 'view-control'],
  ['mouseup', 'view-control'],
  ['tap', 'view-control'],
  ['focus', 'textarea'],
  ['blur', 'textarea'],
  ['keydown:Enter', 'textarea'],
  ['keydown:ArrowUp', 'textarea'],
  ['keydown:ArrowDown', 'textarea'],
  ['keydown:Escape', 'textarea'],
  ['input', 'textarea'],
  ['input:composing', 'textarea'],
  ['input:committed', 'textarea'],
  ['scroll', 'scroll-view'],
  ['global:window-focus', 'host'],
  ['global:window-blur', 'host'],
] as const;

function createBoundMatrix(): HostInputProbeMatrix {
  return BINDINGS.reduce(
    (matrix, [eventName, sourceName]) =>
      recordHostEventBinding(matrix, eventName, sourceName),
    createHostInputProbeMatrix(
      process.env.SYNARA_HOST_INPUT_PROBE_RUNTIME || 'Unknown runtime'
    )
  );
}

function keyEventName(key: string): string {
  if (key === ' ' || key === 'Spacebar') return 'keydown:Space';
  return `keydown:${key}`;
}

function publishMatrix(matrix: HostInputProbeMatrix): void {
  NativeModules.bridge?.call?.('hostInputProbePublish', { matrix }, () => {});
}

function DynamicPropControl(props: {
  readonly count: number;
  readonly onActivate: () => void;
}) {
  return (
    <view
      id="host-input-probe-dynamic-prop"
      className="HostInputProbeControl"
      accessibility-element={true}
      accessibility-label="Dynamic component prop event control"
      bindtap={props.onActivate}
    >
      <text>{`Dynamic prop taps: ${props.count}`}</text>
    </view>
  );
}

export function HostInputProbe() {
  const [matrix, setMatrix] = useState(createBoundMatrix);
  const [dynamicSpreadTapCount, setDynamicSpreadTapCount] = useState(0);
  const [dynamicFixedTapCount, setDynamicFixedTapCount] = useState(0);
  const [dynamicPropTapCount, setDynamicPropTapCount] = useState(0);
  const [lynxButtonTapCount, setLynxButtonTapCount] = useState(0);
  const [postHydrationMounted, setPostHydrationMounted] = useState(false);
  const [postHydrationTapCount, setPostHydrationTapCount] = useState(0);
  const summary = hostInputProbeSummary(matrix);
  const dynamicFixedTap = () => {
    'background only';
    setDynamicFixedTapCount((count) => count + 1);
  };
  const dynamicSpreadEvents = {
    bindtap: () => {
      'background only';
      setDynamicSpreadTapCount((count) => count + 1);
    },
  };

  const record = (
    eventName: string,
    sourceName: string,
    detail?: string
  ) => {
    'background only';
    setMatrix((current) =>
      recordHostEventArrival(current, eventName, sourceName, detail)
    );
  };

  useEffect(() => {
    'background only';
    publishMatrix(matrix);
  }, [matrix]);

  useEffect(() => {
    'background only';
    setPostHydrationMounted(true);
  }, []);

  useEffect(() => {
    'background only';
    const emitter = lynx.getJSModule('GlobalEventEmitter');
    const onHostFocus = () =>
      record('global:window-focus', 'host', 'host window focus');
    const onHostBlur = () =>
      record('global:window-blur', 'host', 'host window blur');
    emitter.addListener('host-input-probe:window-focus', onHostFocus);
    emitter.addListener('host-input-probe:window-blur', onHostBlur);
    return () => {
      emitter.removeListener('host-input-probe:window-focus', onHostFocus);
      emitter.removeListener('host-input-probe:window-blur', onHostBlur);
    };
  }, []);

  return (
    <view className="HostInputProbeRoot">
      <text className="HostInputProbeTitle">P9-D1 Host Input Probe</text>
      <text className="HostInputProbeSummary" id="host-input-probe-summary">
        {`bound=${summary.bound}/${summary.total} delivered=${summary.delivered}/${summary.total}`}
      </text>
      <view
        id="host-input-probe-dynamic-spread"
        className="HostInputProbeControl"
        accessibility-element={true}
        accessibility-label="Dynamic spread event control"
        {...dynamicSpreadEvents}
      >
        <text>{`Dynamic spread taps: ${dynamicSpreadTapCount}`}</text>
      </view>
      <view
        id="host-input-probe-dynamic-fixed"
        className="HostInputProbeControl"
        accessibility-element={true}
        accessibility-label="Dynamic fixed event control"
        bindtap={dynamicFixedTap}
      >
        <text>{`Dynamic fixed taps: ${dynamicFixedTapCount}`}</text>
      </view>
      <DynamicPropControl
        count={dynamicPropTapCount}
        onActivate={() => setDynamicPropTapCount((count) => count + 1)}
      />
      <Button
        aria-label="Lynx button event control"
        className="HostInputProbeControl"
        onClick={() => setLynxButtonTapCount((count) => count + 1)}
      >
        {`Lynx button taps: ${lynxButtonTapCount}`}
      </Button>
      {postHydrationMounted ? (
        <view
          id="host-input-probe-post-hydration"
          className="HostInputProbeControl"
          accessibility-element={true}
          accessibility-label="Post-hydration event control"
          bindtap={() => {
            'background only';
            setPostHydrationTapCount((count) => count + 1);
          }}
        >
          <text>{`Post-hydration taps: ${postHydrationTapCount}`}</text>
        </view>
      ) : null}
      <view
        id="host-input-probe-view-control"
        className="HostInputProbeControl"
        focusable={true}
        accessibility-element={true}
        accessibility-label="Host input probe control"
        bindfocus={() => record('focus', 'view-control')}
        bindblur={() => record('blur', 'view-control')}
        bindkeydown={(event: { readonly key: string }) =>
          record(keyEventName(event.key), 'view-control', `key=${event.key}`)
        }
        bindmouseenter={() => record('mouseenter', 'view-control')}
        bindmouseleave={() => record('mouseleave', 'view-control')}
        bindmousedown={() => record('mousedown', 'view-control')}
        bindmouseup={() => record('mouseup', 'view-control')}
        bindtap={() => record('tap', 'view-control')}
      >
        <text>Focusable view control</text>
      </view>
      <textarea
        id="host-input-probe-textarea"
        className="HostInputProbeTextarea"
        accessibility-element={true}
        accessibility-label="Host input probe textarea"
        focusable={true}
        placeholder="Type text or use IME"
        maxlines={3}
        send-composing-input={true}
        bindfocus={() => record('focus', 'textarea')}
        bindblur={() => record('blur', 'textarea')}
        catchkeydown={(event: { readonly key: string }) =>
          record(keyEventName(event.key), 'textarea', `key=${event.key}`)
        }
        bindinput={(event) => {
          const detail = `value=${event.detail.value};isComposing=${String(
            event.detail.isComposing
          )}`;
          record('input', 'textarea', detail);
          record(
            event.detail.isComposing
              ? 'input:composing'
              : 'input:committed',
            'textarea',
            detail
          );
        }}
      />
      <scroll-view
        id="host-input-probe-scroll"
        className="HostInputProbeScroll"
        scroll-orientation="vertical"
        scroll-y={true}
        bindscroll={(event) =>
          record(
            'scroll',
            'scroll-view',
            JSON.stringify(event.detail ?? {})
          )
        }
      >
        <view className="HostInputProbeScrollContent">
          <text>Scroll start</text>
          <text>Spacer one</text>
          <text>Spacer two</text>
          <text>Spacer three</text>
          <text>Scroll end</text>
        </view>
      </scroll-view>
      <view className="HostInputProbeMatrix">
        {matrix.events.map((event) => (
          <view
            className="HostInputProbeRow"
            key={`${event.sourceName}:${event.eventName}`}
          >
            <text className="HostInputProbeEvent">
              {`${event.sourceName} / ${event.eventName}`}
            </text>
            <text
              className="HostInputProbeResult"
              data-event-name={event.eventName}
              data-source-name={event.sourceName}
              data-binding={event.bindingExists ? 'yes' : 'no'}
              data-arrived={event.eventArrived ? 'yes' : 'no'}
              data-calls={String(event.handlerCallCount)}
            >
              {event.eventArrived
                ? `arrived ×${event.handlerCallCount}`
                : event.bindingExists
                  ? 'bound'
                  : 'missing'}
            </text>
          </view>
        ))}
      </view>
    </view>
  );
}
