import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ServerProviderUsageSnapshot } from '@synara/contracts';
import {
  PROVIDER_USAGE_PROVIDERS,
  mergeProviderUsageRefresh,
  providerUsageDisplayName,
  providerUsageNeedsAuthDetail,
} from '@synara/shared/providerUsage';
import { deriveProviderUsageLimitDisplay } from '@synara/shared/providerUsageDisplay';

import { SettingsHeadingElement } from '../adapters/SettingsHeadingElement.lynx';
import { Button } from '../components/ui/button';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { RefreshCwIcon, TriangleAlertIcon } from '../lib/icons.lynx';
import './settings-usage-panel.css';

const SETTINGS_PROVIDER_USAGE_QUERY_KEY = ['settings-provider-usage'] as const;

async function loadProviderUsage(forceRefresh = false) {
  'background only';
  const { fetchAllProviderUsage } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient.lynx'
  );
  return fetchAllProviderUsage(forceRefresh ? { forceRefresh: true } : {});
}

function missingSnapshot(
  provider: (typeof PROVIDER_USAGE_PROVIDERS)[number]
): ServerProviderUsageSnapshot {
  return {
    provider,
    updatedAt: new Date(0).toISOString(),
    limits: [],
    usageLines: [],
    source: 'unavailable',
    status: 'error',
    detail: 'Usage is currently unavailable.',
  };
}

function statusLabel(snapshot: ServerProviderUsageSnapshot): string | null {
  if ((snapshot.status ?? 'ok') === 'ok') return snapshot.planName ?? null;
  if (snapshot.status === 'needs-auth') return 'Not signed in';
  if (snapshot.status === 'unsupported') return 'Unsupported';
  return 'Unavailable';
}

function UsageLimitRow(props: {
  readonly limit: ServerProviderUsageSnapshot['limits'][number];
  readonly provider: ServerProviderUsageSnapshot['provider'];
}) {
  const display = deriveProviderUsageLimitDisplay(props.limit);
  const paceAmountText = display.pace?.amountText ?? null;
  const paceEtaText = display.pace?.etaText ?? null;
  const hasPaceDetails = paceAmountText !== null || paceEtaText !== null;

  return (
    <view
      className="SettingsUsageLimit"
      key={`${props.provider}:${props.limit.window}`}
    >
      <view className="SettingsUsageLimitTitle">
        <text className="SettingsUsageLabel">{display.label}</text>
        <view
          className={`SettingsUsagePaceDot SettingsUsageTone--${display.paceTone}`}
        />
      </view>
      {display.remainingPercent === null ? null : (
        <view
          className="SettingsUsageTrack"
          aria-label={`${props.limit.window} remaining`}
          aria-valuenow={Math.round(display.remainingPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          accessibility-element
          accessibility-label={`${display.label}: ${Math.round(display.remainingPercent)}% remaining`}
          accessibility-traits="text"
          accessibility-value={`${Math.round(display.remainingPercent)}%`}
        >
          <view
            className={`SettingsUsageTrackFill SettingsUsageTone--${display.remainingTone}`}
            style={{ width: `${display.remainingPercent}%` }}
          />
          {display.markerPercent === null ||
          display.remainingPercent <= 0 ||
          display.remainingPercent >= 100 ? null : (
            <view
              className="SettingsUsageTrackMarkerGap"
              style={{ left: `${display.markerPercent}%` }}
            >
              <view
                className={`SettingsUsageTrackMarker SettingsUsageTone--${display.paceTone}`}
              />
            </view>
          )}
        </view>
      )}
      <view className="SettingsUsageLimitMeta">
        <text className="SettingsUsageMetaText">{display.leftText}</text>
        {display.resetText ? (
          <text className="SettingsUsageMetaText">{display.resetText}</text>
        ) : null}
      </view>
      {hasPaceDetails ? (
        <view className="SettingsUsageLimitPace">
          {paceAmountText ? (
            <text className="SettingsUsageMetaText">{paceAmountText}</text>
          ) : (
            <view />
          )}
          {paceEtaText ? (
            <text className="SettingsUsageMetaText">{paceEtaText}</text>
          ) : null}
        </view>
      ) : null}
    </view>
  );
}

export function SettingsUsagePanel() {
  const queryClient = useQueryClient();
  const usageQuery = useQuery({
    queryKey: SETTINGS_PROVIDER_USAGE_QUERY_KEY,
    queryFn: () => loadProviderUsage(),
    staleTime: 30_000,
  });
  const refreshMutation = useMutation({
    mutationFn: () => loadProviderUsage(true),
    onSuccess: (data) => {
      queryClient.setQueryData<readonly ServerProviderUsageSnapshot[]>(
        SETTINGS_PROVIDER_USAGE_QUERY_KEY,
        (previous) => mergeProviderUsageRefresh(previous, data)
      );
    },
  });
  const isRefreshing = usageQuery.isFetching || refreshMutation.isPending;
  const snapshots = new Map(
    (usageQuery.data ?? []).map((snapshot) => [snapshot.provider, snapshot])
  );
  const cards = PROVIDER_USAGE_PROVIDERS.map(
    (provider) => snapshots.get(provider) ?? missingSnapshot(provider)
  );

  return (
    <view className="SettingsUsage">
      <view className="SettingsUsageHeader">
        <SettingsHeadingElement className="SettingsUsageSectionTitle">
          Provider usage
        </SettingsHeadingElement>
        <Button
          size="xs"
          variant="outline"
          className="SettingsUsageRefresh"
          disabled={isRefreshing}
          aria-label="Refresh provider usage"
          onClick={() => refreshMutation.mutate()}
        >
          <RefreshCwIcon
            className={isRefreshing ? 'animate-spin' : undefined}
            size={14}
            color="var(--foreground)"
          />
          <text className="LxButton__text">Refresh</text>
        </Button>
      </view>
      {usageQuery.isPending && !usageQuery.data ? (
        <view className="SettingsUsageState">
          <text className="SettingsUsageStateText">Loading provider usage…</text>
        </view>
      ) : (
        <view className="SettingsUsageCards">
          {cards.map((snapshot) => {
            const status = snapshot.status ?? 'ok';
            const statusText = statusLabel(snapshot);
            const providerName = providerUsageDisplayName(snapshot.provider);
            const hasUsage =
              snapshot.limits.length > 0 || snapshot.usageLines.length > 0;
            return (
              <view className="SettingsUsageCard" key={snapshot.provider}>
                <view
                  className="SettingsUsageCardHeader"
                  accessibility-element
                  accessibility-label={`${providerName}${
                    statusText ? `: ${statusText}` : ''
                  }`}
                  accessibility-traits="text"
                >
                  <view className="SettingsUsageProviderIdentity">
                    <view className="SettingsUsageProviderIcon">
                      <OpenAIProviderIcon provider={snapshot.provider} />
                    </view>
                    <text className="SettingsUsageProvider">
                      {providerName}
                    </text>
                  </view>
                  {statusText ? (
                    <text
                      className={`SettingsUsageStatus SettingsUsageStatus--${status}`}
                    >
                      {statusText}
                    </text>
                  ) : null}
                </view>
                {status === 'ok' && hasUsage ? (
                  <view className="SettingsUsageDetails">
                    {snapshot.detail?.trim() ? (
                      <view
                        className="SettingsUsageNotice"
                        accessibility-element
                        accessibility-label={snapshot.detail}
                        accessibility-traits="text"
                      >
                        <TriangleAlertIcon
                          className="SettingsUsageNoticeIcon"
                          size={14}
                          color="var(--settings-usage-warning-text)"
                        />
                        <text className="SettingsUsageNoticeText">
                          {snapshot.detail}
                        </text>
                      </view>
                    ) : null}
                    {snapshot.limits.length > 0 ? (
                      <view className="SettingsUsageMeters">
                        {snapshot.limits.map((limit) => (
                          <UsageLimitRow
                            key={`${snapshot.provider}:${limit.window}`}
                            limit={limit}
                            provider={snapshot.provider}
                          />
                        ))}
                      </view>
                    ) : null}
                    {snapshot.usageLines.length > 0 ? (
                      <view
                        className={`SettingsUsageLines${
                          snapshot.limits.length > 0
                            ? ' SettingsUsageLines--after-meters'
                            : ''
                        }`}
                      >
                        {snapshot.usageLines.map((line) => (
                          <view
                            className="SettingsUsageLine"
                            key={`${snapshot.provider}:${line.label}:${line.value}`}
                            accessibility-element
                            accessibility-label={`${line.label}: ${line.value}${
                              line.subtitle ? `. ${line.subtitle}` : ''
                            }`}
                            accessibility-traits="text"
                          >
                            <view className="SettingsUsageLineHeader">
                              <text className="SettingsUsageLabel">
                                {line.label}
                              </text>
                              <text className="SettingsUsageValue">
                                {line.value}
                              </text>
                            </view>
                            {line.subtitle ? (
                              <text className="SettingsUsageSubtitle">
                                {line.subtitle}
                              </text>
                            ) : null}
                          </view>
                        ))}
                      </view>
                    ) : null}
                  </view>
                ) : (
                  <text className="SettingsUsageDetail">
                    {status === 'ok'
                      ? 'No usage data reported yet.'
                      : snapshot.detail ??
                        providerUsageNeedsAuthDetail(snapshot.provider)}
                  </text>
                )}
              </view>
            );
          })}
        </view>
      )}
      <text className="SettingsUsageFootnote">
        Usage is read locally from each provider CLI's stored credentials and
        fetched directly from the provider. OAuth providers may refresh
        short-lived tokens through their official token endpoint; if a provider
        shows “Not signed in”, re-authenticate with its CLI.
      </text>
    </view>
  );
}
