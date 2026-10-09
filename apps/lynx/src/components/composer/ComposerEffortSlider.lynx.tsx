import { useRef, useState } from "@lynx-js/react";

import {
  readLynxSidebarPointerX,
  type LynxSidebarPointerEvent,
} from "../../app/sidebarResize.lynx.logic";
import {
  EFFORT_SLIDER_FALLBACK_TRACK_WIDTH,
  EFFORT_SLIDER_THUMB_SIZE,
  resolveEffortSliderDragIndex,
  resolveEffortSliderStep,
  resolveEffortSliderThumbLeft,
} from "./effortSlider.logic";

/**
 * Electron's stepped `Slider` (size large, step marks) for the model picker's effort
 * ladder: a tinted track filled to the thumb, one dot per stop, and a white thumb. Each
 * stop owns a hit zone; pressing one picks it and dragging walks whole steps from there.
 */
export function ComposerEffortSlider(props: {
  readonly labels: ReadonlyArray<string>;
  readonly index: number;
  readonly disabled?: boolean;
  readonly onIndexChange: (index: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(EFFORT_SLIDER_FALLBACK_TRACK_WIDTH);
  const dragRef = useRef<{ readonly startIndex: number; readonly startX: number } | null>(null);
  const stopCount = props.labels.length;
  const step = resolveEffortSliderStep(trackWidth, stopCount);
  const thumbLeft = resolveEffortSliderThumbLeft(props.index, step);
  const half = EFFORT_SLIDER_THUMB_SIZE / 2;

  const press = (index: number, event: LynxSidebarPointerEvent) => {
    "background only";
    if (props.disabled) return;
    const x = readLynxSidebarPointerX(event);
    dragRef.current = x === null ? null : { startIndex: index, startX: x };
    if (index !== props.index) props.onIndexChange(index);
  };
  const move = (event: LynxSidebarPointerEvent) => {
    "background only";
    const drag = dragRef.current;
    if (!drag || props.disabled) return;
    const x = readLynxSidebarPointerX(event);
    if (x === null) return;
    const next = resolveEffortSliderDragIndex({ ...drag, x, step, stopCount });
    if (next !== props.index) props.onIndexChange(next);
  };
  const release = () => {
    "background only";
    dragRef.current = null;
  };

  return (
    <view
      className={`ComposerEffortSliderLynx${props.disabled ? " ComposerEffortSliderLynx--disabled" : ""}`}
      bindlayoutchange={(event: { readonly detail?: { readonly width?: number } }) => {
        const width = event.detail?.width;
        if (typeof width === "number" && width > 0 && width !== trackWidth) setTrackWidth(width);
      }}
      bindmousemove={move}
      bindmouseup={release}
      bindmouseleave={release}
      bindtouchmove={move}
      bindtouchend={release}
      bindtouchcancel={release}
    >
      <view className="ComposerEffortSliderTrackLynx">
        <view className="ComposerEffortSliderTrackTintLynx" />
        <view
          className="ComposerEffortSliderFillLynx"
          style={{ width: `${Math.round(thumbLeft + half)}px` }}
        />
      </view>
      {props.labels.map((label, index) => (
        <view
          key={`dot:${label}`}
          className={`ComposerEffortSliderDotLynx${
            index <= props.index ? " ComposerEffortSliderDotLynx--reached" : ""
          }`}
          style={{ left: `${Math.round(resolveEffortSliderThumbLeft(index, step) + half - 2)}px` }}
        />
      ))}
      {/* The thumb carries the slider's name and value, as Base UI's thumb input does. */}
      <view
        className="ComposerEffortSliderThumbLynx"
        style={{ left: `${Math.round(thumbLeft)}px` }}
        accessibility-element={true}
        accessibility-label="Reasoning effort"
        accessibility-value={props.labels[props.index] ?? ""}
        accessibility-trait="adjustable"
        aria-label="Reasoning effort"
      />
      {props.labels.map((label, index) => {
        const center = resolveEffortSliderThumbLeft(index, step) + half;
        const left = index === 0 ? 0 : center - step / 2;
        const right = index === stopCount - 1 ? trackWidth : center + step / 2;
        return (
          <view
            key={`hit:${label}`}
            className="ComposerEffortSliderHitLynx"
            style={{ left: `${Math.round(left)}px`, width: `${Math.round(right - left)}px` }}
            bindmousedown={(event: LynxSidebarPointerEvent) => press(index, event)}
            bindtouchstart={(event: LynxSidebarPointerEvent) => press(index, event)}
          />
        );
      })}
    </view>
  );
}
