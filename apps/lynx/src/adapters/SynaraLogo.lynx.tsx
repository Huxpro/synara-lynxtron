import type { CSSProperties } from "@lynx-js/types";
import { SYNARA_LOGO_PATHS } from "@synara-web/assets/synaraLogoPath";

import { useTheme } from "./useTheme.lynx";
import "./synara-logo.css";

function synaraLogoContent(color: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 504" fill="none">' +
    SYNARA_LOGO_PATHS.map((path) => '<path d="' + path + '" fill="' + color + '" />').join("") +
    "</svg>"
  );
}

export function SynaraLogo({
  className,
  style,
  "aria-label": ariaLabel,
}: {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly "aria-label"?: string;
}) {
  const { svgColors } = useTheme();
  const classNames = className?.split(/\s+/).filter(Boolean) ?? [];
  const hasSharedSidebarSize = classNames.includes("size-3.5");
  const usesSecondaryForeground = classNames.includes(
    "text-[var(--color-text-foreground-secondary)]",
  );
  const resolvedClassName = [
    "shrink-0",
    "text-foreground",
    ...classNames.filter((value) => value !== "size-3.5" && value !== "pointer-events-none"),
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <view
      className={`${resolvedClassName} LynxBrandMark`}
      // Like the web mark: named only when the caller names it, else hidden.
      accessibility-label={ariaLabel}
      accessibility-elements-hidden={!ariaLabel}
      accessibility-trait="image"
      style={{
        ...(hasSharedSidebarSize ? { width: "14px", height: "14px" } : {}),
        ...style,
      }}
    >
      <svg
        className="LynxBrandMarkLynx"
        content={synaraLogoContent(
          usesSecondaryForeground ? svgColors.secondaryForeground : svgColors.foreground,
        )}
      />
    </view>
  );
}
