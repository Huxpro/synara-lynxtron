// FILE: SettingsGeneralPanel.lynx.tsx
// Purpose: The General settings panel in upstream's current order and copy
//   (`renderGeneralPanel` in routes/_chat.settings.tsx), on the Lynx settings elements.
// Why not the shared SettingsGeneralComposition: it lists the rows of the previous
//   upstream General panel, and upstream writes this panel as inline JSX. The rows both
//   have (keys, options, labels) still come from that composition's section table.
// Not rendered: upstream's Safari import button and Synara Beta card, which exist only
//   where the Electron desktop bridge reports them supported.

import { useState } from "@lynx-js/react";
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
import { setPersistedStorageItem, webStorage } from "../platform/storage";
import {
  DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE,
  readArchiveDeletesOrphanedWorktree,
  writeArchiveDeletesOrphanedWorktree,
} from "./archiveWorktreeSetting.logic";

const NOT_AVAILABLE = "is not available in the Native app yet";

/** Upstream copy that changed since the shared section table was written. */
const UPSTREAM_ROW_DESCRIPTIONS: Partial<Record<SettingsGeneralKey, string>> = {
  defaultProvider:
    "Provider used for new chats until you pick a model. New chats then reuse your most recent model and options.",
};

/** Upstream's row (`renderBooleanSettingRow` in routes/_chat.settings.tsx). */
const ARCHIVE_WORKTREE_ROW = {
  title: "Delete worktree on archive",
  description:
    "After Archive's Undo period, remove a clean worktree only if the task has stopped and no other task uses it. Its branch remains available for recovery.",
  resetLabel: "delete worktree on archive",
} as const;

/**
 * An upstream row whose behavior the Native app does not implement yet: Native's transcript
 * follows the reply at the bottom and has no tail anchor (upstream `useChatTurnFollowUps`).
 * The row shows the stored value and cannot be changed here, so the switch never promises
 * a behavior this renderer would not honor.
 */
const UNPORTED_BOOLEAN_ROWS = [
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

/**
 * "Delete worktree on archive": stored in the app settings record (merged, so keys this
 * build does not know survive) and honored by `scheduleArchiveWorktreeCleanup`.
 */
function ArchiveWorktreeRow() {
  const [enabled, setEnabled] = useState(() =>
    readArchiveDeletesOrphanedWorktree(webStorage.getItem(APP_SETTINGS_STORAGE_KEY)),
  );
  const change = (next: boolean) => {
    "background only";
    const previous = enabled;
    setEnabled(next);
    void setPersistedStorageItem(
      APP_SETTINGS_STORAGE_KEY,
      writeArchiveDeletesOrphanedWorktree(webStorage.getItem(APP_SETTINGS_STORAGE_KEY), next),
    ).catch(() => {
      setEnabled(previous);
      toastManager.add({
        type: "error",
        title: "Changes could not be saved. Your current values are still shown.",
      });
    });
  };
  return (
    <SettingsGeneralRowElement
      title={ARCHIVE_WORKTREE_ROW.title}
      description={ARCHIVE_WORKTREE_ROW.description}
      resetLabel={ARCHIVE_WORKTREE_ROW.resetLabel}
      changed={enabled !== DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE}
      onReset={() => change(DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE)}
    >
      <SettingsGeneralBooleanControlElement
        checked={enabled}
        ariaLabel={ARCHIVE_WORKTREE_ROW.title}
        onChange={change}
      />
    </SettingsGeneralRowElement>
  );
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
  /** Bumped by "Restore defaults", which also rewrites the rows this panel stores itself. */
  readonly resetRevision?: number;
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
                <ArchiveWorktreeRow key={props.resetRevision ?? 0} />
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
