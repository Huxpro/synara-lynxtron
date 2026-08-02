import type { ReactNode } from '@lynx-js/react';

import type { PullRequestDiffLineKind } from '@synara-web/components/pullRequest/pullRequestCode.logic';
import './pull-request-code-composition-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestCodeRootElement(props: ChildrenProps) {
  return <view className="SharedPrCodeRoot">{props.children}</view>;
}

export function PullRequestCodeNoticeElement(
  props: ChildrenProps & { readonly intent?: 'warning' | 'muted' }
) {
  return (
    <text
      className={`SharedPrCodeNotice${
        props.intent === 'warning' ? ' SharedPrCodeNotice--warning' : ''
      }`}
    >
      {props.children}
    </text>
  );
}

export function PullRequestCodeStatsElement(props: {
  readonly fileCount: number;
  readonly additions: number;
  readonly deletions: number;
}) {
  return (
    <view className="SharedPrCodeStats">
      <text className="SharedPrCodeStatsText">
        {props.fileCount} {props.fileCount === 1 ? 'file' : 'files'}
      </text>
      <text className="SharedPrCodeStatsAddition">+{props.additions}</text>
      <text className="SharedPrCodeStatsDeletion">-{props.deletions}</text>
    </view>
  );
}

export function PullRequestCodeFileElement(props: ChildrenProps) {
  return <view className="SharedPrCodeFile">{props.children}</view>;
}

export function PullRequestCodeFileHeaderElement(props: {
  readonly path: string;
  readonly previousPath: string | null;
  readonly additions: number;
  readonly deletions: number;
  readonly expanded: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrCodeFileHeader',
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedPrCodeFileChevron">
        {props.expanded ? '▾' : '▸'}
      </text>
      <text className="SharedPrCodeFilePath">{props.path}</text>
      {props.previousPath ? (
        <text className="SharedPrCodeFilePrevious">from {props.previousPath}</text>
      ) : null}
      <text className="SharedPrCodeStatsAddition">+{props.additions}</text>
      <text className="SharedPrCodeStatsDeletion">-{props.deletions}</text>
    </view>
  );
}

export function PullRequestCodeLinesElement(props: ChildrenProps) {
  return <view className="SharedPrCodeLines">{props.children}</view>;
}

export function PullRequestCodeLineElement(props: {
  readonly kind: PullRequestDiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly text: string;
}) {
  const prefix =
    props.kind === 'addition'
      ? '+'
      : props.kind === 'deletion'
        ? '-'
        : props.kind === 'hunk'
          ? '@'
          : ' ';
  return (
    <view className={`SharedPrCodeLine SharedPrCodeLine--${props.kind}`}>
      <text className="SharedPrCodeLineNumber">{props.oldLine ?? ''}</text>
      <text className="SharedPrCodeLineNumber">{props.newLine ?? ''}</text>
      <text className="SharedPrCodeLinePrefix">{prefix}</text>
      <text className="SharedPrCodeLineText">{props.text || ' '}</text>
    </view>
  );
}

export function PullRequestCodeMoreElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrCodeMore',
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedPrCodeMoreText">{props.label}</text>
    </view>
  );
}
