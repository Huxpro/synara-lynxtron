import { useEffect, useState } from "@lynx-js/react";
import type { ProjectId, SpaceIconName, SpaceId } from "@synara/contracts";
import { newSpaceId } from "@synara-web/lib/utils";
import { useSpacesUiStore } from "@synara-web/spacesUiStore";

import { useSidebarSnapshot } from "../../app/sidebarSnapshot.lynx";
import { SidebarSearchPaletteLynx } from "./SidebarSearchPalette.lynx";
import { SpaceEditorDialogLynx } from "./SpaceEditorDialog.lynx";
import { SpaceProjectPickerDialogLynx } from "./SpaceProjectPickerDialog.lynx";
import {
  assignNativeProjectsToSpace,
  buildNativeSpaceCreateCommand,
} from "./spaceContextActions.logic";

interface CreatedSpaceTarget {
  readonly id: SpaceId;
  readonly name: string;
  readonly icon: SpaceIconName;
}

export function SidebarSearchPaletteHost(props: {
  readonly activeThreadId: string | null;
  readonly initialQuery?: string;
  readonly navigate: (to: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly paletteKey: number;
}) {
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [createdSpaceTarget, setCreatedSpaceTarget] = useState<CreatedSpaceTarget | null>(null);
  const [spaceActionError, setSpaceActionError] = useState<string | null>(null);
  const activeSpaceId = useSpacesUiStore((state) => state.activeSpaceId);
  const setActiveSpaceId = useSpacesUiStore((state) => state.setActiveSpaceId);
  const { data, error, isPending, refetch } = useSidebarSnapshot();

  // Projects, threads and titles are live from the shared store. Message
  // windows are a separate server read: take a fresh one each time the palette
  // opens instead of polling for it.
  useEffect(() => {
    "background only";
    if (props.open) void refetch();
  }, [props.open, refetch]);

  const saveSpace = async (value: { readonly icon: SpaceIconName; readonly name: string }) => {
    "background only";
    setSpaceActionError(null);
    try {
      const { dispatchSynaraCommand } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      const spaceId = newSpaceId();
      await dispatchSynaraCommand(
        buildNativeSpaceCreateCommand({
          icon: value.icon,
          name: value.name,
          spaceId,
        }),
      );
      setActiveSpaceId(spaceId);
      props.navigate("/");
      setCreatedSpaceTarget({
        id: spaceId,
        icon: value.icon,
        name: value.name.trim(),
      });
    } catch (cause) {
      setSpaceActionError(cause instanceof Error ? cause.message : "Unable to create the space.");
      throw cause;
    }
  };

  const assignProjects = async (projectIds: readonly ProjectId[]) => {
    "background only";
    if (!createdSpaceTarget) return projectIds;
    const { dispatchSynaraCommand, fetchSynaraSidebarShellSnapshot } = await import(
      /* webpackMode: "eager" */ "../../data/synaraClient"
    );
    const failedIds = await assignNativeProjectsToSpace({
      dispatch: dispatchSynaraCommand,
      getSnapshot: fetchSynaraSidebarShellSnapshot,
      projectIds,
      spaceId: createdSpaceTarget.id,
    });
    return failedIds;
  };

  return (
    <>
      <SidebarSearchPaletteLynx
        key={props.paletteKey}
        open={props.open}
        activeThreadId={props.activeThreadId}
        initialQuery={props.initialQuery}
        snapshot={data}
        searchStatus={data ? "ready" : isPending ? "loading" : "error"}
        searchErrorMessage={error instanceof Error ? error.message : null}
        onRetrySearch={() => void refetch()}
        onOpenChange={props.onOpenChange}
        onOpenProject={() => props.navigate("/kanban")}
        onOpenThread={(threadId) => props.navigate(`/thread/${threadId}`)}
        onCreateThread={() => props.navigate("/")}
        onCreateSpace={() => {
          setSpaceActionError(null);
          setCreateSpaceOpen(true);
        }}
        onCreateProjectThread={(projectId) =>
          props.navigate(`/new-thread/${encodeURIComponent(projectId)}`)
        }
        onOpenSettings={(section) => props.navigate(section ? `/settings/${section}` : "/settings")}
      />
      <SpaceEditorDialogLynx
        mode="create"
        open={createSpaceOpen}
        space={null}
        existingNames={(data?.spaces ?? []).map((space) => space.name)}
        onOpenChange={setCreateSpaceOpen}
        onSave={saveSpace}
      />
      <SpaceProjectPickerDialogLynx
        activeSpaceId={activeSpaceId}
        open={createdSpaceTarget !== null}
        projects={data?.projects ?? []}
        spaces={data?.spaces ?? []}
        targetSpace={createdSpaceTarget}
        onOpenChange={(open) => {
          if (!open) setCreatedSpaceTarget(null);
        }}
        onSubmit={assignProjects}
      />
      {spaceActionError ? (
        <text accessibility-element accessibility-role="alert">
          {spaceActionError}
        </text>
      ) : null}
    </>
  );
}
