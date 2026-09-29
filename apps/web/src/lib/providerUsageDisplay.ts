// FILE: providerUsageDisplay.ts
// Purpose: Single source of truth for provider usage rows shown in Settings,
// the chat header usage chip, and compact environment/Local popovers.

import {
  deriveVisibleRateLimitRows,
  formatRateLimitRemainingPercent,
  type ProviderRateLimit,
  type VisibleRateLimitRow,
} from "~/lib/rateLimits";
import {
  deriveProviderUsageLimitDisplay,
  type ProviderUsageTone,
  type UsagePaceSummary,
} from "@synara/shared/providerUsageDisplay";

export type { ProviderUsageTone };

export interface ProviderUsageDisplayRow extends VisibleRateLimitRow {
  remainingLabel: string;
  leftText: string;
  resetText: string | null;
  pace: UsagePaceSummary | null;
  markerPercent: number | null;
  remainingTone: ProviderUsageTone;
  paceTone: ProviderUsageTone;
}

export interface ProviderUsageProgressTrackProps {
  label: string;
  remainingPercent: number;
  markerPercent: number | null;
  fillClassName: string;
  markerClassName: string;
}

export interface ProviderUsagePaceDetails {
  amountText: string | null;
  etaText: string | null;
}

export const PROVIDER_USAGE_TONE_CLASS_NAME: Record<ProviderUsageTone, string> = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function providerUsageToneClassName(tone: ProviderUsageTone): string {
  return PROVIDER_USAGE_TONE_CLASS_NAME[tone];
}

export function providerUsageProgressTrackProps(
  row: ProviderUsageDisplayRow,
): ProviderUsageProgressTrackProps {
  return {
    label: `${row.label} remaining`,
    remainingPercent: row.remainingPercent,
    markerPercent: row.markerPercent,
    fillClassName: providerUsageToneClassName(row.remainingTone),
    markerClassName: providerUsageToneClassName(row.paceTone),
  };
}

export function providerUsagePaceDetails(
  row: ProviderUsageDisplayRow,
): ProviderUsagePaceDetails | null {
  if (!row.pace?.amountText && !row.pace?.etaText) {
    return null;
  }
  return {
    amountText: row.pace.amountText,
    etaText: row.pace.etaText,
  };
}

export function deriveProviderUsageDisplayRow(row: VisibleRateLimitRow): ProviderUsageDisplayRow {
  const display = deriveProviderUsageLimitDisplay({
    window: row.label,
    usedPercent: 100 - row.remainingPercent,
    ...(row.resetsAt ? { resetsAt: row.resetsAt } : {}),
    ...(row.windowDurationMins !== undefined ? { windowDurationMins: row.windowDurationMins } : {}),
  });
  const remainingPercent = display.remainingPercent ?? row.remainingPercent;
  const remainingLabel = formatRateLimitRemainingPercent(remainingPercent);

  return {
    ...row,
    remainingPercent,
    remainingLabel,
    leftText: display.leftText,
    resetText: display.resetText,
    pace: display.pace,
    markerPercent: display.markerPercent,
    remainingTone: display.remainingTone,
    paceTone: display.paceTone,
  };
}

export function deriveProviderUsageDisplayRows(
  rateLimits: ReadonlyArray<ProviderRateLimit>,
): ProviderUsageDisplayRow[] {
  return deriveVisibleRateLimitRows(rateLimits).map(deriveProviderUsageDisplayRow);
}

export function selectPrimaryProviderUsageDisplayRow(
  rows: ReadonlyArray<ProviderUsageDisplayRow>,
): ProviderUsageDisplayRow | null {
  return rows.reduce<ProviderUsageDisplayRow | null>((selected, row) => {
    if (!selected || row.remainingPercent < selected.remainingPercent) {
      return row;
    }
    return selected;
  }, null);
}
