import type { RecentViewDisplayEntry } from '@synara-web/recentViews.logic';
import chatSvg from '@synara-central-icons/bubble-text.svg?raw';
import consoleSvg from '@synara-central-icons/console.svg?raw';
import splitViewSvg from '@synara-central-icons/sidebar-simple-left-wide.svg?raw';
import pluginSvg from '@synara-central-icons/puzzle.svg?raw';
import settingsSvg from '@synara-central-icons/settings-gear-4.svg?raw';
import windowSvg from '@synara-central-icons/window.svg?raw';
import pinFilledSvg from '@synara-central-icons-fill/pin.svg?raw';

import { useTheme } from '../adapters/useTheme.lynx';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { Kbd } from '../components/ui/kbd.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import './recent-view-switcher.css';

function RecentViewIcon(props: { readonly entry: RecentViewDisplayEntry }) {
  const { semanticIconColor } = useTheme();
  const primary = semanticIconColor('primary');
  const secondary = semanticIconColor('secondary');
  switch (props.entry.icon.kind) {
    case 'provider': return <OpenAIProviderIcon provider={props.entry.icon.provider} />;
    case 'terminal':
      if (props.entry.icon.iconKey === 'openai') return <OpenAIProviderIcon provider="codex" />;
      if (props.entry.icon.iconKey === 'claude') return <OpenAIProviderIcon provider="claudeAgent" />;
      if (props.entry.icon.iconKey === 'antigravity') return <OpenAIProviderIcon provider="antigravity" />;
      return <svg className="RecentViewSwitcherIconSvg" content={colorizeLynxSvg(consoleSvg, primary)} />;
    case 'settings':
      return <svg className="RecentViewSwitcherIconSvg" content={colorizeLynxSvg(settingsSvg, secondary)} />;
    case 'plugins':
      return <svg className="RecentViewSwitcherIconSvg" content={colorizeLynxSvg(pluginSvg, secondary)} />;
    case 'workspace':
      return <svg className="RecentViewSwitcherIconSvg" content={colorizeLynxSvg(windowSvg, secondary)} />;
    case 'chat':
      return <svg className="RecentViewSwitcherIconSvg" content={colorizeLynxSvg(chatSvg, secondary)} />;
  }
}

export function RecentViewSwitcherLynx(props: {
  readonly entries: readonly RecentViewDisplayEntry[];
  readonly selectedIndex: number;
}) {
  const { semanticIconColor } = useTheme();
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
              {entry.isSplit || entry.isPinned ? (
                <view className="RecentViewSwitcherTrailing">
                  {entry.isSplit ? (
                    <svg
                      className="RecentViewSwitcherTrailingIcon"
                      content={colorizeLynxSvg(splitViewSvg, semanticIconColor('secondary'))}
                      accessibility-element
                      accessibility-label="Split view"
                      accessibility-trait="image"
                    />
                  ) : null}
                  {entry.isPinned ? (
                    <svg
                      className="RecentViewSwitcherTrailingIcon"
                      content={colorizeLynxSvg(pinFilledSvg, semanticIconColor('secondary'))}
                      accessibility-element
                      accessibility-label="Pinned"
                      accessibility-trait="image"
                    />
                  ) : null}
                </view>
              ) : null}
            </view>
          ))}
        </view>
        <view className="RecentViewSwitcherFooter">
          <text>{String(props.entries.length) + ' recent ' + (props.entries.length === 1 ? 'view' : 'views')}</text>
          <view className="RecentViewSwitcherFooterKeys">
            {['⌃⇥', '⌃⇧⇥', '↵', 'Esc'].map((label) => (
              <Kbd key={label}>{label}</Kbd>
            ))}
          </view>
        </view>
      </view>
    </view>
  );
}
