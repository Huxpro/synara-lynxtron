import type { ReactNode } from "@lynx-js/react";
import circleCheckSvg from "@synara-central-icons-fill/circle-check.svg?raw";

import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import "./sidebar-thread-status-indicator-elements.css";

function StatusShell({
  label,
  className,
  children,
}: {
  readonly label: string;
  readonly className: string;
  readonly children?: ReactNode;
}) {
  return (
    <view aria-label={label} className={className}>
      {children}
    </view>
  );
}

export function SidebarThreadStatusCompletedElement({
  colorClass: _colorClass,
}: {
  readonly colorClass: string;
}) {
  return (
    <StatusShell
      label="Completed"
      className="LynxSidebarThreadStatus LynxSidebarThreadStatus--completed"
    >
      <svg
        className="LynxSidebarThreadStatusCheck"
        content={colorizeLynxSvg(circleCheckSvg, "#00a240")}
      />
    </StatusShell>
  );
}

export function SidebarThreadStatusRunningElement({ label }: { readonly label: string }) {
  return (
    <StatusShell
      label={label}
      className="LynxSidebarThreadStatus LynxSidebarThreadStatus--running"
    />
  );
}

export function SidebarThreadStatusDotElement({
  label,
  colorClass: _colorClass,
  dotClass,
}: {
  readonly label: string;
  readonly colorClass: string;
  readonly dotClass: string;
}) {
  const tone = dotClass.includes("amber")
    ? "attention"
    : dotClass.includes("indigo") || dotClass.includes("violet")
      ? "decision"
      : "idle";
  return (
    <StatusShell
      label={label}
      className={`LynxSidebarThreadStatus LynxSidebarThreadStatus--${tone}`}
    />
  );
}
