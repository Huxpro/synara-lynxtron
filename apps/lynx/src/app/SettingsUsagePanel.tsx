import { useQuery } from '@tanstack/react-query';
import type { ServerProviderUsageSnapshot } from '@synara/contracts';
import {
  PROVIDER_USAGE_PROVIDERS,
  providerUsageDisplayName,
  providerUsageNeedsAuthDetail,
} from '@synara/shared/providerUsage';

import { Button } from '../components/ui/button';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import './settings-usage-panel.css';

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

function remainingTone(remainingPercent: number): 'healthy' | 'warning' | 'danger' {
  if (remainingPercent <= 10) return 'danger';
  if (remainingPercent <= 25) return 'warning';
  return 'healthy';
}

export function SettingsUsagePanel() {
  const usageQuery = useQuery({
    queryKey: ['settings-provider-usage'],
    queryFn: async () => {
      'background only';
      const { fetchAllProviderUsage } = await import(
        /* webpackMode: "eager" */ '../data/synaraClient.lynx'
      );
      return fetchAllProviderUsage();
    },
    staleTime: 30_000,
  });
  const snapshots = new Map(
    (usageQuery.data ?? []).map((snapshot) => [snapshot.provider, snapshot])
  );
  const cards = PROVIDER_USAGE_PROVIDERS.map(
    (provider) => snapshots.get(provider) ?? missingSnapshot(provider)
  );

  return (
    <view className="SettingsUsage">
      <view className="SettingsUsageHeader">
        <text className="SettingsUsageSectionTitle">Provider usage</text>
        <Button
          size="xs"
          variant="outline"
          disabled={usageQuery.isFetching}
          aria-label="Refresh provider usage"
          onClick={() => void usageQuery.refetch()}
        >
          {usageQuery.isFetching ? 'Refreshing…' : 'Refresh'}
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
            const hasUsage =
              snapshot.limits.length > 0 || snapshot.usageLines.length > 0;
            return (
              <view className="SettingsUsageCard" key={snapshot.provider}>
                <view className="SettingsUsageCardHeader">
                  <view className="SettingsUsageProviderIdentity">
                    <view className="SettingsUsageProviderIcon">
                      <OpenAIProviderIcon provider={snapshot.provider} />
                    </view>
                    <text className="SettingsUsageProvider">
                      {providerUsageDisplayName(snapshot.provider)}
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
                    {snapshot.limits.map((limit) => (
                      (() => {
                        const remainingPercent =
                          limit.usedPercent === undefined
                            ? null
                            : Math.min(
                                100,
                                Math.max(0, 100 - limit.usedPercent)
                              );
                        return (
                          <view
                            className="SettingsUsageLimit"
                            key={`${snapshot.provider}:${limit.window}`}
                          >
                            <view className="SettingsUsageLimitHeader">
                              <text className="SettingsUsageLabel">
                                {limit.window}
                              </text>
                              <text className="SettingsUsageValue">
                                {remainingPercent === null
                                  ? 'Usage reported'
                                  : `${remainingPercent.toFixed(0)}% left`}
                              </text>
                            </view>
                            {remainingPercent === null ? null : (
                              <view
                                className="SettingsUsageTrack"
                                aria-label={`${limit.window} remaining`}
                                aria-valuenow={Math.round(remainingPercent)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <view
                                  className={`SettingsUsageTrackFill SettingsUsageTrackFill--${remainingTone(
                                    remainingPercent
                                  )}`}
                                  style={{ width: `${remainingPercent}%` }}
                                />
                              </view>
                            )}
                          </view>
                        );
                      })()
                    ))}
                    {snapshot.usageLines.map((line) => (
                      <view
                        className="SettingsUsageLimit"
                        key={`${snapshot.provider}:${line.label}:${line.value}`}
                      >
                        <text className="SettingsUsageLabel">{line.label}</text>
                        <text className="SettingsUsageValue">{line.value}</text>
                        {line.subtitle ? (
                          <text className="SettingsUsageSubtitle">
                            {line.subtitle}
                          </text>
                        ) : null}
                      </view>
                    ))}
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
        Usage is read from each provider CLI and fetched directly from the
        provider.
      </text>
    </view>
  );
}
