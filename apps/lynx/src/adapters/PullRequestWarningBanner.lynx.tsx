import type { ReactNode } from '@lynx-js/react';

import { useLynxSystemStateAnnouncement } from '../platform/system-state-announcement.lynx';
import { normalizeSystemStateAnnouncement } from '../platform/system-state-announcement.logic';
import './pull-request-warning-banner.css';

export function PullRequestWarningBanner(props: {
  readonly children: ReactNode;
  readonly shape?: 'banner' | 'callout' | 'note';
}) {
  const shape = props.shape ?? 'banner';
  const content = normalizeSystemStateAnnouncement(props.children);
  useLynxSystemStateAnnouncement({
    intent: 'status',
    announcement: content,
  });
  return (
    <view
      className={`SharedPrWarningBanner SharedPrWarningBanner--${shape}`}
      accessibility-element={true}
      accessibility-label={content}
      accessibility-trait="text"
    >
      <text className="SharedPrWarningBannerText">{content}</text>
    </view>
  );
}
