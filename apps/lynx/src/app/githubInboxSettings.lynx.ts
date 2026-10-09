// FILE: githubInboxSettings.lynx.ts
// Purpose: The Code review page's persisted filters, read from and merged into the app
//   settings record that Electron's `useAppSettings` owns (same storage key, same keys,
//   upstream's defaults from `AppSettingsSchema`).
// Why not upstream's `useAppSettings`: it re-encodes the whole record through its schema,
//   which drops keys this build does not know; Native merges only the keys it writes.

import { useCallback, useEffect, useState } from "@lynx-js/react";
import type { GitHubInboxSort } from "@synara/contracts";
import type { TimestampFormat } from "@synara-web/appSettings";
import { APP_SETTINGS_STORAGE_KEY } from "@synara-web/appSettingsStorageProjection.logic";
import type { GitHubInboxFilterSettings } from "@synara-web/components/githubInbox/githubInbox.logic";
import type { PullRequestListGroupKey } from "@synara-web/components/pullRequest/pullRequestList.logic";

import { webStorage } from "../platform/storage";

export interface GitHubInboxSettings extends GitHubInboxFilterSettings {
  readonly githubInboxSort: GitHubInboxSort;
  readonly githubInboxExpandedSections: ReadonlyArray<PullRequestListGroupKey> | undefined;
  readonly timestampFormat: TimestampFormat;
}

export type GitHubInboxSettingsPatch = Partial<
  Omit<GitHubInboxSettings, "timestampFormat" | "githubInboxExpandedSections">
> & {
  readonly githubInboxExpandedSections?: ReadonlyArray<PullRequestListGroupKey>;
};

const KINDS = ["all", "pullRequest", "issue"] as const;
const STATES = ["open", "closed", "merged"] as const;
const SORTS = ["created", "updated"] as const;
const INVOLVEMENTS = ["everything", "involved", "reviewRequested", "authored", "assigned"] as const;
const TIMESTAMP_FORMATS = ["locale", "12-hour", "24-hour"] as const;
const SECTION_KEYS = ["authored", "reviewRequested", "involved", "others"] as const;

function oneOf<T extends string>(values: readonly T[], value: unknown): T {
  return values.find((candidate) => candidate === value) ?? values[0]!;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function readRecord(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(webStorage.getItem(APP_SETTINGS_STORAGE_KEY) ?? "{}");
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function readGitHubInboxSettings(): GitHubInboxSettings {
  const record = readRecord();
  return {
    githubInboxKind: oneOf(KINDS, record.githubInboxKind),
    githubInboxState: oneOf(STATES, record.githubInboxState),
    githubInboxSort: oneOf(SORTS, record.githubInboxSort),
    githubInboxInvolvement: oneOf(INVOLVEMENTS, record.githubInboxInvolvement),
    githubInboxProjectIds: strings(
      record.githubInboxProjectIds,
    ) as GitHubInboxSettings["githubInboxProjectIds"],
    githubInboxLabels: strings(record.githubInboxLabels),
    githubInboxExpandedSections: Array.isArray(record.githubInboxExpandedSections)
      ? SECTION_KEYS.filter((key) => strings(record.githubInboxExpandedSections).includes(key))
      : undefined,
    timestampFormat: oneOf(TIMESTAMP_FORMATS, record.timestampFormat),
  };
}

const listeners = new Set<() => void>();

/** Merges the patch into the stored record; every other key is written back untouched. */
export function writeGitHubInboxSettings(patch: GitHubInboxSettingsPatch): void {
  "background only";
  webStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify({ ...readRecord(), ...patch }));
  for (const listener of listeners) listener();
}

export function useGitHubInboxSettings(): {
  readonly settings: GitHubInboxSettings;
  readonly updateSettings: (patch: GitHubInboxSettingsPatch) => void;
} {
  const [settings, setSettings] = useState(readGitHubInboxSettings);
  useEffect(() => {
    "background only";
    const refresh = () => setSettings(readGitHubInboxSettings());
    listeners.add(refresh);
    // Storage may have finished loading between the first render and this effect.
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  const updateSettings = useCallback((patch: GitHubInboxSettingsPatch) => {
    "background only";
    writeGitHubInboxSettings(patch);
  }, []);
  return { settings, updateSettings };
}
