import { useQuery } from '@tanstack/react-query';
import type {
  ProfileHeatmapCell,
  ProfileStats,
  ProfileTokenStats,
  ProviderKind,
} from '@synara/contracts';
import {
  selectProfileHeatmap,
  selectProfileModelUsage,
  selectProfileTopProvider,
} from '@synara-web/components/profile/profileSelectors';

import { Button } from '../components/ui/button';
import {
  OpenAIProviderIcon,
  hasLynxProviderIcon,
} from '../components/OpenAIProviderIcon.lynx';
import {
  fetchProfileStats,
  fetchProfileTokenStats,
} from '../data/synaraClient.lynx';

import './settings-profile-panel.css';

const PROFILE_HEATMAP_COLUMNS = 40;
const PROFILE_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

type ProfileHeatmapSlot =
  | { readonly kind: 'cell'; readonly cell: ProfileHeatmapCell }
  | { readonly kind: 'pad'; readonly key: string };

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const absolute = Math.abs(value);
  const compact = (divisor: number, suffix: string) => {
    const rounded = Math.round((value / divisor) * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}${suffix}`;
  };
  if (absolute >= 1_000_000_000) return compact(1_000_000_000, 'bn');
  if (absolute >= 1_000_000) return compact(1_000_000, 'm');
  if (absolute >= 1_000) return compact(1_000, 'k');
  return `${Math.round(value)}`;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const rounded = `${Math.round(value)}`;
  const sign = rounded.startsWith('-') ? '-' : '';
  const digits = sign ? rounded.slice(1) : rounded;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDays(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? 'day' : 'days'}`;
}

function toDisplayName(value: string): string {
  const cleaned = value.replace(/[._-]+/g, ' ').trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Synara';
  return cleaned
    .split(' ')
    .map((part) =>
      part.length > 0 ? `${part[0]!.toUpperCase()}${part.slice(1)}` : part
    )
    .join(' ');
}

function utcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

function providerLabel(provider: ProviderKind | null): string {
  if (!provider) return '—';
  switch (provider) {
    case 'codex':
      return 'Codex';
    case 'claudeAgent':
      return 'Claude';
    case 'cursor':
      return 'Cursor';
    case 'antigravity':
      return 'Antigravity';
    case 'grok':
      return 'Grok';
    case 'droid':
      return 'Droid';
    case 'kilo':
      return 'Kilo';
    case 'opencode':
      return 'OpenCode';
    case 'pi':
      return 'Pi';
  }
}

function hourLabel(hour: number | null): string {
  if (hour === null) return '—';
  const normalized = ((hour % 24) + 24) % 24;
  if (normalized === 0) return '12 AM';
  if (normalized === 12) return '12 PM';
  return normalized < 12 ? `${normalized} AM` : `${normalized - 12} PM`;
}

function projectLabel(project: ProfileStats['mostWorkedProject']): string {
  if (!project) return '—';
  const promptLabel = project.promptCount === 1 ? 'prompt' : 'prompts';
  return `${project.title} · ${formatNumber(project.promptCount)} ${promptLabel}`;
}

function capitalize(value: string): string {
  return value.length > 0 ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value;
}

export function heatmapColumns(
  cells: readonly ProfileHeatmapCell[]
): readonly (readonly ProfileHeatmapSlot[])[] {
  const visibleCells = cells.slice(-(PROFILE_HEATMAP_COLUMNS * 7));
  const slots: ProfileHeatmapSlot[] = [];
  const firstCell = visibleCells[0];
  for (let index = 0; index < (firstCell?.weekday ?? 0); index += 1) {
    slots.push({ kind: 'pad', key: `lead-${index}` });
  }
  for (const cell of visibleCells) {
    slots.push({ kind: 'cell', cell });
  }
  while (slots.length % 7 !== 0) {
    slots.push({ kind: 'pad', key: `tail-${slots.length}` });
  }
  const columns: ProfileHeatmapSlot[][] = [];
  for (let index = 0; index < slots.length; index += 7) {
    columns.push(slots.slice(index, index + 7));
  }
  return columns.slice(-PROFILE_HEATMAP_COLUMNS);
}

export function heatmapMonthLabels(
  columns: readonly (readonly ProfileHeatmapSlot[])[]
): readonly string[] {
  let previousMonth = -1;
  return columns.map((column) => {
    const firstCell = column.find(
      (slot): slot is Extract<ProfileHeatmapSlot, { readonly kind: 'cell' }> =>
        slot.kind === 'cell'
    )?.cell;
    if (!firstCell) return '';
    const month = Number(firstCell.day.split('-')[1]) - 1;
    if (month < 0 || month === previousMonth) return '';
    previousMonth = month;
    return PROFILE_MONTHS[month] ?? '';
  });
}

function StatTile(props: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <view className="SettingsProfileStat">
      <text className="SettingsProfileStatValue">{props.value}</text>
      <text className="SettingsProfileStatLabel">{props.label}</text>
    </view>
  );
}

function InsightRow(props: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <view className="SettingsProfileInsightRow">
      <text className="SettingsProfileInsightLabel">{props.label}</text>
      <text className="SettingsProfileInsightValue" maxlines={1}>
        {props.value}
      </text>
    </view>
  );
}

function ProfileProviderIcon(props: {
  readonly provider: ProviderKind | 'unknown';
}) {
  return hasLynxProviderIcon(props.provider) ? (
    <OpenAIProviderIcon provider={props.provider} />
  ) : (
    <view className="SettingsProfileProviderFallback">
      <text className="SettingsProfileProviderFallbackText">
        {props.provider === 'unknown'
          ? '•'
          : providerLabel(props.provider).slice(0, 1)}
      </text>
    </view>
  );
}

function ProfileContent(props: {
  readonly stats: ProfileStats;
  readonly tokenStats: ProfileTokenStats | null;
  readonly tokensPending: boolean;
}) {
  const heatmap = selectProfileHeatmap(props.stats, props.tokenStats);
  const topProvider = selectProfileTopProvider(props.stats, props.tokenStats);
  const modelUsage = selectProfileModelUsage(props.stats, props.tokenStats);
  const activityColumns = heatmapColumns(heatmap.cells);
  const activityMonths = heatmapMonthLabels(activityColumns);
  const displayName = toDisplayName(props.stats.identity.homeDirBasename);
  const providerValue = topProvider.provider
    ? `${providerLabel(topProvider.provider)}${
        topProvider.percent === null ? '' : ` · ${topProvider.percent}%`
      }`
    : '—';
  const reasoningValue = props.stats.insights.topReasoning
    ? `${capitalize(props.stats.insights.topReasoning)}${
        props.stats.insights.topReasoningPercent === null
          ? ''
          : ` · ${props.stats.insights.topReasoningPercent}%`
      }`
    : '—';
  const copySummary = () => {
    'background only';
    const summary = [
      `${displayName} · ${props.stats.identity.defaultHandle}`,
      `Total prompts: ${formatNumber(props.stats.activity.totalPromptsSent)}`,
      `Current streak: ${formatDays(props.stats.activity.currentStreakDays)}`,
      `Longest streak: ${formatDays(props.stats.activity.longestStreakDays)}`,
      `Most used provider: ${providerValue}`,
    ].join('\n');
    void import(/* webpackMode: "eager" */ '../platform/clipboard').then(
      ({ clipboard }) => clipboard.writeText(summary)
    );
  };

  return (
    <view className="SettingsProfile">
      <view className="SettingsProfileActions">
        <Button variant="outline" size="sm" onClick={copySummary}>
          Copy summary
        </Button>
      </view>
      <view className="SettingsProfileIdentity">
        <view className="SettingsProfileAvatar">
          <text className="SettingsProfileAvatarText">
            {props.stats.identity.initials}
          </text>
        </view>
        <view className="SettingsProfileIdentityCopy">
          <text className="SettingsProfileName">{displayName}</text>
          <view className="SettingsProfileHandleLine">
            <text className="SettingsProfileHandle">
              {props.stats.identity.defaultHandle}
            </text>
            <text className="SettingsProfileDot">·</text>
            <text className="SettingsProfileBadge">Synara</text>
          </view>
        </view>
      </view>

      <view className="SettingsProfileStats">
        <StatTile
          label="Lifetime tokens"
          value={
            props.tokensPending
              ? '…'
              : formatCompact(props.tokenStats?.lifetimeTotalTokens)
          }
        />
        <StatTile
          label="Peak day"
          value={
            props.tokensPending
              ? '…'
              : formatCompact(props.tokenStats?.peakDayTokens)
          }
        />
        <StatTile
          label="Total prompts"
          value={formatNumber(props.stats.activity.totalPromptsSent)}
        />
        <StatTile
          label="Current streak"
          value={formatDays(props.stats.activity.currentStreakDays)}
        />
        <StatTile
          label="Longest streak"
          value={formatDays(props.stats.activity.longestStreakDays)}
        />
      </view>

      <view className="SettingsProfileSection SettingsProfileActivity">
        <text className="SettingsProfileSectionTitle">Activity</text>
        <view
          className="SettingsProfileHeatmap"
          accessibility-element
          accessibility-label={`Activity heatmap by ${heatmap.unit}`}
        >
          <view className="SettingsProfileHeatmapGrid">
            {activityColumns.map((column, columnIndex) => (
              <view
                className="SettingsProfileHeatmapColumn"
                key={`profile-heatmap-${columnIndex}`}
              >
                {column.map((slot) =>
                  slot.kind === 'cell' ? (
                    <view
                      className={`SettingsProfileHeatmapCell SettingsProfileHeatmapCell--${slot.cell.intensity}`}
                      key={slot.cell.day}
                    />
                  ) : (
                    <view
                      className="SettingsProfileHeatmapCell SettingsProfileHeatmapCell--pad"
                      key={slot.key}
                    />
                  )
                )}
              </view>
            ))}
          </view>
          <view className="SettingsProfileHeatmapMonths">
            {activityMonths.map((month, index) => (
              <text
                className="SettingsProfileHeatmapMonth"
                key={`profile-month-${index}`}
              >
                {month}
              </text>
            ))}
          </view>
        </view>
      </view>

      <view className="SettingsProfileColumns">
        <view className="SettingsProfileColumn">
          <text className="SettingsProfileSectionTitle">Activity insights</text>
          <view className="SettingsProfileList">
            <InsightRow label="Most used provider" value={providerValue} />
            <InsightRow
              label="Most used reasoning"
              value={reasoningValue}
            />
            <InsightRow
              label="Most active hour"
              value={hourLabel(props.stats.activeHours.startHour)}
            />
            <InsightRow
              label="Most worked project"
              value={projectLabel(props.stats.mostWorkedProject)}
            />
            <InsightRow
              label="Skills explored"
              value={formatNumber(props.stats.insights.skillsExplored)}
            />
            <InsightRow
              label="Total skills used"
              value={formatNumber(props.stats.insights.totalSkillsUsed)}
            />
            <InsightRow
              label="Total threads"
              value={formatNumber(props.stats.activity.totalThreads)}
            />
          </view>
        </view>

        <view className="SettingsProfileColumn">
          <text className="SettingsProfileSectionTitle">Most used plugins</text>
          <view className="SettingsProfileList">
            {props.stats.skills.length > 0 ? (
              props.stats.skills.slice(0, 6).map((skill) => (
                <view
                  className="SettingsProfilePluginRow"
                  key={`${skill.kind}:${skill.name}`}
                >
                  <view className="SettingsProfilePluginIdentity">
                    <view className="SettingsProfilePluginIcon">
                      <text className="SettingsProfilePluginIconText">
                        {skill.kind === 'agent' ? 'A' : 'S'}
                      </text>
                    </view>
                    <text className="SettingsProfilePluginName" maxlines={1}>
                      {skill.displayName}
                    </text>
                  </view>
                  <text className="SettingsProfilePluginCount">
                    {formatNumber(skill.runCount)} runs
                  </text>
                </view>
              ))
            ) : (
              <text className="SettingsProfileEmpty">
                No skills or agents used yet.
              </text>
            )}
          </view>
        </view>
      </view>

      <view className="SettingsProfileSection SettingsProfileModelUsage">
        <text className="SettingsProfileSectionTitle">Model usage</text>
        <view className="SettingsProfileModels">
          {modelUsage.entries.length > 0 ? (
            modelUsage.entries.slice(0, 6).map((entry) => (
              <view
                className="SettingsProfileModel"
                key={`${entry.provider}:${entry.model}`}
              >
                <view className="SettingsProfileModelLine">
                  <view className="SettingsProfileModelIdentity">
                    <ProfileProviderIcon provider={entry.provider} />
                    <text className="SettingsProfileModelName" maxlines={1}>
                      {entry.model}
                    </text>
                  </view>
                  <text className="SettingsProfileModelPercent">
                    {entry.percent}%
                  </text>
                </view>
                <view className="SettingsProfileModelTrack">
                  <view
                    className="SettingsProfileModelFill"
                    style={{
                      width: `${Math.min(100, Math.max(2, entry.percent))}%`,
                    }}
                  />
                </view>
              </view>
            ))
          ) : (
            <text className="SettingsProfileEmpty">
              No model activity yet.
            </text>
          )}
        </view>
      </view>
    </view>
  );
}

export function SettingsProfilePanel() {
  const offset = utcOffsetMinutes();
  const coreQuery = useQuery({
    queryKey: ['profile-stats', offset],
    queryFn: () => {
      'background only';
      return fetchProfileStats(offset);
    },
    staleTime: 60_000,
    retry: false,
  });
  const tokenQuery = useQuery({
    queryKey: ['profile-token-stats', offset],
    queryFn: () => {
      'background only';
      return fetchProfileTokenStats(offset);
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (coreQuery.isPending && !coreQuery.data) {
    return (
      <view className="SettingsProfileState">
        <text className="SettingsProfileStateText">Loading local stats…</text>
      </view>
    );
  }
  if (!coreQuery.data) {
    return (
      <view className="SettingsProfileState">
        <text className="SettingsProfileStateText">
          Couldn’t load your local stats.
        </text>
        <Button
          variant="outline"
          size="sm"
          disabled={coreQuery.isFetching}
          onClick={() => void coreQuery.refetch()}
        >
          {coreQuery.isFetching ? 'Trying again…' : 'Try again'}
        </Button>
      </view>
    );
  }

  return (
    <ProfileContent
      stats={coreQuery.data}
      tokenStats={tokenQuery.data ?? null}
      tokensPending={tokenQuery.isPending}
    />
  );
}
