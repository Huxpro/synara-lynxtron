// FILE: SettingsGeneralComposition.tsx
// Purpose: Physical-shared General settings section/row/control composition.

import {
  SETTINGS_GENERAL_SECTIONS,
  isSettingsGeneralOption,
  type SettingsGeneralKey,
  type SettingsGeneralValues,
} from "./SettingsGeneralComposition.logic";
import {
  SettingsGeneralBooleanControlElement,
  SettingsGeneralRootElement,
  SettingsGeneralRowElement,
  SettingsGeneralSectionElement,
  SettingsGeneralSelectControlElement,
} from "~/components/settings/SettingsGeneralCompositionElements";

export function SettingsGeneralComposition(props: {
  readonly values: SettingsGeneralValues;
  readonly defaults: SettingsGeneralValues;
  readonly onChange: <Key extends SettingsGeneralKey>(
    key: Key,
    value: SettingsGeneralValues[Key],
  ) => void;
}) {
  return (
    <SettingsGeneralRootElement>
      {SETTINGS_GENERAL_SECTIONS.map((section) => (
        <SettingsGeneralSectionElement
          key={section.title}
          title={section.title}
          targetId={section.targetId}
        >
          {section.rows.map((row) => {
            const value = props.values[row.key];
            const defaultValue = props.defaults[row.key];
            return (
              <SettingsGeneralRowElement
                key={row.key}
                title={row.title}
                description={row.description}
                resetLabel={row.resetLabel}
                changed={value !== defaultValue}
                onReset={() =>
                  props.onChange(
                    row.key,
                    defaultValue as SettingsGeneralValues[typeof row.key],
                  )
                }
              >
                {row.kind === "boolean" ? (
                  <SettingsGeneralBooleanControlElement
                    checked={Boolean(value)}
                    ariaLabel={row.ariaLabel}
                    onChange={(checked) =>
                      props.onChange(
                        row.key,
                        checked as SettingsGeneralValues[typeof row.key],
                      )
                    }
                  />
                ) : (
                  <SettingsGeneralSelectControlElement
                    settingKey={row.key}
                    value={String(value)}
                    ariaLabel={row.ariaLabel}
                    options={row.options}
                    onChange={(next) => {
                      if (!isSettingsGeneralOption(row, next)) return;
                      props.onChange(
                        row.key,
                        next as SettingsGeneralValues[typeof row.key],
                      );
                    }}
                  />
                )}
              </SettingsGeneralRowElement>
            );
          })}
        </SettingsGeneralSectionElement>
      ))}
    </SettingsGeneralRootElement>
  );
}
