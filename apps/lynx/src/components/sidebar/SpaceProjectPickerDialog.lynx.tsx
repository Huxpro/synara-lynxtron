import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useMemo, useRef, useState } from "@lynx-js/react";
import type { ProjectId, SpaceIconName, SpaceId } from "@synara/contracts";
import {
  deriveSpaceProjectPickerGroups,
  spaceProjectPickerFailureMessage,
  toggleSpaceProjectSelection,
} from "@synara/shared/spaceProjectPicker";

import type { ProjectSummary } from "../../app/queries";
import { LynxSpaceIcon } from "../../adapters/ComposerProjectPickerCompositionElements.lynx";
import { CheckIcon, FolderIcon, SearchIcon } from "../../lib/icons.lynx";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog.lynx";
import { Input } from "../ui/input.lynx";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";

interface PickerSpace {
  readonly id: SpaceId;
  readonly name: string;
  readonly icon: SpaceIconName;
}

function ProjectPickerRow(props: {
  readonly project: ProjectSummary;
  readonly selected: boolean;
  readonly onToggle: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AppSidebarSpaceProjectRow${
      props.selected ? " AppSidebarSpaceProjectRow--selected" : ""
    }`,
    accessibleLabel: props.project.title,
    accessibilityTraits: props.selected ? "selected" : "button",
    onActivate: props.onToggle,
  });
  return (
    <view
      className={interaction.className}
      accessibility-role="checkbox"
      accessibility-state={{ checked: props.selected }}
      {...interaction.eventProps}
    >
      <view className="AppSidebarSpaceProjectRowIcon">
        <FolderIcon size={14} />
      </view>
      <text className="AppSidebarSpaceProjectRowName">{props.project.title}</text>
      <view
        className={`AppSidebarSpaceProjectCheckbox${
          props.selected ? " AppSidebarSpaceProjectCheckbox--checked" : ""
        }`}
      >
        {props.selected ? <CheckIcon size={11} /> : null}
      </view>
    </view>
  );
}

export function SpaceProjectPickerDialogLynx(props: {
  readonly activeSpaceId: SpaceId | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (projectIds: readonly ProjectId[]) => Promise<readonly ProjectId[]>;
  readonly open: boolean;
  readonly projects: readonly ProjectSummary[];
  readonly initialQuery?: string;
  readonly searchAutoFocus?: boolean;
  readonly searchDisabled?: boolean;
  readonly spaces: readonly PickerSpace[];
  readonly targetSpace: PickerSpace | null;
}) {
  const [query, setQuery] = useState(props.initialQuery ?? "");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<ProjectId>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (!props.open) return;
    setQuery(props.initialQuery ?? "");
    setSelectedIds(new Set());
    setSubmitting(false);
    setError(null);
    if (props.searchAutoFocus !== false && !props.searchDisabled) {
      void inputRef.current?.focus().catch(() => undefined);
    }
  }, [
    props.initialQuery,
    props.open,
    props.searchAutoFocus,
    props.searchDisabled,
    props.targetSpace?.id,
  ]);

  const ordinaryProjects = useMemo(
    () =>
      props.projects
        .filter((project) => project.kind === "project")
        .map((project) => ({
          project,
          id: project.id as ProjectId,
          name: project.title,
          path: project.workspaceRoot,
          spaceId: project.spaceId ?? null,
        })),
    [props.projects],
  );
  const picker = useMemo(
    () =>
      props.targetSpace
        ? deriveSpaceProjectPickerGroups({
            activeSpaceId: props.activeSpaceId,
            projects: ordinaryProjects,
            query,
            spaces: props.spaces,
            targetSpaceId: props.targetSpace.id,
          })
        : { movableProjects: [], candidates: [], groups: [] },
    [ordinaryProjects, props.activeSpaceId, props.spaces, props.targetSpace, query],
  );
  const submit = async () => {
    if (!props.targetSpace || selectedIds.size === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const failedIds = await props.onSubmit([...selectedIds]);
      if (failedIds.length > 0) {
        setSelectedIds(new Set(failedIds));
        setError(spaceProjectPickerFailureMessage(failedIds.length, props.targetSpace.name));
        setSubmitting(false);
        return;
      }
      props.onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to move the selected projects.");
      setSubmitting(false);
    }
  };
  const emptyMessage =
    ordinaryProjects.length === 0
      ? "No projects yet."
      : picker.movableProjects.length === 0
        ? `Every project is already in ${props.targetSpace?.name ?? "this space"}.`
        : "No matching projects.";

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="AppSidebarSpaceProjectPickerDialog">
        <DialogTitle>Move projects to {props.targetSpace?.name ?? "space"}</DialogTitle>
        <DialogDescription>
          Choose existing projects. Their chats and pinned state move with them.
        </DialogDescription>
        <DialogPanel className="AppSidebarSpaceProjectPickerPanel">
          <view className="AppSidebarSpaceProjectSearch">
            <SearchIcon size={14} />
            <Input
              ref={inputRef}
              aria-label="Search projects"
              className="AppSidebarSpaceProjectSearchInput"
              disabled={props.searchDisabled}
              nativeInput
              placeholder="Search projects"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </view>
          <scroll-view className="AppSidebarSpaceProjectList" scroll-orientation="vertical">
            {picker.candidates.length === 0 ? (
              <text className="AppSidebarSpaceProjectEmpty">{emptyMessage}</text>
            ) : (
              picker.groups.map((group) => (
                <view key={group.key} className="AppSidebarSpaceProjectGroup">
                  <view className="AppSidebarSpaceProjectGroupLabel">
                    <LynxSpaceIcon icon={group.icon} size={12} />
                    <text className="AppSidebarSpaceProjectGroupLabelText">{group.label}</text>
                  </view>
                  {group.items.map(({ project }) => (
                    <ProjectPickerRow
                      key={project.id}
                      project={project}
                      selected={selectedIds.has(project.id as ProjectId)}
                      onToggle={() =>
                        setSelectedIds((current) =>
                          toggleSpaceProjectSelection(current, project.id as ProjectId),
                        )
                      }
                    />
                  ))}
                </view>
              ))
            )}
          </scroll-view>
          {error ? (
            <text
              className="AppSidebarSpaceProjectError"
              accessibility-element
              accessibility-role="alert"
            >
              {error}
            </text>
          ) : null}
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" disabled={submitting} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={selectedIds.size === 0 || submitting} onClick={() => void submit()}>
            {submitting
              ? "Moving…"
              : selectedIds.size === 0
                ? "Move projects"
                : `Move ${selectedIds.size} project${selectedIds.size === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
