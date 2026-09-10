import type { ReactNode } from '@lynx-js/react';
import { RIGHT_DOCK_MIN_WIDTH_PX } from '@synara/shared/rightDock';

import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import './thread-right-dock-host.css';

export function ThreadRightDockHost(props: {
  readonly availableWidth: number;
  readonly children?: ReactNode;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly tabs: ReactNode;
}) {
  return (
    <ResizableRightPanel
      availableWidth={props.availableWidth}
      className={`ThreadRightDockHost${
        props.open ? ' ThreadRightDockHost--open' : ' ThreadRightDockHost--closed'
      }`}
      defaultWidth={
        props.availableWidth > 0
          ? Math.max(RIGHT_DOCK_MIN_WIDTH_PX, Math.round(props.availableWidth / 2))
          : RIGHT_DOCK_MIN_WIDTH_PX
      }
      maxWidth={960}
      minimumMainWidth={320}
      minWidth={RIGHT_DOCK_MIN_WIDTH_PX}
      onWidthChange={props.onWidthChange}
      resizable
    >
      {props.tabs}
      <view className="ThreadRightDockHostBody">{props.children}</view>
    </ResizableRightPanel>
  );
}
