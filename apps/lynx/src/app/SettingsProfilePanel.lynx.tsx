import { useQuery } from '@tanstack/react-query';
import { useState } from '@lynx-js/react';
import pencilSvg from '@synara-central-icons/pencil.svg?raw';
import shareSvg from '@synara-central-icons/share-os.svg?raw';
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
  Dialog,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '../components/ui/dialog.lynx';
import { Input } from '../components/ui/input.lynx';
import {
  OpenAIProviderIcon,
  hasLynxProviderIcon,
} from '../components/OpenAIProviderIcon.lynx';
import {
  fetchProfileStats,
  fetchProfileTokenStats,
} from '../data/synaraClient.lynx';
import { ProfileUsageKindIcon } from './ProfileUsageKindIcon.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { ScreenshotIcon, Trash2 } from '../lib/icons.lynx';
import { webStorage } from '../platform/storage';
import { SettingsHeadingElement } from '../adapters/SettingsHeadingElement.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { useTheme } from '../adapters/useTheme.lynx';
import {
  createProfileShareCardSvg,
  PROFILE_SHARE_CARD_HEIGHT,
  PROFILE_SHARE_CARD_WIDTH,
} from './profileShareCard.lynx';

import './settings-profile-panel.css';

const PROFILE_HEATMAP_COLUMNS = 40;
const PROFILE_NAME_STORAGE_KEY = 'synara:profile:name:v1';
const PROFILE_HANDLE_STORAGE_KEY = 'synara:profile:handle:v1';
const PROFILE_AVATAR_COLOR_STORAGE_KEY = 'synara:profile:avatarColor:v1';
const PROFILE_AVATAR_IMAGE_STORAGE_KEY = 'synara:profile:avatarImage:v1';
const PROFILE_AVATAR_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#64748b',
] as const;
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

export function normalizeProfileHandle(value: string): string {
  const bare = value.trim().replace(/^@+/, '').replace(/\s+/g, '');
  return bare ? `@${bare}` : '';
}

function storedProfileValue(key: string): string {
  return webStorage.getItem(key)?.trim() ?? '';
}

function persistProfileValue(key: string, value: string): void {
  webStorage.setItem(key, value);
}

function ProfileEditActionIcon() {
  const { svgColors } = useTheme();
  return (
    <svg
      className="SettingsProfileActionIcon"
      content={colorizeLynxSvg(pencilSvg, svgColors.foreground)}
    />
  );
}

function ProfileShareActionIcon() {
  const { svgColors } = useTheme();
  return (
    <svg
      className="SettingsProfileActionIcon"
      content={colorizeLynxSvg(shareSvg, svgColors.foreground)}
    />
  );
}

function ProfileColorOption(props: {
  readonly active: boolean;
  readonly color: string;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SettingsProfileColorOption${
      props.active ? ' SettingsProfileColorOption--active' : ''
    }`,
    accessibleLabel: `Use ${props.color}`,
    accessibilityValue: props.active ? 'Selected' : 'Not selected',
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      style={{ backgroundColor: props.color }}
      {...interaction.eventProps}
    />
  );
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
  readonly index: number;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <view
      className={`SettingsProfileStat SettingsProfileStat--${props.index}`}
      accessibility-element
      accessibility-label={`${props.label}: ${props.value}`}
      accessibility-traits="text"
    >
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
    <view
      className="SettingsProfileInsightRow"
      accessibility-element
      accessibility-label={`${props.label}: ${props.value}`}
      accessibility-traits="text"
    >
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
  const defaultName = toDisplayName(props.stats.identity.homeDirBasename);
  const defaultHandle = props.stats.identity.defaultHandle;
  const [displayName, setDisplayName] = useState(
    () => storedProfileValue(PROFILE_NAME_STORAGE_KEY) || defaultName
  );
  const [handle, setHandle] = useState(
    () => normalizeProfileHandle(storedProfileValue(PROFILE_HANDLE_STORAGE_KEY)) || defaultHandle
  );
  const [avatarColor, setAvatarColor] = useState(
    () => storedProfileValue(PROFILE_AVATAR_COLOR_STORAGE_KEY) || PROFILE_AVATAR_COLORS[0]
  );
  const [avatarImage, setAvatarImage] = useState(
    () => storedProfileValue(PROFILE_AVATAR_IMAGE_STORAGE_KEY) || null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<{
    readonly intent: 'success' | 'neutral' | 'error';
    readonly message: string;
  } | null>(null);
  const [draftName, setDraftName] = useState(displayName);
  const [draftHandle, setDraftHandle] = useState(handle.replace(/^@+/, ''));
  const [draftColor, setDraftColor] = useState(avatarColor);
  const [draftImage, setDraftImage] = useState<string | null>(avatarImage);
  const [editError, setEditError] = useState<string | null>(null);
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
  const shareCardSvg = createProfileShareCardSvg({
    stats: props.stats,
    tokenStats: props.tokenStats,
    displayName,
    handle,
    avatarColor,
  });
  const copyShareCard = () => {
    'background only';
    setShareStatus(null);
    return import(/* webpackMode: "eager" */ '../platform/clipboard')
      .then(({ exportProfileShareCard }) =>
        exportProfileShareCard({ svg: shareCardSvg })
      )
      .then((result) => {
        setShareStatus({
          intent: result.ok ? 'success' : 'error',
          message: result.ok
            ? 'Copied image to clipboard.'
            : 'Image copy unavailable. Use Save instead.',
        });
        return result.ok;
      })
      .catch((error) => {
        console.warn('[profile] share card copy failed', String(error));
        setShareStatus({
          intent: 'error',
          message: 'Image copy unavailable. Use Save instead.',
        });
        return false;
      });
  };
  const saveShareCard = () => {
    'background only';
    setShareStatus(null);
    void import(/* webpackMode: "eager" */ '../platform/dialogs')
      .then(({ dialogs }) =>
        dialogs.saveProfileShareCard({
          defaultFilename: `synara-stats-${props.stats.timezone.today}.png`,
          svg: shareCardSvg,
        })
      )
      .then((path) =>
        setShareStatus({
          intent: path ? 'success' : 'neutral',
          message: path ? 'Saved PNG.' : 'Save cancelled.',
        })
      )
      .catch((error) =>
        setShareStatus({ intent: 'error', message: String(error) })
      );
  };
  const shareTo = async (target: 'x' | 'linkedin' | 'reddit') => {
    'background only';
    const urls = {
      x: 'https://x.com/intent/post',
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/',
      reddit: 'https://www.reddit.com/submit',
    } as const;
    await copyShareCard();
    try {
      const { platformWindow } = await import(
        /* webpackMode: "eager" */ '../platform/window'
      );
      const opened = await platformWindow.openExternal(urls[target]);
      if (!opened) throw new Error('Host did not open the share page.');
    } catch {
      setShareStatus({
        intent: 'error',
        message: 'Could not open the share page.',
      });
    }
  };
  const openEdit = () => {
    setDraftName(displayName);
    setDraftHandle(handle.replace(/^@+/, ''));
    setDraftColor(avatarColor);
    setDraftImage(avatarImage);
    setEditError(null);
    setEditOpen(true);
  };
  const saveEdit = () => {
    const nextName = draftName.trim() || defaultName;
    const nextHandle = normalizeProfileHandle(draftHandle) || defaultHandle;
    setDisplayName(nextName);
    setHandle(nextHandle);
    setAvatarColor(draftColor);
    setAvatarImage(draftImage);
    persistProfileValue(
      PROFILE_NAME_STORAGE_KEY,
      nextName === defaultName ? '' : nextName
    );
    persistProfileValue(
      PROFILE_HANDLE_STORAGE_KEY,
      nextHandle === defaultHandle ? '' : nextHandle
    );
    persistProfileValue(
      PROFILE_AVATAR_COLOR_STORAGE_KEY,
      draftColor === PROFILE_AVATAR_COLORS[0] ? '' : draftColor
    );
    persistProfileValue(PROFILE_AVATAR_IMAGE_STORAGE_KEY, draftImage ?? '');
    setEditOpen(false);
  };
  const pickProfileImage = () => {
    'background only';
    setEditError(null);
    void import(/* webpackMode: "eager" */ '../platform/dialogs')
      .then(({ dialogs }) => dialogs.pickProfileImage())
      .then((image) => {
        if (image?.dataUrl) setDraftImage(image.dataUrl);
      })
      .catch((error) => setEditError(String(error)));
  };

  return (
    <view className="SettingsProfile">
      <view className="SettingsProfileActions">
        <Button
          variant="outline"
          size="sm"
          className="SettingsProfileShareAction"
          onClick={() => {
            setShareStatus(null);
            setShareOpen(true);
          }}
        >
          <ProfileShareActionIcon />
          <text className="LxButton__text">Share</text>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="SettingsProfileEditAction"
          onClick={openEdit}
        >
          <ProfileEditActionIcon />
          <text className="LxButton__text">Edit</text>
        </Button>
      </view>
      <view className="SettingsProfileIdentity">
        <view
          className="SettingsProfileAvatar"
          style={{ backgroundColor: avatarColor }}
        >
          {avatarImage ? (
            <image
              className="SettingsProfileAvatarImage"
              src={avatarImage}
              mode="aspectFill"
              accessibility-element={false}
            />
          ) : (
            <text className="SettingsProfileAvatarText">
              {props.stats.identity.initials}
            </text>
          )}
        </view>
        <view className="SettingsProfileIdentityCopy">
          <SettingsHeadingElement className="SettingsProfileName">
            {displayName}
          </SettingsHeadingElement>
          <view className="SettingsProfileHandleLine">
            <text className="SettingsProfileHandle">
              {handle}
            </text>
            <text className="SettingsProfileDot">·</text>
            <text className="SettingsProfileBadge">Synara</text>
          </view>
        </view>
      </view>

      <view className="SettingsProfileStats">
        <StatTile
          index={0}
          label="Lifetime tokens"
          value={
            props.tokensPending
              ? '…'
              : formatCompact(props.tokenStats?.lifetimeTotalTokens)
          }
        />
        <StatTile
          index={1}
          label="Peak day"
          value={
            props.tokensPending
              ? '…'
              : formatCompact(props.tokenStats?.peakDayTokens)
          }
        />
        <StatTile
          index={2}
          label="Total prompts"
          value={formatNumber(props.stats.activity.totalPromptsSent)}
        />
        <StatTile
          index={3}
          label="Current streak"
          value={formatDays(props.stats.activity.currentStreakDays)}
        />
        <StatTile
          index={4}
          label="Longest streak"
          value={formatDays(props.stats.activity.longestStreakDays)}
        />
      </view>

      <view className="SettingsProfileSection SettingsProfileActivity">
        <SettingsHeadingElement className="SettingsProfileSectionTitle">
          Activity
        </SettingsHeadingElement>
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
          <SettingsHeadingElement className="SettingsProfileSectionTitle">
            Activity insights
          </SettingsHeadingElement>
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
          <SettingsHeadingElement className="SettingsProfileSectionTitle">
            Most used plugins
          </SettingsHeadingElement>
          <view className="SettingsProfileList">
            {props.stats.skills.length > 0 ? (
              props.stats.skills.slice(0, 6).map((skill) => (
                <view
                  className="SettingsProfilePluginRow"
                  key={`${skill.kind}:${skill.name}`}
                  accessibility-element
                  accessibility-label={`${skill.displayName}: ${formatNumber(skill.runCount)} runs`}
                  accessibility-traits="text"
                >
                  <view className="SettingsProfilePluginIdentity">
                    <view className="SettingsProfilePluginIcon">
                      <ProfileUsageKindIcon kind={skill.kind} />
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
        <SettingsHeadingElement className="SettingsProfileSectionTitle">
          Model usage
        </SettingsHeadingElement>
        <view className="SettingsProfileModels">
          {modelUsage.entries.length > 0 ? (
            modelUsage.entries.slice(0, 6).map((entry) => (
              <view
                className="SettingsProfileModel"
                key={`${entry.provider}:${entry.model}`}
                accessibility-element
                accessibility-label={`${entry.model}: ${entry.percent}%`}
                accessibility-traits="text"
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogPopup
          showCloseButton={false}
          className="SettingsProfileEditDialog"
        >
          <DialogTitle className="SettingsProfileEditTitle">
            Edit profile
          </DialogTitle>
          <view className="SettingsProfileEditBody">
            <view
              className="SettingsProfileEditAvatar"
              style={{ backgroundColor: draftColor }}
            >
              {draftImage ? (
                <image
                  className="SettingsProfileEditAvatarImage"
                  src={draftImage}
                  mode="aspectFill"
                  accessibility-element={false}
                />
              ) : (
                <text className="SettingsProfileEditAvatarText">
                  {props.stats.identity.initials}
                </text>
              )}
            </view>
            <view className="SettingsProfilePhotoActions">
              <Button
                size="xs"
                variant="outline"
                className="SettingsProfilePhotoAction"
                onClick={pickProfileImage}
              >
                <ScreenshotIcon size={14} />
                <text className="LxButton__text">
                  {draftImage ? 'Replace photo' : 'Upload photo'}
                </text>
              </Button>
              {draftImage ? (
                <Button
                  size="xs"
                  variant="ghost"
                  className="SettingsProfilePhotoAction"
                  onClick={() => setDraftImage(null)}
                >
                  <Trash2 size={14} />
                  <text className="LxButton__text">Remove</text>
                </Button>
              ) : null}
            </view>
            <view className="SettingsProfileColorOptions">
              {PROFILE_AVATAR_COLORS.map((color) => (
                <ProfileColorOption
                  key={color}
                  active={draftColor === color}
                  color={color}
                  onSelect={() => setDraftColor(color)}
                />
              ))}
            </view>
            {draftImage ? (
              <text className="SettingsProfilePhotoHint">
                Colors apply when no photo is set.
              </text>
            ) : null}
            {editError ? (
              <text
                className="SettingsProfileEditError"
                accessibility-element
                accessibility-role="alert"
              >
                {editError}
              </text>
            ) : null}
            <view className="SettingsProfileEditFields">
              <view className="SettingsProfileEditField">
                <text className="SettingsProfileEditLabel">Display name</text>
                <Input
                  nativeInput
                  size="sm"
                  value={draftName}
                  placeholder="Your name"
                  accessibility-label="Display name"
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </view>
              <view className="SettingsProfileEditField">
                <text className="SettingsProfileEditLabel">Username</text>
                <view className="SettingsProfileHandleInput">
                  <text className="SettingsProfileHandlePrefix">@</text>
                  <Input
                    nativeInput
                    unstyled
                    value={draftHandle}
                    placeholder="username"
                    accessibility-label="Username"
                    onChange={(event) =>
                      setDraftHandle(
                        event.target.value.replace(/^@+/, '').replace(/\s+/g, '')
                      )
                    }
                  />
                </view>
              </view>
            </view>
          </view>
          <DialogFooter className="SettingsProfileEditFooter">
            <Button
              variant="ghost"
              className="SettingsProfileEditFooterButton"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="SettingsProfileEditFooterButton"
              onClick={saveEdit}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogPopup className="SettingsProfileShareDialog">
          <DialogTitle className="SettingsProfileShareTitle">
            Share your activity
          </DialogTitle>
          <DialogPanel className="SettingsProfileShareBody">
            <view
              className="SettingsProfileSharePreview"
              style={{
                aspectRatio: `${PROFILE_SHARE_CARD_WIDTH} / ${PROFILE_SHARE_CARD_HEIGHT}`,
              }}
            >
              <svg
                className="SettingsProfileShareCard"
                content={shareCardSvg}
              />
            </view>
            <view className="SettingsProfileShareActions">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void copyShareCard()}
              >
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={saveShareCard}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void shareTo('x')}
              >
                X
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void shareTo('linkedin')}
              >
                LinkedIn
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void shareTo('reddit')}
              >
                Reddit
              </Button>
            </view>
            {shareStatus ? (
              <text
                className={`SettingsProfileShareStatus SettingsProfileShareStatus--${shareStatus.intent}`}
                accessibility-element
                accessibility-role={
                  shareStatus.intent === 'error' ? 'alert' : undefined
                }
              >
                {shareStatus.message}
              </text>
            ) : null}
          </DialogPanel>
        </DialogPopup>
      </Dialog>
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
        <text
          className="SettingsProfileStateText"
          accessibility-element
          accessibility-role="alert"
        >
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
