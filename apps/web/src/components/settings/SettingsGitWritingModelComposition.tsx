// FILE: SettingsGitWritingModelComposition.tsx
// Purpose: Physical-shared Git writing model section/row/select anatomy.

import {
  parseSettingsGitWritingModelValue,
  serializeSettingsGitWritingModelValue,
  settingsGitWritingModelValuesEqual,
  type SettingsGitWritingModelOption,
  type SettingsGitWritingModelValues,
} from "./SettingsGitWritingModelComposition.logic";
import {
  SettingsGitWritingModelRootElement,
  SettingsGitWritingModelRowElement,
  SettingsGitWritingModelSectionElement,
  SettingsGitWritingModelSelectElement,
} from "~/components/settings/SettingsGitWritingModelCompositionElements";

export function SettingsGitWritingModelComposition(props: {
  readonly values: SettingsGitWritingModelValues;
  readonly defaults: SettingsGitWritingModelValues;
  readonly options: readonly SettingsGitWritingModelOption[];
  readonly onChange: (value: SettingsGitWritingModelValues) => void;
}) {
  return (
    <SettingsGitWritingModelRootElement>
      <SettingsGitWritingModelSectionElement title="Generation defaults">
        <SettingsGitWritingModelRowElement
          title="Git writing model"
          description="Used for generated commit messages, PR titles, and branch names."
          changed={!settingsGitWritingModelValuesEqual(props.values, props.defaults)}
          onReset={() => props.onChange(props.defaults)}
        >
          <SettingsGitWritingModelSelectElement
            value={serializeSettingsGitWritingModelValue(props.values)}
            ariaLabel="Git text generation model"
            options={props.options}
            onChange={(value) => {
              const next = parseSettingsGitWritingModelValue(value, props.options);
              if (next) props.onChange(next);
            }}
          />
        </SettingsGitWritingModelRowElement>
      </SettingsGitWritingModelSectionElement>
    </SettingsGitWritingModelRootElement>
  );
}
