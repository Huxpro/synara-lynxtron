// FILE: SettingsGeneralPanel.lynx.tsx
// Purpose: The General settings panel in upstream's current order and copy
//   (`renderGeneralPanel` in routes/_chat.settings.tsx), on the Lynx settings elements.
// Why not the shared SettingsGeneralComposition: it lists the rows of the previous
//   upstream General panel, and upstream writes this panel as inline JSX. The rows both
//   have (keys, options, labels) still come from that composition's section table.
// Not rendered: upstream's Safari import button and Synara Beta card, which exist only
//   where the Electron desktop bridge reports them supported.

import {
  SETTINGS_GENERAL_SECTIONS,
  isSettingsGeneralOption,
  type SettingsGeneralKey,
  type SettingsGeneralRowDefinition,
  type SettingsGeneralValues,
} from "@synara-web/components/settings/SettingsGeneralComposition.logic";
import { APP_SETTINGS_STORAGE_KEY } from "@synara-web/appSettingsStorageProjection.logic";
import {
  SettingsGeneralBooleanControlElement,
  SettingsGeneralRootElement,
  SettingsGeneralRowElement,
  SettingsGeneralSectionElement,
  SettingsGeneralSelectControlElement,
} from "../adapters/SettingsGeneralCompositionElements.lynx";
import { Button } from "../components/ui/button";
import { toastManager } from "../components/ui/toast.lynx";
import { webStorage } from "../platform/storage";

const NOT_AVAILABLE = "is not available in the Native app yet";

/** Upstream copy that changed since the shared section table was written. */
const UPSTREAM_ROW_DESCRIPTIONS: Partial<Record<SettingsGeneralKey, string>> = {
  defaultProvider:
    "Provider used for new chats until you pick a model. New chats then reuse your most recent model and options.",
};

/**
 * Upstream rows whose behavior the Native app does not implement yet. They show the stored
 * value (the setting is shared with Electron through app settings) and cannot be changed
 * here, so the switch never promises a behavior this renderer would not honor.
 */
const UNPORTED_BOOLEAN_ROWS = [
  {
    settingKey: "archiveDeletesOrphanedWorktree",
    defaultValue: false,
    title: "Delete worktree on archive",
    description:
      "After Archive's Undo period, remove a clean worktree only if the task has stopped and no other task uses it. Its branch remains available for recovery.",
  },
  {
    settingKey: "anchorSentMessagesToTop",
    defaultValue: true,
    title: "Move sent messages to top",
    description:
      "Move each sent message to the top of the conversation. Turn off to keep it at the bottom and follow replies as they stream.",
  },
] as const;

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const stored = JSON.parse(webStorage.getItem(APP_SETTINGS_STORAGE_KEY) ?? "{}") as Record<
      string,
      unknown
    >;
    return typeof stored[key] === "boolean" ? (stored[key] as boolean) : fallback;
  } catch {
    return fallback;
  }
}

function announceUnavailable(feature: string) {
  "background only";
  toastManager.add({ type: "info", title: `${feature} ${NOT_AVAILABLE}` });
}

function GeneralRow(props: {
  readonly row: SettingsGeneralRowDefinition;
  readonly terminal: boolean;
  readonly values: SettingsGeneralValues;
  readonly defaults: SettingsGeneralValues;
  readonly onChange: <Key extends SettingsGeneralKey>(
    key: Key,
    value: SettingsGeneralValues[Key],
  ) => void;
}) {
  const { row } = props;
  const value = props.values[row.key];
  const defaultValue = props.defaults[row.key];
  return (
    <SettingsGeneralRowElement
      terminal={props.terminal}
      title={row.title}
      description={UPSTREAM_ROW_DESCRIPTIONS[row.key] ?? row.description}
      resetLabel={row.resetLabel}
      changed={value !== defaultValue}
      onReset={() => props.onChange(row.key, defaultValue)}
    >
      {row.kind === "boolean" ? (
        <SettingsGeneralBooleanControlElement
          checked={Boolean(value)}
          ariaLabel={row.ariaLabel}
          onChange={(checked) =>
            props.onChange(row.key, checked as SettingsGeneralValues[typeof row.key])
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
            props.onChange(row.key, next as SettingsGeneralValues[typeof row.key]);
          }}
        />
      )}
    </SettingsGeneralRowElement>
  );
}

export function SettingsGeneralPanel(props: {
  readonly values: SettingsGeneralValues;
  readonly defaults: SettingsGeneralValues;
  readonly onChange: <Key extends SettingsGeneralKey>(
    key: Key,
    value: SettingsGeneralValues[Key],
  ) => void;
}) {
  return (
    <SettingsGeneralRootElement>
      {SETTINGS_GENERAL_SECTIONS.map((section, sectionIndex) => {
        // Upstream's "Core defaults" continues with three rows after the shared ones.
        const coreDefaults = sectionIndex === 0;
        return (
          <SettingsGeneralSectionElement
            key={section.title}
            title={section.title}
            targetId={section.targetId}
          >
            {section.rows.map((row, rowIndex) => (
              <GeneralRow
                key={row.key}
                row={row}
                terminal={!coreDefaults && rowIndex === section.rows.length - 1}
                values={props.values}
                defaults={props.defaults}
                onChange={props.onChange}
              />
            ))}
            {coreDefaults ? (
              <>
                {UNPORTED_BOOLEAN_ROWS.map((row) => (
                  <SettingsGeneralRowElement
                    key={row.settingKey}
                    title={row.title}
                    description={row.description}
                    resetLabel={row.title.toLowerCase()}
                    changed={false}
                    onReset={() => {}}
                  >
                    <SettingsGeneralBooleanControlElement
                      checked={readStoredBoolean(row.settingKey, row.defaultValue)}
                      disabled
                      ariaLabel={row.title}
                      onChange={() => {}}
                    />
                  </SettingsGeneralRowElement>
                ))}
                <SettingsGeneralRowElement
                  terminal
                  title="Welcome tour"
                  description="Replay the first-run setup: feature tour, provider selection, appearance, and first project."
                  resetLabel="welcome tour"
                  changed={false}
                  onReset={() => {}}
                >
                  <Button
                    variant="outline"
                    className="SettingsGeneralTourButton"
                    onClick={() => announceUnavailable("The welcome tour")}
                  >
                    Open welcome tour
                  </Button>
                </SettingsGeneralRowElement>
              </>
            ) : null}
          </SettingsGeneralSectionElement>
        );
      })}
    </SettingsGeneralRootElement>
  );
}
