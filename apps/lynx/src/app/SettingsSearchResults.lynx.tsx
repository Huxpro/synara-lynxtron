import type { SettingsSearchEntry } from '@synara-web/settingsSearchIndex';
import { settingsSectionLabel } from '@synara-web/settingsSearchIndex';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';

function SettingsSearchResult(props: {
  readonly entry: SettingsSearchEntry;
  readonly onSelect: (entry: SettingsSearchEntry) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SettingsSearchResult',
    accessibleLabel: `${settingsSectionLabel(props.entry.section)}: ${
      props.entry.title
    }`,
    onActivate: () => props.onSelect(props.entry),
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SettingsSearchResultSection">
        {settingsSectionLabel(props.entry.section)}
      </text>
      <text className="SettingsSearchResultTitle">{props.entry.title}</text>
    </view>
  );
}

export function SettingsSearchResults(props: {
  readonly results: readonly SettingsSearchEntry[];
  readonly onSelect: (entry: SettingsSearchEntry) => void;
}) {
  if (props.results.length === 0) {
    return (
      <text className="SettingsSearchEmpty">No matching settings.</text>
    );
  }
  return (
    <scroll-view
      className="SettingsSearchResults"
      scroll-orientation="vertical"
    >
      {props.results.map((entry) => (
        <SettingsSearchResult
          key={entry.id}
          entry={entry}
          onSelect={props.onSelect}
        />
      ))}
    </scroll-view>
  );
}
