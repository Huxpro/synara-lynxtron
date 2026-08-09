import draftSvg from '@synara-central-icons/draft.svg?raw';
import mergeConflictSvg from '@synara-central-icons/merge-conflict.svg?raw';
import mergedSvg from '@synara-central-icons/merged-simple.svg?raw';
import pullRequestClosedSvg from '@synara-central-icons/request-closed.svg?raw';
import pullRequestSvg from '@synara-central-icons/pull-request.svg?raw';
import type { PrStatePresentation } from '@synara-web/components/pullRequest/pullRequestStatePresentation.logic';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from './useTheme.lynx';

const PR_STATE_SVGS = {
  draft: draftSvg,
  'merge-conflict': mergeConflictSvg,
  'merged-simple': mergedSvg,
  'pull-request': pullRequestSvg,
  'pull-request-closed': pullRequestClosedSvg,
} as const;

export function PullRequestStateIcon(props: {
  readonly className: string;
  readonly presentation: PrStatePresentation;
}) {
  const { resolvedTheme, svgColors } = useTheme();
  const color =
    props.presentation.iconKind === 'pull-request'
      ? '#00a240'
      : props.presentation.iconKind === 'merged-simple'
        ? '#5e6ad2'
        : props.presentation.iconKind === 'merge-conflict'
          ? resolvedTheme === 'dark'
            ? '#e3433f'
            : '#e02e2a'
          : svgColors.mutedForeground;
  return (
    <svg
      className={props.className}
      content={colorizeLynxSvg(
        PR_STATE_SVGS[props.presentation.iconKind],
        color
      )}
    />
  );
}
