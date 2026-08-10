import agentMentionSvg from '@synara-central-icons/robot.svg?raw';
import skillSvg from '@synara-central-icons/building-blocks.svg?raw';
import terminalSvg from '@synara-central-icons/console.svg?raw';

import type { MarkdownInlineTokenSegment } from './markdownPresentation.logic';
import { useTheme } from '../../adapters/useTheme.lynx';
import { ClockIcon } from '../../lib/icons.lynx';
import { colorizeLynxSvg } from '../../lib/themedSvg.lynx';
import { FileEntryIcon } from '../FileEntryIcon.lynx';
import { ExternalLinkIcon } from './ExternalLinkIcon.lynx';

export function MarkdownInlineTokenIcon(props: {
  readonly color?: string;
  readonly segment: MarkdownInlineTokenSegment;
}) {
  const { svgColors } = useTheme();
  if (props.segment.type === 'mention') {
    return (
      <FileEntryIcon
        className="MdInlineTokenIcon"
        pathValue={props.segment.path}
      />
    );
  }
  if (props.segment.type === 'link') {
    return <ExternalLinkIcon url={props.segment.url} />;
  }
  if (props.segment.type === 'slash-command') {
    return (
      <ClockIcon
        className="MdInlineTokenIcon"
        color="var(--info-foreground)"
        size={12}
      />
    );
  }
  const content =
    props.segment.type === 'skill'
      ? skillSvg
      : props.segment.type === 'agent-mention'
        ? agentMentionSvg
        : terminalSvg;
  return (
    <svg
      className="MdInlineTokenIcon"
      content={colorizeLynxSvg(
        content,
        props.color ??
          (props.segment.type === 'skill'
            ? svgColors.foreground
            : svgColors.mutedForeground)
      )}
      accessibility-element={false}
    />
  );
}
