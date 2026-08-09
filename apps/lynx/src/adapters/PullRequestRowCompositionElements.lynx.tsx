import type {
  GitPullRequestMergeability,
  PullRequestActor,
  PullRequestState,
} from '@synara/contracts';
import type { ReactNode } from '@lynx-js/react';
import draftSvg from '@synara-central-icons/draft.svg?raw';
import mergeConflictSvg from '@synara-central-icons/merge-conflict.svg?raw';
import mergedSvg from '@synara-central-icons/merged-simple.svg?raw';
import pinFilledSvg from '@synara-central-icons-fill/pin.svg?raw';
import pinSvg from '@synara-central-icons/pin.svg?raw';
import pullRequestClosedSvg from '@synara-central-icons/request-closed.svg?raw';
import pullRequestSvg from '@synara-central-icons/pull-request.svg?raw';
import { resolvePrStatePresentation } from '@synara-web/components/pullRequest/pullRequestStatePresentation.logic';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import './pull-request-row-composition-elements.css';
import { useTheme } from './useTheme.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestRowRootElement(
  props: ChildrenProps & { readonly selected: boolean }
) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedPrRow${
      props.selected ? ' SharedPrRow--selected' : ''
    }`,
    focusable: false,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

export function PullRequestRowActionElement(
  props: ChildrenProps & {
    readonly accessibleLabel: string;
    readonly projectId: string;
    readonly repository: string;
    readonly number: number;
    readonly selected: boolean;
    readonly onActivate?: (() => void) | undefined;
  }
) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrRowAction',
    accessibleLabel: props.accessibleLabel,
    accessibilityValue: props.selected ? 'Current pull request' : undefined,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

const PR_STATE_SVGS = {
  draft: draftSvg,
  'merge-conflict': mergeConflictSvg,
  'merged-simple': mergedSvg,
  'pull-request': pullRequestSvg,
  'pull-request-closed': pullRequestClosedSvg,
} as const;

export function PullRequestRowStateElement(props: {
  readonly state: PullRequestState;
  readonly isDraft: boolean;
  readonly mergeability?: GitPullRequestMergeability | undefined;
}) {
  const { resolvedTheme, svgColors } = useTheme();
  const presentation = resolvePrStatePresentation({
    state: props.state,
    isDraft: props.isDraft,
    mergeability: props.mergeability,
  });
  const color =
    presentation.iconKind === 'pull-request'
      ? '#00a240'
      : presentation.iconKind === 'merged-simple'
        ? '#5e6ad2'
        : presentation.iconKind === 'merge-conflict'
          ? resolvedTheme === 'dark'
            ? '#e3433f'
            : '#e02e2a'
          : svgColors.mutedForeground;
  return (
    <view
      className={`SharedPrState SharedPrState--${presentation.iconKind}`}
      accessibility-element
      accessibility-label={presentation.label}
    >
      <svg
        className="SharedPrStateIcon"
        content={colorizeLynxSvg(
          PR_STATE_SVGS[presentation.iconKind],
          color
        )}
      />
    </view>
  );
}

export function PullRequestRowCopyElement(props: ChildrenProps) {
  return <view className="SharedPrCopy">{props.children}</view>;
}

export function PullRequestRowTitleElement(props: {
  readonly title: string;
  readonly number: number;
}) {
  return (
    <view className="SharedPrTitleLine">
      <text className="SharedPrTitle">{props.title}</text>
    </view>
  );
}

export function PullRequestRowMetaElement(props: ChildrenProps) {
  return <view className="SharedPrMeta">{props.children}</view>;
}

export function PullRequestRowAuthorElement(props: {
  readonly actor: PullRequestActor | null;
}) {
  const source = props.actor?.name?.trim() || props.actor?.login?.trim() || '?';
  return (
    <view className="SharedPrAvatar">
      <text className="SharedPrAvatarText">{source.slice(0, 1).toUpperCase()}</text>
    </view>
  );
}

export function PullRequestRowMetaSegmentsElement(props: ChildrenProps) {
  return <view className="SharedPrMetaSegments">{props.children}</view>;
}

export function PullRequestRowMetaSegmentElement(
  props: ChildrenProps & {
    readonly title?: string | undefined;
    readonly truncateWidth?: string;
    readonly showSeparator: boolean;
  }
) {
  return (
    <view className="SharedPrMetaSegment">
      {props.showSeparator ? (
        <text className="SharedPrMetaSeparator">·</text>
      ) : null}
      <text className="SharedPrMetaSegmentText">{props.children}</text>
    </view>
  );
}

export function PullRequestRowTrailingElement(props: ChildrenProps) {
  return <view className="SharedPrTrailing">{props.children}</view>;
}

export function PullRequestRowTimeElement(props: ChildrenProps) {
  return <text className="SharedPrTime">{props.children}</text>;
}

export function PullRequestRowDiffElement(props: {
  readonly additions: number;
  readonly deletions: number;
}) {
  return (
    <view className="SharedPrDiff">
      <text className="SharedPrDiffText">+{props.additions.toLocaleString('en-US')}</text>
      <text className="SharedPrDiffText">-{props.deletions.toLocaleString('en-US')}</text>
    </view>
  );
}

export function PullRequestRowPinElement(props: {
  readonly label: string;
  readonly pinned: boolean;
  readonly onActivate: () => void;
}) {
  const { svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrPin',
    accessibleLabel: props.label,
    accessibilityValue: props.pinned ? 'Pinned' : 'Not pinned',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.label}
      aria-pressed={props.pinned}
      {...interaction.eventProps}
    >
      <svg
        className="SharedPrPinIcon"
        content={colorizeLynxSvg(
          props.pinned ? pinFilledSvg : pinSvg,
          props.pinned ? svgColors.foreground : svgColors.mutedForeground
        )}
      />
    </view>
  );
}
