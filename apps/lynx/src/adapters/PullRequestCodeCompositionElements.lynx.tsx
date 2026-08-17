import type { ReactNode } from '@lynx-js/react';

import type { PullRequestDiffLineKind } from '@synara-web/components/pullRequest/pullRequestCode.logic';
import { ChevronRightIcon } from '../lib/icons.lynx';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
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

export function PullRequestCodeFileElement(
  props: ChildrenProps & { readonly id?: string }
) {
  return (
    <view id={props.id} className="SharedPrCodeFile">
      {props.children}
    </view>
  );
}

export function PullRequestCodeFileHeaderElement(props: {
  readonly path: string;
  readonly previousPath: string | null;
  readonly relation: 'copied' | 'renamed' | null;
  readonly additions: number;
  readonly deletions: number;
  readonly expanded: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrCodeFileHeader',
    accessibleLabel: `${props.expanded ? 'Collapse' : 'Expand'} ${props.path}`,
    accessibilityValue: props.expanded ? 'Expanded' : 'Collapsed',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-expanded={props.expanded}
      {...interaction.eventProps}
    >
      <ChevronRightIcon
        className={disclosureChevronClassName(
          props.expanded,
          'SharedPrCodeFileChevron'
        )}
        size={10}
      />
      <text className="SharedPrCodeFilePath">{props.path}</text>
      {props.previousPath ? (
        <text className="SharedPrCodeFilePrevious">
          {props.relation === 'copied'
            ? 'copied from'
            : props.relation === 'renamed'
              ? 'renamed from'
              : 'from'}{' '}
          {props.previousPath}
        </text>
      ) : null}
      <text className="SharedPrCodeStatsAddition">+{props.additions}</text>
      <text className="SharedPrCodeStatsDeletion">-{props.deletions}</text>
    </view>
  );
}

export function PullRequestCodeDisclosureElement(
  props: ChildrenProps & { readonly expanded: boolean }
) {
  const present = useLynxDisclosurePresence(props.expanded);
  if (!present) return null;
  return (
    <view
      className={disclosureContentClassName(
        props.expanded,
        'SharedPrCodeDisclosure'
      )}
      aria-hidden={!props.expanded}
    >
      {props.children}
    </view>
  );
}

export function PullRequestCodeLinesElement(
  props: ChildrenProps & { readonly wordWrap: boolean }
) {
  if (props.wordWrap) {
    return (
      <view className="SharedPrCodeLines SharedPrCodeLines--wrap">
        <view className="SharedPrCodeLinesContent">{props.children}</view>
      </view>
    );
  }
  return (
    <scroll-view
      className="SharedPrCodeLines"
      scroll-orientation="horizontal"
    >
      <view className="SharedPrCodeLinesContent">{props.children}</view>
    </scroll-view>
  );
}

export function PullRequestCodeLineElement(props: {
  readonly kind: PullRequestDiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly text: string;
  readonly wordWrap: boolean;
}) {
  const prefix =
    props.kind === 'addition'
      ? '+'
      : props.kind === 'deletion'
        ? '-'
        : props.kind === 'hunk'
          ? '@'
          : props.kind.startsWith('no-newline-')
            ? '\\'
          : ' ';
  return (
    <view
      className={`SharedPrCodeLine SharedPrCodeLine--${props.kind}${
        props.wordWrap ? ' SharedPrCodeLine--wrap' : ''
      }`}
    >
      <text className="SharedPrCodeLineNumber">{props.oldLine ?? ''}</text>
      <text className="SharedPrCodeLineNumber">{props.newLine ?? ''}</text>
      <text className="SharedPrCodeLinePrefix">{prefix}</text>
      <text className="SharedPrCodeLineText">{props.text || ' '}</text>
    </view>
  );
}

export function PullRequestCodeMoreElement(props: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedPrCodeMore${
      props.disabled ? ' SharedPrCodeMore--disabled' : ''
    }`,
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedPrCodeMoreText">{props.label}</text>
    </view>
  );
}
