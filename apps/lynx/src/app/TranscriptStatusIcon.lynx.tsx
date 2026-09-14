import botSvg from '@synara-central-icons/robot.svg?raw';
import toolSvg from '@synara-central-icons/zap.svg?raw';
import type { TimelineStatusTone } from '@synara-web/components/chat/TimelineStatusRowComposition';

import { CheckIcon, CircleAlertIcon, PencilIcon, SearchIcon } from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';

export type TranscriptStatusIconKind =
  | 'edit'
  | 'error'
  | 'info'
  | 'search'
  | 'thinking'
  | 'tool';

export function TranscriptStatusIcon(props: {
  readonly kind: TranscriptStatusIconKind;
  readonly tone?: TimelineStatusTone;
}) {
  const { svgColors } = useTheme();
  const color =
    props.kind === 'error' || props.tone === 'error'
      ? svgColors.statusError
      : svgColors.statusNeutral;
  if (props.kind === 'error') {
    return <CircleAlertIcon className="TranscriptStatusIcon" color={color} size={13} />;
  }
  if (props.kind === 'info') {
    return <CheckIcon className="TranscriptStatusIcon" color={color} size={13} />;
  }
  if (props.kind === 'search') {
    return <SearchIcon className="TranscriptStatusIcon" color={color} size={13} />;
  }
  if (props.kind === 'edit') {
    return <PencilIcon className="TranscriptStatusIcon" color={color} size={13} />;
  }
  return (
    <svg
      className="TranscriptStatusIcon"
      content={colorizeLynxSvg(
        props.kind === 'thinking' ? botSvg : toolSvg,
        color
      )}
    />
  );
}
