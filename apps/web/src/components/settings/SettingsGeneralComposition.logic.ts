// FILE: SettingsGeneralComposition.logic.ts
// Purpose: Host-neutral canonical General settings rows, order, copy, and options.

import { PROVIDER_DISPLAY_NAMES, type ProviderKind } from "@synara/contracts";
import { PROVIDER_DESCRIPTORS } from "@synara/shared/providerMetadata";
import { SETTINGS_TARGETS } from "../../settingsNavigation";

export type SettingsGeneralValues = {
  readonly defaultProvider: ProviderKind;
  readonly defaultThreadEnvMode: "local" | "worktree";
  readonly sidebarProjectSortOrder: "updated_at" | "created_at" | "manual";
  readonly sidebarThreadSortOrder: "updated_at" | "created_at";
  readonly showChatsSection: boolean;
  readonly showStudioSection: boolean;
  readonly environmentPanelDefaultOpen: boolean;
  readonly showEnvironmentUsage: boolean;
  readonly showEnvironmentRepository: boolean;
  readonly showEnvironmentPullRequest: boolean;
  readonly showEnvironmentEditor: boolean;
  readonly showEnvironmentRecap: boolean;
  readonly showEnvironmentPinned: boolean;
  readonly showEnvironmentInstructions: boolean;
  readonly showEnvironmentNotepad: boolean;
};

export type SettingsGeneralKey = keyof SettingsGeneralValues;

export type SettingsGeneralOption = {
  readonly value: string;
  readonly label: string;
};

type SettingsGeneralRowBase<Key extends SettingsGeneralKey> = {
  readonly key: Key;
  readonly title: string;
  readonly description: string;
  readonly ariaLabel: string;
  readonly resetLabel: string;
};

export type SettingsGeneralRowDefinition =
  | (SettingsGeneralRowBase<SettingsGeneralKey> & {
      readonly kind: "boolean";
    })
  | (SettingsGeneralRowBase<SettingsGeneralKey> & {
      readonly kind: "select";
      readonly options: readonly SettingsGeneralOption[];
    });

export type SettingsGeneralSectionDefinition = {
  readonly title: string;
  readonly targetId?: string | undefined;
  readonly rows: readonly SettingsGeneralRowDefinition[];
};

const providerOptions: readonly SettingsGeneralOption[] = PROVIDER_DESCRIPTORS.map(({ kind }) => ({
  value: kind,
  label: PROVIDER_DISPLAY_NAMES[kind],
}));

export const SETTINGS_GENERAL_SECTIONS: readonly SettingsGeneralSectionDefinition[] = [
  {
    title: "Core defaults",
    rows: [
      {
        kind: "select",
        key: "defaultProvider",
        title: "Default provider",
        description: "Choose the provider used for new chats.",
        ariaLabel: "Default provider",
        resetLabel: "default provider",
        options: providerOptions,
      },
      {
        kind: "select",
        key: "defaultThreadEnvMode",
        title: "New threads",
        description: "Pick the default workspace mode for newly created draft threads.",
        ariaLabel: "Default thread mode",
        resetLabel: "new threads",
        options: [
          { value: "local", label: "Local" },
          { value: "worktree", label: "New worktree" },
        ],
      },
    ],
  },
  {
    title: "Sidebar organization",
    rows: [
      {
        kind: "select",
        key: "sidebarProjectSortOrder",
        title: "Project order",
        description: "Controls how projects are arranged in the main sidebar.",
        ariaLabel: "Project sort order",
        resetLabel: "project order",
        options: [
          { value: "updated_at", label: "Recently active" },
          { value: "created_at", label: "Recently added" },
          { value: "manual", label: "Manual order" },
        ],
      },
      {
        kind: "select",
        key: "sidebarThreadSortOrder",
        title: "Thread order",
        description: "Controls how threads are arranged inside each project in the main sidebar.",
        ariaLabel: "Thread sort order",
        resetLabel: "thread order",
        options: [
          { value: "updated_at", label: "Recently active" },
          { value: "created_at", label: "Newest first" },
        ],
      },
    ],
  },
  {
    title: "Sidebar sections",
    rows: [
      {
        kind: "boolean",
        key: "showChatsSection",
        title: "Chats",
        description:
          "Show the standalone Chats list in the sidebar footer (chats not tied to a project).",
        ariaLabel: "Show the Chats section in the sidebar",
        resetLabel: "chats section",
      },
      {
        kind: "boolean",
        key: "showStudioSection",
        title: "Studio",
        description: "Show the Studio tab in the sidebar switcher.",
        ariaLabel: "Show the Studio section in the sidebar",
        resetLabel: "studio section",
      },
    ],
  },
  {
    title: "Environment panel",
    targetId: SETTINGS_TARGETS.environmentPanel,
    rows: [
      {
        kind: "boolean",
        key: "environmentPanelDefaultOpen",
        title: "Open by default",
        description:
          "Open the chat Environment panel automatically on normal threads. When off, the panel stays closed until you open it. Your last open/close also updates this preference.",
        ariaLabel: "Open the Environment panel by default on normal threads",
        resetLabel: "environment panel default open",
      },
      {
        kind: "boolean",
        key: "showEnvironmentUsage",
        title: "Usage",
        description: "Show the provider usage row in the chat Environment panel.",
        ariaLabel: "Show the Usage section in the Environment panel",
        resetLabel: "usage section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentRepository",
        title: "Repository",
        description:
          "Show the GitHub repository link in the chat Environment panel. The git block (Changes, Worktree, branch, Commit and Push) always stays visible.",
        ariaLabel: "Show the Repository section in the Environment panel",
        resetLabel: "repository section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentPullRequest",
        title: "Pull request",
        description:
          "Show the open pull request (CI checks and review comments) for the current branch in the chat Environment panel.",
        ariaLabel: "Show the Pull request section in the Environment panel",
        resetLabel: "pull request section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentEditor",
        title: "Editor",
        description:
          "Show the Editor section (in-app editor view and Open in editor picker) in the chat Environment panel.",
        ariaLabel: "Show the Editor section in the Environment panel",
        resetLabel: "editor section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentRecap",
        title: "Recap",
        description: "Show the auto-generated chat recap in the Environment panel.",
        ariaLabel: "Show the Recap section in the Environment panel",
        resetLabel: "recap section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentPinned",
        title: "Pinned messages",
        description: "Show the pinned-messages checklist in the Environment panel.",
        ariaLabel: "Show the Pinned messages section in the Environment panel",
        resetLabel: "pinned messages section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentInstructions",
        title: "Project instructions",
        description: "Show project-level instructions in the Environment panel.",
        ariaLabel: "Show the Project instructions section in the Environment panel",
        resetLabel: "project instructions section",
      },
      {
        kind: "boolean",
        key: "showEnvironmentNotepad",
        title: "Notepad",
        description: "Show the per-thread notepad in the Environment panel.",
        ariaLabel: "Show the Notepad section in the Environment panel",
        resetLabel: "notepad section",
      },
    ],
  },
];

export function settingsGeneralValuesEqual(
  current: SettingsGeneralValues,
  defaults: SettingsGeneralValues,
): boolean {
  return SETTINGS_GENERAL_SECTIONS.every((section) =>
    section.rows.every((row) => current[row.key] === defaults[row.key]),
  );
}

export function isSettingsGeneralOption(
  row: Extract<SettingsGeneralRowDefinition, { readonly kind: "select" }>,
  value: string,
): boolean {
  return row.options.some((option) => option.value === value);
}
