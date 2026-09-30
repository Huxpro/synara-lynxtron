import type { ProjectId, SpaceIconName, SpaceId } from "@synara/contracts";

export interface ComposerProjectPickerSourceProject {
  readonly id: string;
  readonly kind: "project" | "folder";
  readonly projectId: ProjectId | null;
  readonly workspaceRoot: string;
  readonly primaryLabel: string;
  readonly secondaryLabel?: string | null | undefined;
  readonly spaceId?: SpaceId | null | undefined;
  readonly spaceName?: string | null | undefined;
  readonly spaceIcon?: SpaceIconName | null | undefined;
  readonly spaceSortOrder?: number | undefined;
}

export interface ComposerProjectPickerOption {
  readonly id: string;
  readonly kind: "project" | "folder";
  readonly projectId: ProjectId | null;
  readonly workspaceRoot: string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly selected: boolean;
}

export interface ComposerProjectPickerGroup {
  readonly id: string;
  readonly label: string;
  readonly icon: SpaceIconName | "black-hole";
  readonly options: readonly ComposerProjectPickerOption[];
}

export interface ComposerProjectPickerModel {
  readonly groups: readonly ComposerProjectPickerGroup[];
  readonly emptyText: string | null;
  readonly query: string;
  readonly selectedLabel: string;
  readonly selectedSecondaryLabel: string | null;
}

export interface ComposerProjectPickerFooterAction {
  readonly kind: "add" | "reset" | "retry";
  readonly label: string;
  readonly disabled: boolean;
}

export interface ComposerProjectPickerFooterModel {
  readonly actions: readonly ComposerProjectPickerFooterAction[];
  readonly errorMessage: string | null;
}

const VOID_GROUP_ID = "__void__";
const VOID_GROUP_LABEL = "Void";
const VOID_GROUP_ICON = "black-hole" as const;
const VOID_GROUP_SORT_ORDER = Number.MAX_SAFE_INTEGER - 1;

function searchableText(project: ComposerProjectPickerSourceProject): string {
  return [project.primaryLabel, project.secondaryLabel, project.spaceName, project.workspaceRoot]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function buildComposerProjectPickerModel(input: {
  readonly projects: readonly ComposerProjectPickerSourceProject[];
  readonly selectedOptionId: string | null;
  readonly query: string;
  readonly emptyTriggerLabel?: string | undefined;
}): ComposerProjectPickerModel {
  const normalizedQuery = input.query.trim().toLocaleLowerCase();
  const selectedProject =
    input.projects.find((project) => project.id === input.selectedOptionId) ?? null;
  const grouped = new Map<
    string,
    {
      label: string;
      icon: SpaceIconName | "black-hole";
      sortOrder: number;
      options: ComposerProjectPickerOption[];
    }
  >();

  for (const project of input.projects) {
    if (normalizedQuery && !searchableText(project).includes(normalizedQuery)) continue;
    const groupId = project.spaceId ?? VOID_GROUP_ID;
    const group = grouped.get(groupId) ?? {
      label: project.spaceName?.trim() || VOID_GROUP_LABEL,
      icon: project.spaceIcon ?? VOID_GROUP_ICON,
      sortOrder: project.spaceSortOrder ?? VOID_GROUP_SORT_ORDER,
      options: [] as ComposerProjectPickerOption[],
    };
    group.options.push({
      id: project.id,
      kind: project.kind,
      projectId: project.projectId,
      workspaceRoot: project.workspaceRoot,
      primaryLabel: project.primaryLabel,
      secondaryLabel: project.secondaryLabel?.trim() || null,
      selected: project.id === input.selectedOptionId,
    });
    grouped.set(groupId, group);
  }

  const groups = [...grouped.entries()]
    .sort((left, right) => {
      if (left[1].sortOrder !== right[1].sortOrder) {
        return left[1].sortOrder - right[1].sortOrder;
      }
      return left[1].label.localeCompare(right[1].label);
    })
    .map(([id, group]) => ({
      id,
      label: group.label,
      icon: group.icon,
      options: group.options,
    }));

  return {
    groups,
    emptyText:
      groups.length > 0
        ? null
        : input.projects.length === 0
          ? "No projects yet"
          : "No matching projects",
    query: input.query,
    selectedLabel: selectedProject?.primaryLabel ?? input.emptyTriggerLabel ?? "Work in a project",
    selectedSecondaryLabel: selectedProject?.secondaryLabel?.trim() || null,
  };
}

export function buildComposerProjectPickerFooterModel(input: {
  readonly addActionLabel: string;
  readonly addActionBusy?: boolean | undefined;
  readonly resetActionLabel: string;
  readonly resetVisible?: boolean | undefined;
  readonly retryActionLabel?: string | undefined;
  readonly retryActionBusy?: boolean | undefined;
  readonly errorMessage?: string | null | undefined;
  readonly retryVisible?: boolean | undefined;
}): ComposerProjectPickerFooterModel {
  return {
    actions: [
      {
        kind: "add",
        label: input.addActionLabel,
        disabled: input.addActionBusy ?? false,
      },
      ...((input.resetVisible ?? true)
        ? [
            {
              kind: "reset" as const,
              label: input.resetActionLabel,
              disabled: false,
            },
          ]
        : []),
      ...(input.errorMessage && input.retryVisible
        ? [
            {
              kind: "retry" as const,
              label: input.retryActionLabel ?? "Retry",
              disabled: input.retryActionBusy ?? false,
            },
          ]
        : []),
    ],
    errorMessage: input.errorMessage ?? null,
  };
}
