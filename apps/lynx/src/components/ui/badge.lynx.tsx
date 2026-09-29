import type { ReactNode } from "@lynx-js/react";

import { useTheme } from "../../adapters/useTheme.lynx";
import { cx, textContent } from "./shared.lynx";
import "./primitives.css";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "error"
  | "info"
  | "success"
  | "warning";

export function Badge(props: {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly shape?: "default" | "capsule";
  readonly size?: "sm" | "default" | "lg";
  readonly variant?: BadgeVariant;
}) {
  const { svgColors } = useTheme();
  const statusSurfaces: Partial<Record<BadgeVariant, string>> = {
    error: svgColors.statusErrorSurface,
    info: svgColors.statusInfoSurface,
    success: svgColors.statusSuccessSurface,
    warning: svgColors.statusWarningSurface,
  };
  const statusSurface = statusSurfaces[props.variant ?? "default"];
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
