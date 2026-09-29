import type { ReactNode } from "@lynx-js/react";

import { Button, type ButtonProps } from "./button.lynx";

export interface IconButtonProps extends Omit<ButtonProps, "aria-label" | "children"> {
  readonly children: ReactNode;
  readonly label: string;
  readonly tooltip?: ReactNode;
  readonly tooltipSide?: "top" | "bottom" | "left" | "right";
}

export function IconButton({
  children,
  label,
  tooltip: _tooltip,
  tooltipSide: _tooltipSide,
  size = "icon-xs",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <Button {...props} aria-label={label} size={size} variant={variant}>
      {children}
    </Button>
  );
}
