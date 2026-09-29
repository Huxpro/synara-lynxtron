import type { ReactNode } from "@lynx-js/react";

import { useTheme } from "../../adapters/useTheme.lynx";
import { cx, textContent } from "./shared.lynx";
import "./primitives.css";

export function Badge(props: {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly shape?: "default" | "capsule";
  readonly size?: "sm" | "default" | "lg";
  readonly variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "error"
    | "info"
    | "success"
    | "warning";
}) {
  const { svgColors } = useTheme();
  const statusSurface = {
    error: svgColors.statusErrorSurface,
    info: svgColors.statusInfoSurface,
    success: svgColors.statusSuccessSurface,
    warning: svgColors.statusWarningSurface,
  }[props.variant ?? "default"];
  return (
    <view
      className={cx(
        "LxBadge",
        `LxBadge--${props.size ?? "default"}`,
        `LxBadge--${props.variant ?? "default"}`,
        props.shape === "capsule" && "LxBadge--capsule",
        props.className,
      )}
      style={statusSurface ? { backgroundColor: statusSurface } : undefined}
    >
      {textContent(props.children, "LxBadge__text")}
    </view>
  );
}
