import type { ComponentProps, ReactNode } from "@lynx-js/react";

import { cx } from "./shared.lynx";
import "./primitives.css";

type NativeScrollProps = ComponentProps<"scroll-view">;

export interface ScrollAreaProps extends Omit<NativeScrollProps, "children" | "className"> {
  children?: ReactNode;
  className?: string;
  scrollFade?: boolean;
  scrollbarGutter?: boolean;
  hideScrollbars?: boolean;
  orientation?: "vertical" | "horizontal";
}

export function ScrollArea({
  children,
  className,
  scrollFade = false,
  scrollbarGutter = false,
  hideScrollbars = false,
  orientation = "vertical",
  ...props
}: ScrollAreaProps) {
  return (
    <scroll-view
      {...props}
      className={cx(
        "LxScrollArea",
        scrollFade && "LxScrollArea--fade",
        scrollbarGutter && "LxScrollArea--gutter",
        className,
      )}
      scroll-orientation={orientation}
      scroll-bar-enable={!hideScrollbars}
    >
      {children}
    </scroll-view>
  );
}

// Native scroll-view owns its scrollbar. Keep the Web export/call-site surface;
// a separately rendered scrollbar would duplicate the platform affordance.
export function ScrollBar(_props: { className?: string; orientation?: "vertical" | "horizontal" }) {
  return null;
}
