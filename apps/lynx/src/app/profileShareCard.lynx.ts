import type {
  ProfileHeatmapCell,
  ProfileStats,
  ProfileTokenStats,
} from '@synara/contracts';
import {
  selectProfileHeatmap,
  selectProfileTopProvider,
} from '@synara-web/components/profile/profileSelectors';

export const PROFILE_SHARE_CARD_WIDTH = 860;
export const PROFILE_SHARE_CARD_HEIGHT = 440;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
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

function formatDays(value: number): string {
  return `${Math.round(value)} ${value === 1 ? 'day' : 'days'}`;
}

function heatmapRects(cells: readonly ProfileHeatmapCell[]): string {
  const visible = cells.slice(-183);
  const rows = 7;
  const size = 22;
  const gap = 4;
  const startX = 48;
  const startY = 148;
  const padded: Array<ProfileHeatmapCell | null> = [];
  for (let index = 0; index < (visible[0]?.weekday ?? 0); index += 1) {
    padded.push(null);
  }
  padded.push(...visible);
  const columns = Math.min(27, Math.ceil(padded.length / rows));
  const offset = Math.max(0, padded.length - columns * rows);
  const colors = ['#eef2f6', '#cfe5fb', '#8fc3f5', '#4f9ee9', '#0169cc'];
  return Array.from({ length: columns * rows }, (_, index) => {
    const cell = padded[index + offset];
    const column = Math.floor(index / rows);
    const row = index % rows;
    return `<rect x="${startX + column * (size + gap)}" y="${
      startY + row * (size + gap)
    }" width="${size}" height="${size}" rx="5" fill="${
      cell ? colors[cell.intensity] ?? colors[0] : 'transparent'
    }"/>`;
  }).join('');
}

export function createProfileShareCardSvg(input: {
  readonly stats: ProfileStats;
  readonly tokenStats: ProfileTokenStats | null;
  readonly displayName: string;
  readonly handle: string;
  readonly avatarColor: string;
}): string {
  const heatmap = selectProfileHeatmap(input.stats, input.tokenStats);
  const topProvider = selectProfileTopProvider(input.stats, input.tokenStats);
  const stats = [
    [formatCompact(input.tokenStats?.lifetimeTotalTokens), 'lifetime tokens'],
    [formatCompact(input.tokenStats?.peakDayTokens), 'peak day'],
    [formatDays(input.stats.activity.currentStreakDays), 'current streak'],
    [formatDays(input.stats.activity.longestStreakDays), 'longest streak'],
    [
      topProvider.percent === null ? '—' : `${Math.round(topProvider.percent)}%`,
      'top provider',
    ],
  ] as const;
  const statMarkup = stats
    .map(
      ([value, label], index) =>
        `<g transform="translate(${48 + index * 153} 370)"><text fill="#0f172a" font-size="24" font-family="system-ui" font-weight="400">${escapeXml(
          value
        )}</text><text y="24" fill="#94a3b8" font-size="14" font-family="system-ui">${escapeXml(
          label
        )}</text></g>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PROFILE_SHARE_CARD_WIDTH}" height="${PROFILE_SHARE_CARD_HEIGHT}" viewBox="0 0 ${PROFILE_SHARE_CARD_WIDTH} ${PROFILE_SHARE_CARD_HEIGHT}">
<rect width="860" height="440" fill="#ffffff"/>
<circle cx="80" cy="72" r="32" fill="${escapeXml(input.avatarColor)}"/>
<text x="80" y="79" text-anchor="middle" fill="#ffffff" font-size="18" font-family="system-ui" font-weight="600">${escapeXml(
    input.stats.identity.initials
  )}</text>
<text x="128" y="67" fill="#0f172a" font-size="24" font-family="system-ui">${escapeXml(
    input.displayName
  )}</text>
<text x="128" y="91" fill="#94a3b8" font-size="16" font-family="system-ui">${escapeXml(
    input.handle
  )}</text>
<text x="812" y="78" text-anchor="end" fill="#475569" font-size="20" font-family="system-ui">Synara</text>
${heatmapRects(heatmap.cells)}
${statMarkup}
</svg>`;
}
