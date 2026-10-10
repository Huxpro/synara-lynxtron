import type { ReactNode } from "@lynx-js/react";
import circleCheckSvg from "@synara-central-icons-fill/circle-check.svg?raw";

import {
  IN_BACKGROUND_GLYPH_LABEL_PREFIX,
  SNOOZE_REMINDER_GLYPH_LABEL,
} from "../components/sidebar/sidebarStatusGlyph.logic";
import { Hugeicon } from "../lib/hugeicons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "./useTheme.lynx";
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
    // `accessibility-label` is what the host (and the comparison harness) reads.
    <view
      aria-label={label}
      accessibility-element={true}
      accessibility-label={label}
      accessibility-trait="image"
      className={className}
    >
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

/**
 * Upstream ThreadBackgroundWorkSpinner's ring (components/ThreadRunningSpinner.tsx): a 15-unit
 * canvas, radius 6.5, stroke 1.6, 2-unit dashes over a 4.6-unit period. Drawn at rest.
 */
const BACKGROUND_WORK_RING_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 2.6"/></svg>';

export function SidebarThreadStatusDotElement({
  label,
  colorClass: _colorClass,
  dotClass,
}: {
  readonly label: string;
  readonly colorClass: string;
  readonly dotClass: string;
}) {
  const { activeTheme, svgColors } = useTheme();
  // Upstream SidebarStatusTrailingGlyph: a 12px clock in the info tone for a snooze
  // reminder, a grey dashed ring for background work, a state dot for everything else.
  if (label === SNOOZE_REMINDER_GLYPH_LABEL) {
    return (
      <StatusShell label={label} className="LynxSidebarThreadStatusGlyph">
        <Hugeicon name="ClockIcon" size={12} color={activeTheme.theme.accent} />
      </StatusShell>
    );
  }
  if (label.startsWith(IN_BACKGROUND_GLYPH_LABEL_PREFIX)) {
    return (
      <StatusShell label={label} className="LynxSidebarThreadStatusGlyph">
        <svg
          className="LynxSidebarThreadStatusRing"
          content={colorizeLynxSvg(BACKGROUND_WORK_RING_SVG, svgColors.mutedForeground70)}
        />
      </StatusShell>
    );
  }
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
