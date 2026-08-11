import { useLynxSystemStateAnnouncement } from '../platform/system-state-announcement.lynx';
import './pull-request-warning-banner.css';

export function PullRequestWarningBanner(props: {
  readonly children: string;
  readonly shape?: 'banner' | 'callout';
}) {
  const shape = props.shape ?? 'banner';
  useLynxSystemStateAnnouncement({
    intent: 'status',
    announcement: props.children,
  });
  return (
    <view
      className={`SharedPrWarningBanner SharedPrWarningBanner--${shape}`}
      accessibility-element={true}
      accessibility-label={props.children}
      accessibility-traits="text"
    >
      <text className="SharedPrWarningBannerText">{props.children}</text>
    </view>
  );
}
