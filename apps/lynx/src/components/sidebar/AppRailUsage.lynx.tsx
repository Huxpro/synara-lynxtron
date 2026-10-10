// FILE: AppRailUsage.lynx.tsx
// Purpose: Lynx rendering of upstream's components/AppRailUsage.tsx: a remaining-quota
//   ring per selected provider account above Help; a tap opens Settings → Usage.
// Layer: Lynx presentation. Account selection, rows, tones and the accessible label come
//   from upstream's AppRailUsage.logic, useProviderUsageSummary and the Environment
//   usage summary, so the rail reads the same numbers as Electron's.

import {
  DEFAULT_SERVER_SETTINGS_VIEW,
  type ProviderInstanceId,
  type ProviderKind,
  type ServerProviderUsageSnapshot,
} from "@synara/contracts";
import { deriveProviderInstances } from "@synara/shared/providerInstances";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "@lynx-js/react";

import type { RailUsageWindow } from "@synara-web/appSettings";
import { APP_SETTINGS_STORAGE_KEY } from "@synara-web/appSettingsStorageProjection.logic";
import {
  getRailUsageAccounts,
  railUsageRingTone,
  resolveRailUsageAccounts,
  selectRailUsageRows,
  type RailUsageAccount,
  type RailUsageRingTone,
} from "@synara-web/components/AppRailUsage.logic";
import { resolveEnvironmentProviderUsageSummary } from "@synara-web/components/chat/environment/EnvironmentUsageSection.logic";
import { useProviderUsageSummary } from "@synara-web/hooks/useProviderUsageSummary";
import {
  deriveProviderUsageDisplayRows,
  selectPrimaryProviderUsageDisplayRow,
} from "@synara-web/lib/providerUsageDisplay";
import {
  serverAllProviderUsageQueryOptions,
  serverSettingsQueryOptions,
} from "@synara-web/lib/serverReactQuery";
import { useStore } from "@synara-web/store";
import { createAccountRateLimitThreadsSelector } from "@synara-web/storeSelectors";
import { useTheme } from "../../adapters/useTheme.lynx";
import { OpenAIProviderIcon } from "../OpenAIProviderIcon.lynx";
import { webStorage } from "../../platform/storage";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";

// Tailwind v4 emerald/yellow/orange/red-500 in sRGB, as upstream's RING_TONE_CLASS_NAME
// resolves them (the same values as the palette in app/lynx-overrides.css).
const RING_TONE_COLOR: Record<RailUsageRingTone, string> = {
  healthy: "#00bc7d",
  fair: "#f0b100",
  low: "#ff6900",
  critical: "#fb2c36",
};

// Upstream SINGLE_RING / DOUBLE_RING / RING_SPACING.
const SINGLE_RING = { size: 28, stroke: 2.5, box: 28, icon: 14 };
const DOUBLE_RING = { size: 34, stroke: 2.25, box: 34, icon: 12 };
const RING_SPACING = 4.5;

const selectAccountRateLimitThreads = createAccountRateLimitThreadsSelector();

/** Upstream `RailUsageWindow` literals, default first (`DEFAULT_RAIL_USAGE_WINDOW`). */
const RAIL_USAGE_WINDOWS = [
  "both",
  "fiveHour",
  "weekly",
] as const satisfies readonly RailUsageWindow[];

interface RailUsageSettings {
  readonly selectedIds: ReadonlyArray<ProviderInstanceId>;
  readonly disabledProviders: ReadonlyArray<ProviderKind>;
  readonly window: RailUsageWindow;
  readonly codexHomePath: string | null;
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : null;
}

/**
 * The rail's usage settings, read straight from persisted app settings with upstream's
 * defaults (`AppSettingsSchema`). Read-only on purpose: upstream's `useAppSettings`
 * re-encodes the whole record through its schema on mount, which drops keys this build
 * does not know, and Native must keep them.
 */
function readRailUsageSettings(): RailUsageSettings {
  let record: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(webStorage.getItem(APP_SETTINGS_STORAGE_KEY) ?? "{}");
    if (parsed && typeof parsed === "object") record = parsed as Record<string, unknown>;
  } catch {
    // Unreadable settings fall back to the defaults below.
  }
  const instanceIds = stringList(record.railUsageInstanceIds);
  const legacyProviders = stringList(record.railUsageProviders) ?? ["codex", "claudeAgent"];
  const window = RAIL_USAGE_WINDOWS.find((value) => value === record.railUsageWindow);
  return {
    selectedIds: (instanceIds ?? legacyProviders) as ProviderInstanceId[],
    disabledProviders: (stringList(record.disabledProviders) ?? []) as ProviderKind[],
    window: window ?? RAIL_USAGE_WINDOWS[0],
    codexHomePath:
      typeof record.codexHomePath === "string" && record.codexHomePath.length > 0
        ? record.codexHomePath
        : null,
  };
}

function ringSvg(input: {
  readonly ring: typeof SINGLE_RING;
  readonly rings: ReadonlyArray<{ readonly remainingPercent: number; readonly color: string }>;
  readonly trackColor: string;
}): string {
  const { ring } = input;
  const center = ring.size / 2;
  const outerRadius = (ring.size - ring.stroke) / 2;
  const track = (radius: number) =>
    `<circle cx="${center}" cy="${center}" r="${radius}" stroke="${input.trackColor}" stroke-opacity="0.15" stroke-width="${ring.stroke}" fill="none"/>`;
  const circles =
    input.rings.length === 0
      ? track(outerRadius)
      : input.rings
          .map((entry, index) => {
            const radius = outerRadius - index * RING_SPACING;
            const circumference = 2 * Math.PI * radius;
            const filled =
              (Math.max(0, Math.min(100, entry.remainingPercent)) / 100) * circumference;
            return (
              track(radius) +
              (entry.remainingPercent > 0
                ? `<circle cx="${center}" cy="${center}" r="${radius}" stroke="${entry.color}" stroke-width="${ring.stroke}" stroke-linecap="round" stroke-dasharray="${filled} ${circumference}" fill="none" transform="rotate(-90 ${center} ${center})"/>`
                : "")
            );
          })
          .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ring.size} ${ring.size}">${circles}</svg>`;
}

function AppRailUsageRing(props: {
  readonly account: RailUsageAccount;
  readonly snapshot: ServerProviderUsageSnapshot | undefined;
  readonly window: RailUsageWindow;
  readonly codexHomePath: string | null;
  readonly onOpenUsageSettings: () => void;
}) {
  const { svgColors } = useTheme();
  const { instance, label } = props.account;
  const provider = instance.driver;
  const threads = useStore(selectAccountRateLimitThreads);
  // Upstream useProviderUsageMenuModel, minus the menu-only fields.
  const usageSummary = useProviderUsageSummary({
    provider,
    instanceId: instance.instanceId,
    threads,
    codexHomePath: props.codexHomePath,
    providerSnapshot: props.snapshot ?? null,
    fetchOpenUsageData: false,
  });
  const rows = deriveProviderUsageDisplayRows(usageSummary.rateLimits);
  const summary = resolveEnvironmentProviderUsageSummary({
    providerName: label,
    rows,
    snapshot: props.snapshot,
    hasUsageLines: usageSummary.usageLines.length > 0,
  });
  const accessibleLabel = `${summary.ariaLabel}. Open usage settings`;
  const interaction = useLynxInteractiveState({
    baseClassName: "AppRailButton AppRailUsageButton",
    accessibleLabel,
    onActivate: props.onOpenUsageSettings,
  });
  const unavailable = props.snapshot?.status === "error";
  if (!unavailable && rows.length === 0 && usageSummary.usageLines.length === 0) return null;
  const rings = selectRailUsageRows(
    rows,
    selectPrimaryProviderUsageDisplayRow(rows),
    props.window,
  ).map((row) => ({
    remainingPercent: row.remainingPercent,
    color: RING_TONE_COLOR[railUsageRingTone(row.remainingPercent)],
  }));
  const ring = rings.length > 1 ? DOUBLE_RING : SINGLE_RING;
  return (
    <view
      className={interaction.className}
      aria-label={accessibleLabel}
      {...interaction.eventProps}
    >
      <svg
        className="AppRailUsageRing"
        style={{ width: `${ring.box}px`, height: `${ring.box}px` }}
        content={ringSvg({ ring, rings, trackColor: svgColors.sectionLabelForeground })}
      />
      <view
        className={`AppRailUsageIcon${unavailable ? " AppRailUsageIcon--unavailable" : ""}`}
        style={{ width: `${ring.icon}px`, height: `${ring.icon}px` }}
      >
        <OpenAIProviderIcon provider={provider} />
      </view>
    </view>
  );
}

function AppRailUsageRings(props: { readonly onOpenUsageSettings: () => void }) {
  const [settings] = useState(readRailUsageSettings);
  const settingsQuery = useQuery(serverSettingsQueryOptions());
  const accounts = resolveRailUsageAccounts(
    settings.selectedIds,
    getRailUsageAccounts(
      deriveProviderInstances(settingsQuery.data ?? DEFAULT_SERVER_SETTINGS_VIEW),
      settings.disabledProviders,
    ),
  );
  const usageQuery = useQuery(serverAllProviderUsageQueryOptions({ enabled: accounts.length > 0 }));
  return (
    <>
      {accounts.map((account) => (
        <AppRailUsageRing
          key={account.instance.instanceId}
          account={account}
          snapshot={(usageQuery.data ?? []).find(
            (entry) =>
              entry.provider === account.instance.driver &&
              (entry.instanceId ?? entry.provider) === account.instance.instanceId,
          )}
          window={settings.window}
          codexHomePath={settings.codexHomePath}
          onOpenUsageSettings={props.onOpenUsageSettings}
        />
      ))}
    </>
  );
}

/** Sits above Help: a ring per selected account, with the windows chosen in Settings → Usage. */
export function AppRailUsage(props: { readonly onOpenUsageSettings: () => void }) {
  // Persisted settings and the usage queries live on the background thread: nothing on
  // the main-thread first frame, as upstream shows nothing until usage has loaded.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    "background only";
    setMounted(true);
  }, []);
  return mounted ? <AppRailUsageRings onOpenUsageSettings={props.onOpenUsageSettings} /> : null;
}
