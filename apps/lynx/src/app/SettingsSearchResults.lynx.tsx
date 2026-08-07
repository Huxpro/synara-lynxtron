import type { SettingsSearchEntry } from '@synara-web/settingsSearchIndex';
import { settingsSectionLabel } from '@synara-web/settingsSearchIndex';
import { SettingsIconElement } from '../adapters/SettingsIcon.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';

function SettingsSearchResult(props: {
  readonly entry: SettingsSearchEntry;
  readonly onSelect: (entry: SettingsSearchEntry) => void;
}) {
  const sectionInteraction = useLynxInteractiveState({
    baseClassName: 'SettingsSearchResultSectionRow',
    accessibleLabel: settingsSectionLabel(props.entry.section),
    onActivate: () => props.onSelect(props.entry),
  });
  const titleInteraction = useLynxInteractiveState({
    baseClassName: 'SettingsSearchResultTitleRow',
    accessibleLabel: `${settingsSectionLabel(props.entry.section)}: ${
      props.entry.title
    }`,
    onActivate: () => props.onSelect(props.entry),
  });
  return (
    <view className="SettingsSearchResult">
      <view
        className={sectionInteraction.className}
        {...sectionInteraction.eventProps}
      >
        <SettingsIconElement
          className="SettingsSearchResultSectionIcon"
          section={props.entry.section}
        />
        <text className="SettingsSearchResultSection">
          {settingsSectionLabel(props.entry.section)}
        </text>
      </view>
      <view
        className={titleInteraction.className}
        {...titleInteraction.eventProps}
      >
        <text className="SettingsSearchResultTitle">{props.entry.title}</text>
      </view>
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
    <view className="SettingsSearchResults">
      {props.results.map((entry) => (
        <SettingsSearchResult
          key={entry.id}
          entry={entry}
          onSelect={props.onSelect}
        />
      ))}
    </view>
  );
}
