import { describe, expect, it } from "@rstest/core";
import { ProjectId, SpaceId } from "@synara/contracts";

import {
  buildNativeSpaceDeleteCommand,
  buildNativeSpaceCreateCommand,
  buildNativeSpaceUpdateCommand,
  nativeSpaceDeleteConfirmation,
  buildNativeProjectMoveCommand,
  assignNativeProjectsToSpace,
  createNativeSpaceWithOptionalProjectMove,
  archiveNativeProjectThreads,
} from "./spaceContextActions.logic";

describe("Native Space context actions", () => {
  it("builds only changed metadata and trims the name", () => {
    expect(
      buildNativeSpaceUpdateCommand({
        currentIcon: "tree",
        currentName: "Old",
        nextIcon: "tree",
        nextName: "  New  ",
        spaceId: "space-a" as never,
      }),
    ).toMatchObject({
      type: "space.meta.update",
      spaceId: "space-a",
      name: "New",
    });
    expect(
      buildNativeSpaceUpdateCommand({
        currentIcon: "tree",
        currentName: "Old",
        nextIcon: "tree",
        nextName: "Old",
        spaceId: "space-a" as never,
      }),
    ).toBeNull();
  });

  it("builds deletion and matches Electron confirmation copy", () => {
    expect(buildNativeSpaceDeleteCommand("space-a" as never)).toMatchObject({
      type: "space.delete",
      spaceId: "space-a",
    });
    expect(nativeSpaceDeleteConfirmation("Work", 2)).toBe(
      "Delete “Work”?\n\n2 projects will move to Void.",
    );
    expect(nativeSpaceDeleteConfirmation("Work", 0)).toBe("Delete “Work”?");
  });

  it("builds a canonical Space create command", () => {
    expect(
      buildNativeSpaceCreateCommand({
        icon: "rocket",
        name: "  Launch  ",
        spaceId: "space-new" as never,
      }),
    ).toMatchObject({
      type: "space.create",
      spaceId: "space-new",
      name: "Launch",
      icon: "rocket",
    });
  });

  it("moves a project only when the target Space changes", () => {
    expect(
      buildNativeProjectMoveCommand({
        currentSpaceId: null,
        projectId: "project-a" as never,
        targetSpaceId: "space-a" as never,
      }),
    ).toMatchObject({
      type: "project.meta.update",
      projectId: "project-a",
      spaceId: "space-a",
    });
    expect(
      buildNativeProjectMoveCommand({
        currentSpaceId: null,
        projectId: "project-a" as never,
        targetSpaceId: null,
      }),
    ).toBeNull();
  });

  it("chunks bulk assignment and retains only authoritative failures", async () => {
    const commands: any[] = [];
    const projectIds = Array.from({ length: 201 }, (_, index) =>
      ProjectId.makeUnsafe(`project-${index}`),
    );
    const failed = await assignNativeProjectsToSpace({
      projectIds,
      spaceId: SpaceId.makeUnsafe("space-a"),
      dispatch: async (command) => {
        commands.push(command);
        if (commands.length === 2) throw new Error("offline");
      },
      getSnapshot: async () => ({
        snapshotSequence: 3,
        spaces: [],
        projects: [
          {
            id: ProjectId.makeUnsafe("project-200"),
            kind: "project",
            title: "Last",
            workspaceRoot: "/last",
            defaultModelSelection: null,
            scripts: [],
            isPinned: false,
            spaceId: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        threads: [],
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    });
    expect(commands.map((command) => command.projectIds.length)).toEqual([200, 1]);
    expect(failed).toEqual(["project-200"]);
  });

  it("creates before moving a project and reports a recoverable move failure", async () => {
    const commands: any[] = [];
    const result = await createNativeSpaceWithOptionalProjectMove({
      createCommand: buildNativeSpaceCreateCommand({
        icon: "rocket",
        name: "Launch",
        spaceId: "space-new" as never,
      }) as Extract<
        import("@synara/contracts").ClientOrchestrationCommand,
        { type: "space.create" }
      >,
      dispatch: async (command) => {
        commands.push(command);
        if (command.type === "project.meta.update") throw new Error("move failed");
      },
      projectId: "project-a" as never,
      projectSpaceId: null,
    });
    expect(commands.map((command) => command.type)).toEqual([
      "space.create",
      "project.meta.update",
    ]);
    expect(result.moveError).toBeInstanceOf(Error);
  });

  it("does not attempt a project move for ordinary Space creation", async () => {
    const commands: any[] = [];
    const result = await createNativeSpaceWithOptionalProjectMove({
      createCommand: buildNativeSpaceCreateCommand({
        icon: "bag",
        name: "Focus",
        spaceId: "space-new" as never,
      }) as Extract<
        import("@synara/contracts").ClientOrchestrationCommand,
        { type: "space.create" }
      >,
      dispatch: async (command) => {
        commands.push(command);
      },
      projectId: null,
      projectSpaceId: null,
    });
    expect(commands.map((command) => command.type)).toEqual(["space.create"]);
    expect(result).toEqual({ moveError: null });
  });

  it("continues project bulk archive after an individual failure", async () => {
    const attempted: string[] = [];
    const result = await archiveNativeProjectThreads({
      threadIds: ["thread-a", "thread-b", "thread-c"] as never,
      dispatch: async (command) => {
        if (command.type !== "thread.archive") return;
        attempted.push(command.threadId);
        if (command.threadId === "thread-b") throw new Error("failed");
      },
    });
    expect(attempted).toEqual(["thread-a", "thread-b", "thread-c"]);
    expect(result).toEqual({
      archivedCount: 2,
      archivedThreadIds: ["thread-a", "thread-c"],
      failureCount: 1,
    });
  });
});
