import chatSvg from '@synara-central-icons/chat-bubble-7.svg?raw';
import conflictSvg from '@synara-central-icons/merge-conflict.svg?raw';
import reviewersSvg from '@synara-central-icons/user-group.svg?raw';
import type {
  PullRequestCheck,
  PullRequestCheckStatus,
} from '@synara/contracts';

import { useTheme } from './useTheme.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';

type RingBucket = 'success' | 'failure' | 'pending' | 'neutral';
const BUCKET_ORDER: ReadonlyArray<RingBucket> = [
  'success',
  'failure',
  'pending',
  'neutral',
];
const VIEW_BOX = 16;
const RADIUS = 6.25;
const STROKE_WIDTH = 2.4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 2;

function bucketOf(status: PullRequestCheckStatus): RingBucket {
  if (status === 'success') return 'success';
  if (status === 'failure' || status === 'cancelled') return 'failure';
  if (status === 'pending') return 'pending';
  return 'neutral';
}

export function buildPullRequestChecksRingSvg(input: {
  readonly checks: ReadonlyArray<PullRequestCheck>;
  readonly colors: Readonly<Record<RingBucket, string>>;
}): string {
  const counts = new Map<RingBucket, number>();
  for (const check of input.checks) {
    const bucket = bucketOf(check.status);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  const buckets = BUCKET_ORDER.filter(
    (bucket) => (counts.get(bucket) ?? 0) > 0
  );
  const gap = buckets.length > 1 ? SEGMENT_GAP : 0;
  let offset = 0;
  const circles =
    input.checks.length === 0
      ? `<circle cx="8" cy="8" r="${RADIUS}" fill="none" stroke="${input.colors.neutral}" stroke-width="${STROKE_WIDTH}"/>`
      : buckets
          .map((bucket) => {
            const share =
              ((counts.get(bucket) ?? 0) / input.checks.length) *
              CIRCUMFERENCE;
            const length = Math.max(share - gap, 0.5);
            const start = offset + gap / 2;
            offset += share;
            return `<circle cx="8" cy="8" r="${RADIUS}" fill="none" stroke="${input.colors[bucket]}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-dasharray="${length} ${CIRCUMFERENCE - length}" stroke-dashoffset="${-start}"/>`;
          })
          .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_BOX} ${VIEW_BOX}"><g transform="rotate(-90 8 8)">${circles}</g></svg>`;
}

export function PullRequestSummaryMetaIcon(props: {
  readonly checks?: ReadonlyArray<PullRequestCheck>;
  readonly kind: 'checks' | 'comments' | 'merge' | 'reviewers';
}) {
  const { activeTheme, svgColors } = useTheme();
  if (props.kind === 'checks') {
    return (
      <svg
        className="SharedPrSummaryMetaLabelIcon"
        content={buildPullRequestChecksRingSvg({
          checks: props.checks ?? [],
          colors: {
            success: activeTheme.theme.semanticColors.diffAdded,
            failure: activeTheme.theme.semanticColors.diffRemoved,
            pending: svgColors.warning,
            neutral: svgColors.mutedForeground,
          },
        })}
        accessibility-element={false}
      />
    );
  }
  const content =
    props.kind === 'merge'
      ? conflictSvg
      : props.kind === 'reviewers'
        ? reviewersSvg
        : chatSvg;
  const color =
    props.kind === 'merge'
      ? activeTheme.theme.semanticColors.diffRemoved
      : svgColors.mutedForeground;
  return (
    <svg
      className="SharedPrSummaryMetaLabelIcon"
      content={colorizeLynxSvg(content, color)}
      accessibility-element={false}
    />
  );
}
