import type { ClientOrchestrationCommand, OrchestrationShellSnapshot } from "@synara/contracts";
import { beforeEach, describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import { createElement, type ReactNode } from "@lynx-js/react";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { KanbanNewTaskDialog } from "./KanbanNewTaskDialog.lynx";
import type { ProjectSummary } from "./queries";
import { makeProjectSummary } from "./queriesTestFixtures";

beforeEach(() => {
  Object.assign(lynx, {
    // `useInitData()` (the model control reads its capture-only switches).
    __initData: {},
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
    createSelectorQuery() {
      return {
        select() {
          return this;
        },
        invoke() {
          return this;
        },
        exec() {},
      };
    },
  });
  Object.assign(globalThis, {
    NativeModules: {
      bridge: {
        call(_name: string, _params: Record<string, unknown>, callback: (reply: unknown) => void) {
          callback({});
        },
      },
    },
  });
});

const project: ProjectSummary = makeProjectSummary({
  id: "project-1",
  kind: "project",
  title: "Synara",
  workspaceRoot: "/workspace/synara",
  defaultModelSelection: {
    provider: "codex",
    model: "gpt-5.6-sol",
  },
});

// The dialog reads server config and the model catalog through React Query.
// Neither is under test here: the queries stay pending and the dialog falls
// back to its defaults. The context directly, as in
// `eventRouter.generated.test.tsx`.
function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(createElement(QueryClientContext.Provider, { value: queryClient }, children));
}

function textarea(): Element {
  const element = elementTree.root?.querySelector(".KanbanNewTaskInput");
  if (!element) throw new Error("expected Kanban task textarea");
  return element;
}

function input(value: string) {
  textarea().dispatchEvent(
    new CustomEvent("bindEvent:input", {
      bubbles: true,
      detail: {
        value,
        selectionStart: value.length,
        selectionEnd: value.length,
        isComposing: false,
      },
    }),
  );
}

function buttons(): Element[] {
  return Array.from(elementTree.root?.querySelectorAll(".LxButton") ?? []);
}

function emptyShellSnapshot(): OrchestrationShellSnapshot {
  return {
    snapshotSequence: 1,
    updatedAt: "2026-08-10T00:00:00.000Z",
    spaces: [],
    projects: [],
    threads: [],
  };
}

describe("Lynx Kanban new task dialog", () => {
  it("creates one persistent draft thread and retains its prompt", async () => {
    useComposerDraftStore.setState({ draftsByThreadId: {} });
    const dispatchCommand = rs
      .fn<(command: ClientOrchestrationCommand) => Promise<{ sequence: number }>>()
      .mockResolvedValue({ sequence: 1 });
    const onOpenChange = rs.fn();
    const onTaskCreated = rs.fn();
    renderWithQueryClient(
      <KanbanNewTaskDialog
        initialProjectId={project.id as never}
        initialSendAsDraft
        projects={[project]}
        dispatchCommand={dispatchCommand}
        fetchShellSnapshot={async () => emptyShellSnapshot()}
        onOpenChange={onOpenChange}
        onTaskCreated={onTaskCreated}
      />,
    );

    expect(textarea().getAttribute("placeholder")).toBe(
      "Describe the task, @tag files/folders, paste images, or use / for skills",
    );
    expect(
      elementTree.root?.querySelector(".KanbanNewTaskDraftSwitch")?.getAttribute("class"),
    ).toContain("KanbanNewTaskDraftSwitch--checked");
    input("  Verify Kanban in light and dark mode.  ");
    await waitFor(() => expect(buttons()).toHaveLength(1));
    fireEvent.tap(buttons()[0]!);
    fireEvent.tap(buttons()[0]!);

    await waitFor(() => {
      expect(dispatchCommand).toHaveBeenCalledTimes(1);
      expect(onTaskCreated).toHaveBeenCalledTimes(1);
    });
    expect(dispatchCommand.mock.calls[0]?.[0]).toMatchObject({
      type: "thread.create",
      projectId: "project-1",
      title: "Verify Kanban in light and dark",
    });
    const [threadId] = Object.keys(useComposerDraftStore.getState().draftsByThreadId);
    expect(threadId).toBeTruthy();
    expect(useComposerDraftStore.getState().draftsByThreadId[threadId!]?.prompt).toBe(
      "Verify Kanban in light and dark mode.",
    );
    expect(onTaskCreated).toHaveBeenCalledWith(threadId, false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("starts the task after creation and preserves the draft if turn dispatch fails", async () => {
    useComposerDraftStore.setState({ draftsByThreadId: {} });
    const dispatchCommand = rs
      .fn<(command: ClientOrchestrationCommand) => Promise<{ sequence: number }>>()
      .mockResolvedValueOnce({ sequence: 1 })
      .mockRejectedValueOnce(new Error("provider unavailable"));
    const onOpenChange = rs.fn();
    renderWithQueryClient(
      <KanbanNewTaskDialog
        initialProjectId={project.id as never}
        projects={[project]}
        dispatchCommand={dispatchCommand}
        fetchShellSnapshot={async () => emptyShellSnapshot()}
        onOpenChange={onOpenChange}
        onTaskCreated={() => undefined}
      />,
    );

    input("Start this task now.");
    await waitFor(() => expect(buttons()).toHaveLength(1));
    fireEvent.tap(buttons()[0]!);

    await waitFor(() => {
      expect(dispatchCommand).toHaveBeenCalledTimes(2);
      expect(elementTree.root?.querySelector(".KanbanNewTaskErrorText")?.textContent).toBe(
        "provider unavailable",
      );
    });
    expect(dispatchCommand.mock.calls[0]?.[0]).toMatchObject({
      type: "thread.create",
    });
    expect(dispatchCommand.mock.calls[1]?.[0]).toMatchObject({
      type: "thread.turn.start",
      message: { text: "Start this task now." },
    });
    expect(Object.values(useComposerDraftStore.getState().draftsByThreadId)[0]?.prompt).toBe(
      "Start this task now.",
    );
    expect(
      elementTree.root
        ?.querySelector(".KanbanNewTaskProjectTrigger")
        ?.getAttribute("aria-disabled"),
    ).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("removes the scratch draft when persistent thread creation fails", async () => {
    useComposerDraftStore.setState({ draftsByThreadId: {} });
    const dispatchCommand = rs
      .fn<(command: ClientOrchestrationCommand) => Promise<{ sequence: number }>>()
      .mockRejectedValue(new Error("database unavailable"));
    renderWithQueryClient(
      <KanbanNewTaskDialog
        initialProjectId={project.id as never}
        projects={[project]}
        dispatchCommand={dispatchCommand}
        fetchShellSnapshot={async () => emptyShellSnapshot()}
        onOpenChange={() => undefined}
        onTaskCreated={() => undefined}
      />,
    );

    input("Do not leave an orphan draft.");
    await waitFor(() => expect(buttons()).toHaveLength(1));
    fireEvent.tap(buttons()[0]!);

    await waitFor(() => {
      expect(elementTree.root?.querySelector(".KanbanNewTaskErrorText")?.textContent).toBe(
        "database unavailable",
      );
    });
    expect(useComposerDraftStore.getState().draftsByThreadId).toEqual({});
  });
});
