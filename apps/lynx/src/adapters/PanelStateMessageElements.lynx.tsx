import type { ReactNode } from '@lynx-js/react';

import {
  resolveSystemStateSemantics,
  type SystemStateIntent,
} from '@synara-web/components/systemStateSemantics';

import { useLynxSystemStateAnnouncement } from '../platform/system-state-announcement.lynx';
import './panel-state-message-elements.css';

export function PanelStateMessageElement(props: {
  readonly children?: ReactNode;
  readonly density: 'comfortable' | 'compact';
  readonly fill: 'full' | 'flex';
  readonly className?: string;
  readonly intent: SystemStateIntent;
  readonly announcement?: string;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  useLynxSystemStateAnnouncement({
    intent: props.intent,
    announcement: props.announcement,
  });
  const namedState = semantics.announce && Boolean(props.announcement?.trim());
  return (
    <view
      className={`SharedPanelStateMessage SharedPanelStateMessage--${props.density} SharedPanelStateMessage--${props.fill}${props.className ? ` ${props.className}` : ''}`}
    >
      <text
        className="SharedPanelStateMessageText"
        accessibility-element={namedState || undefined}
        accessibility-label={namedState ? props.announcement : undefined}
        accessibility-trait={
          namedState
            ? props.intent === 'status'
              ? 'updating'
              : 'text'
            : undefined
        }
      >
        {props.children}
      </text>
    </view>
  );
}
