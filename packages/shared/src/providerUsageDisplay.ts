import type { ServerProviderUsageLimit } from "@synara/contracts";

export type ProviderUsageTone = "healthy" | "warning" | "danger";
export type UsagePaceStatus = "ahead" | "on-track" | "behind";

export interface UsagePaceSummary {
  status: UsagePaceStatus;
  expectedRemainingPercent: number;
  amountText: string | null;
  etaText: string | null;
}

export interface ProviderUsageLimitDisplay {
  label: string;
  remainingPercent: number | null;
  leftText: string;
  resetText: string | null;
  pace: UsagePaceSummary | null;
  markerPercent: number | null;
  remainingTone: ProviderUsageTone;
  paceTone: ProviderUsageTone;
}

const MIN_PROJECTION_ELAPSED_FRACTION = 0.05;

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function compactDuration(deltaMs: number): string | null {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
    return null;
  }
  const totalMinutes = Math.floor(deltaMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "<1m";
}

function paceStatus(usedPercent: number, projectedUsedPercent: number): UsagePaceStatus {
  if (usedPercent >= 100) {
    return "behind";
  }
  if (usedPercent === 0 || projectedUsedPercent <= 80) {
    return "ahead";
  }
  if (projectedUsedPercent <= 100) {
    return "on-track";
  }
  return "behind";
}

function reserveOrDeficitText(deltaPercent: number): string | null {
  const rounded = Math.round(Math.abs(deltaPercent));
  if (rounded <= 0) {
    return null;
  }
  return deltaPercent > 0 ? `${rounded}% in deficit` : `${rounded}% in reserve`;
}

function remainingTone(remainingPercent: number): ProviderUsageTone {
  if (remainingPercent <= 10) return "danger";
  if (remainingPercent <= 25) return "warning";
  return "healthy";
}

function paceTone(status: UsagePaceStatus): ProviderUsageTone {
  switch (status) {
    case "behind":
      return "danger";
    case "on-track":
      return "warning";
    case "ahead":
      return "healthy";
  }
}

function windowDurationMins(limit: ServerProviderUsageLimit): number | undefined {
  if (limit.windowDurationMins !== undefined) {
    return limit.windowDurationMins;
  }
  if (limit.window === "5h") {
    return 300;
  }
  if (limit.window === "Weekly") {
    return 10_080;
  }
  return undefined;
}

function normalizedWindowLabel(limit: ServerProviderUsageLimit): string {
  const durationMins = windowDurationMins(limit);
  if (durationMins === 300) return "5h";
  if (durationMins === 10_080) return "Weekly";
  return limit.window;
}

export function deriveUsagePace(input: {
  nowMs?: number | undefined;
  remainingPercent: number;
  resetsAt?: string | undefined;
  windowDurationMins?: number | undefined;
}): UsagePaceSummary | null {
  if (!input.resetsAt || input.windowDurationMins === undefined) {
    return null;
  }
  const resetMs = Date.parse(input.resetsAt);
  const durationMs = input.windowDurationMins * 60_000;
  const nowMs = input.nowMs ?? Date.now();
  if (!Number.isFinite(resetMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }

  const periodStartMs = resetMs - durationMs;
  const elapsedMs = nowMs - periodStartMs;
  if (elapsedMs <= 0 || nowMs >= resetMs) {
    return null;
  }

  const usedPercent = clampPercent(100 - input.remainingPercent);
  const elapsedFraction = Math.max(elapsedMs / durationMs, MIN_PROJECTION_ELAPSED_FRACTION);
  const expectedUsedPercent = clampPercent(elapsedFraction * 100);
  const expectedRemainingPercent = clampPercent(100 - expectedUsedPercent);
  const projectedUsedPercent = usedPercent === 0 ? 0 : usedPercent / elapsedFraction;
  const status = paceStatus(usedPercent, projectedUsedPercent);
  const amountText = reserveOrDeficitText(usedPercent - expectedUsedPercent);

  let etaText = status === "behind" ? null : "Lasts until reset";
  if (status === "behind") {
    const ratePercentPerMs = projectedUsedPercent / durationMs;
    const etaMs = ratePercentPerMs > 0 ? (100 - usedPercent) / ratePercentPerMs : 0;
    const remainingMs = resetMs - nowMs;
    const durationText = etaMs > 0 && etaMs < remainingMs ? compactDuration(etaMs) : null;
    etaText =
      usedPercent >= 100 ? "Limit reached" : durationText ? `Runs out in ${durationText}` : null;
  }

  return {
    status,
    expectedRemainingPercent,
    amountText,
    etaText,
  };
}

export function formatProviderUsageResetCountdown(
  resetsAt: string,
  nowMs = Date.now(),
): string {
  const resetMs = Date.parse(resetsAt);
  if (Number.isNaN(resetMs)) {
    return "";
  }
  const diffMs = resetMs - nowMs;
  if (diffMs <= 0) {
    return "Resets soon";
  }
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `Resets in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `Resets in ${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `Resets in ${minutes}m`;
  }
  return "Resets soon";
}

export function deriveProviderUsageLimitDisplay(
  limit: ServerProviderUsageLimit,
  nowMs = Date.now(),
): ProviderUsageLimitDisplay {
  const remainingPercent =
    limit.usedPercent === undefined ? null : clampPercent(100 - limit.usedPercent);
  const usageRemainingTone = remainingTone(remainingPercent ?? 100);
  const pace =
    remainingPercent === null
      ? null
      : deriveUsagePace({
          nowMs,
          remainingPercent,
          resetsAt: limit.resetsAt,
          windowDurationMins: windowDurationMins(limit),
        });

  return {
    label: normalizedWindowLabel(limit),
    remainingPercent,
    leftText: remainingPercent === null ? "Usage reported" : `${Math.round(remainingPercent)}% left`,
    resetText: limit.resetsAt
      ? formatProviderUsageResetCountdown(limit.resetsAt, nowMs) || null
      : null,
    pace,
    markerPercent: pace ? clampPercent(pace.expectedRemainingPercent) : null,
    remainingTone: usageRemainingTone,
    paceTone: pace ? paceTone(pace.status) : usageRemainingTone,
  };
}
