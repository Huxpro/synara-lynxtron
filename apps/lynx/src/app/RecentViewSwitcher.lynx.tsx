import type { RecentViewDisplayEntry } from '@synara-web/recentViews.logic';

import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { MessageCircleIcon, PuzzleIcon, SettingsIcon, LayoutColumnsIcon } from '../lib/icons.lynx';
import './recent-view-switcher.css';

function RecentViewIcon(props: { readonly entry: RecentViewDisplayEntry }) {
  switch (props.entry.icon.kind) {
    case 'provider': return <OpenAIProviderIcon provider={props.entry.icon.provider} />;
    case 'settings': return <SettingsIcon size={18} />;
    case 'plugins': return <PuzzleIcon size={18} />;
    case 'workspace': return <LayoutColumnsIcon size={18} />;
    case 'terminal':
    case 'chat': return <MessageCircleIcon size={18} />;
  }
}

export function RecentViewSwitcherLynx(props: {
  readonly entries: readonly RecentViewDisplayEntry[];
  readonly selectedIndex: number;
}) {
  if (props.entries.length === 0) return null;
  const selectedIndex = props.selectedIndex >= 0 && props.selectedIndex < props.entries.length
    ? props.selectedIndex
    : 0;
  return (
    <view className="RecentViewSwitcherOverlay">
      <view className="RecentViewSwitcherPopup" accessibility-element accessibility-label="Recent views">
        <view className="RecentViewSwitcherList">
          {props.entries.map((entry, index) => (
            <view key={entry.key} className={'RecentViewSwitcherRow' + (index === selectedIndex ? ' RecentViewSwitcherRow--selected' : '')} accessibility-element accessibility-label={entry.title + ', ' + entry.subtitle} accessibility-state={{ selected: index === selectedIndex }}>
              <view className="RecentViewSwitcherIcon"><RecentViewIcon entry={entry} /></view>
              <view className="RecentViewSwitcherCopy">
                <view className="RecentViewSwitcherTitleLine">
                  <text className="RecentViewSwitcherTitle">{entry.title}</text>
                  {entry.isCurrent ? <text className="RecentViewSwitcherCurrent">Current</text> : null}
                </view>
                <text className="RecentViewSwitcherSubtitle">{entry.subtitle}</text>
              </view>
            </view>
          ))}
        </view>
        <view className="RecentViewSwitcherFooter">
          <text>{String(props.entries.length) + ' recent ' + (props.entries.length === 1 ? 'view' : 'views')}</text>
          <text>⌃⇥  ⌃⇧⇥  ↵  Esc</text>
        </view>
      </view>
    </view>
  );
}
