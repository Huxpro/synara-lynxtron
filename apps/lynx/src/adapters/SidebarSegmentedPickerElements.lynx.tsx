import type { CSSProperties } from '@lynx-js/types';
import type { ReactNode } from '@lynx-js/react';

import { useLynxInteractiveState } from '../components/ui/interactive-state.lynx';
import './sidebar-segmented-picker-elements.css';

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarSegmentedPickerFrameElement({ children }: ChildrenProps) {
  return <view className="SidebarSegmentedFrame">{children}</view>;
}

export function SidebarSegmentedPickerTrackElement({ children }: ChildrenProps) {
  return <view className="SidebarSegmentedTrack">{children}</view>;
}

export function SidebarSegmentedPickerThumbElement({
  hidden,
  left,
  width,
}: {
  readonly hidden: boolean;
  readonly left: string;
  readonly width: string;
}) {
  return (
    <view
      className={`SidebarSegmentedThumb${hidden ? ' SidebarSegmentedThumb--hidden' : ''}`}
      style={{ left, width } as CSSProperties}
    />
  );
}

export function SidebarSegmentButtonElement({
  active,
  onPrewarm,
  onActivate,
  children,
}: ChildrenProps & {
  readonly active: boolean;
  readonly onPrewarm: () => void;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SidebarSegmentedButton${
      active ? ' SidebarSegmentedButton--active' : ''
    }`,
    onActivate,
  });
  const {
    bindmouseenter,
    bindtouchstart,
    ...remainingEventProps
  } = interaction.eventProps;
  return (
    <view
      className={interaction.className}
      aria-pressed={active}
      {...remainingEventProps}
      bindmouseenter={() => {
        onPrewarm();
        bindmouseenter?.();
      }}
      bindtouchstart={() => {
        onPrewarm();
        bindtouchstart?.();
      }}
    >
      {children}
    </view>
  );
}

export function SidebarSegmentLabelElement({
  translateX,
  children,
}: ChildrenProps & { readonly translateX: string }) {
  return (
    <text
      className="SidebarSegmentedLabel"
      style={{ transform: `translateX(${translateX})` } as CSSProperties}
    >
      {children}
    </text>
  );
}
