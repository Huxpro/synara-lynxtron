import { getDefaultModel } from "@synara/shared/model";
import type {
  ClientOrchestrationCommand,
  ModelSelection,
  OrchestrationShellSnapshot,
  ProjectId,
} from "@synara/contracts";
import { createElement, useRef, useState } from "@lynx-js/react";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from "@synara-web/appSettingsStorageProjection.logic";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { SynaraLogo } from "../adapters/SynaraLogo.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { buildComposerTurnStartCommand } from "../components/composer/composerDispatch.logic";
import {
  ensureThreadCreated,
  type ThreadCreationState,
} from "../components/composer/landingThreadCreation.logic";
import { queryClient, type ProjectSummary } from "./queries";
import { webStorage } from "../platform/storage";
import {
  buildNativeKanbanTaskCreateCommand,
  createNativeKanbanTaskId,
} from "./kanbanTaskCreation.logic";

import "./kanban-new-task-dialog.css";

type NativeTaskInputEvent = {
  readonly detail: {
    readonly isComposing: boolean;
    readonly value: string;
  };
};

type DispatchCommand = (
  command: ClientOrchestrationCommand,
) => Promise<{ readonly sequence: number }>;

type FetchShellSnapshot = () => Promise<OrchestrationShellSnapshot>;

async function dispatchKanbanTaskCommand(
  command: ClientOrchestrationCommand,
): Promise<{ readonly sequence: number }> {
  "background only";
  const { dispatchSynaraCommand } = await import(/* webpackMode: "eager" */ "../data/synaraClient");
  return dispatchSynaraCommand(command);
}

async function fetchKanbanTaskShellSnapshot(): Promise<OrchestrationShellSnapshot> {
  "background only";
  const { fetchSynaraSidebarShellSnapshot } = await import(
    /* webpackMode: "eager" */ "../data/synaraClient"
  );
  return fetchSynaraSidebarShellSnapshot();
}

function NativeTaskTextarea(props: {
  readonly disabled: boolean;
  readonly onInput: (event: NativeTaskInputEvent) => void;
  readonly value: string;
}) {
  return createElement("textarea", {
    className: "KanbanNewTaskInput",
    "accessibility-element": true,
    "accessibility-label": "Task prompt",
    "default-value": props.value,
    disabled: props.disabled,
    focusable: !props.disabled,
    maxlength: 8000,
    maxlines: 8,
    placeholder: "Describe the task",
    "send-composing-input": true,
    bindinput: props.onInput,
  });
}

function KanbanTaskProjectOption(props: {
  readonly disabled: boolean;
  readonly project: ProjectSummary;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `KanbanNewTaskProject${props.selected ? " KanbanNewTaskProject--selected" : ""}`,
    accessibleLabel: `Create task in ${props.project.title}`,
    disabled: props.disabled,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-selected={props.selected}
      accessibility-role="radio"
      accessibility-state={{ selected: props.selected }}
      {...interaction.eventProps}
    >
      <text className="KanbanNewTaskProjectText">{props.project.title}</text>
    </view>
  );
}

function KanbanTaskDraftSwitch(props: {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `KanbanNewTaskDraftSwitch${
      props.checked ? " KanbanNewTaskDraftSwitch--checked" : ""
    }`,
    accessibleLabel: "Send as draft",
    disabled: props.disabled,
    onActivate: () => props.onChange(!props.checked),
  });
  return (
    <view
      className="KanbanNewTaskDraftToggle"
      accessibility-role="switch"
      accessibility-state={{
        checked: props.checked,
        disabled: props.disabled,
      }}
    >
      <view className={interaction.className} {...interaction.eventProps}>
        <view className="KanbanNewTaskDraftSwitchThumb" />
      </view>
      <text className="KanbanNewTaskDraftLabel">Send as draft</text>
    </view>
  );
}

export function KanbanNewTaskDialog(props: {
  readonly dispatchCommand?: DispatchCommand;
  readonly fetchShellSnapshot?: FetchShellSnapshot;
  readonly initialProjectId: ProjectId | null;
  readonly initialSendAsDraft?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onTaskCreated: (threadId: string, started: boolean) => void;
  readonly projects: readonly ProjectSummary[];
}) {
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const dispatchCommand = props.dispatchCommand ?? dispatchKanbanTaskCommand;
  const fetchShellSnapshot = props.fetchShellSnapshot ?? fetchKanbanTaskShellSnapshot;
  const initialProject =
    props.projects.find((project) => project.id === props.initialProjectId) ??
    props.projects[0] ??
    null;
  const threadIdRef = useRef(createNativeKanbanTaskId("thread"));
  const creationStateRef = useRef<ThreadCreationState>({
    created: false,
    inFlight: null,
  });
  const submittingRef = useRef(false);
  const composingRef = useRef(false);
  const [projectId, setProjectId] = useState<ProjectId | null>(
    initialProject?.id as ProjectId | null,
  );
  const [prompt, setPrompt] = useState("");
  const [sendAsDraft, setSendAsDraft] = useState(props.initialSendAsDraft ?? false);
  const [pendingAction, setPendingAction] = useState<"draft" | "start" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentProject = props.projects.find((project) => project.id === projectId) ?? null;
  const modelSelection: ModelSelection = currentProject?.defaultModelSelection ?? {
    provider: generalSettings.defaultProvider,
    model: getDefaultModel(generalSettings.defaultProvider),
  };
  const normalizedPrompt = prompt.trim();
  const canCreate =
    currentProject !== null && normalizedPrompt.length > 0 && pendingAction === null;

  const persistDraft = async () => {
    "background only";
    if (!currentProject || !normalizedPrompt) {
      throw new Error("Choose a project and describe the task.");
    }
    const threadId = threadIdRef.current;
    const draftStore = useComposerDraftStore.getState();
    draftStore.setPrompt(threadId, normalizedPrompt);
    draftStore.setModelSelection(threadId, modelSelection);
    await ensureThreadCreated({
      state: creationStateRef.current,
      create: () =>
        dispatchCommand(
          buildNativeKanbanTaskCreateCommand({
            commandId: createNativeKanbanTaskId("command"),
            createdAt: new Date().toISOString(),
            envMode: generalSettings.defaultThreadEnvMode,
            modelSelection,
            projectId: currentProject.id as ProjectId,
            prompt: normalizedPrompt,
            threadId,
          }),
        ).then(() => undefined),
      recover: async () =>
        (await fetchShellSnapshot()).threads.some((thread) => thread.id === threadId),
    });
    await queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
    return threadId;
  };

  const createTask = (start: boolean) => {
    "background only";
    if (!canCreate || submittingRef.current || composingRef.current) return;
    submittingRef.current = true;
    setPendingAction(start ? "start" : "draft");
    setError(null);
    void persistDraft()
      .then(async (threadId) => {
        if (start) {
          await dispatchCommand(
            buildComposerTurnStartCommand({
              commandId: createNativeKanbanTaskId("command"),
              createdAt: new Date().toISOString(),
              interactionMode: "default",
              messageId: createNativeKanbanTaskId("message"),
              modelSelection,
              runtimeMode: "full-access",
              text: normalizedPrompt,
              threadId,
            }),
          );
          useComposerDraftStore.getState().clearDraft(threadId);
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]);
        props.onTaskCreated(threadId, start);
        props.onOpenChange(false);
      })
      .catch((creationError: unknown) => {
        if (!creationStateRef.current.created) {
          useComposerDraftStore.getState().discardDraft(threadIdRef.current);
        }
        setError(
          creationError instanceof Error ? creationError.message : "Couldn't create the task.",
        );
      })
      .finally(() => {
        submittingRef.current = false;
        setPendingAction(null);
      });
  };

  const handleOpenChange = (open: boolean) => {
    "background only";
    if (!open && !creationStateRef.current.created) {
      useComposerDraftStore.getState().discardDraft(threadIdRef.current);
    }
    props.onOpenChange(open);
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogPopup className="KanbanNewTaskDialog">
        <view className="KanbanNewTaskHeader">
          <SynaraLogo className="KanbanNewTaskMark" aria-label="Synara" />
          <view className="KanbanNewTaskHeaderCopy">
            <DialogTitle className="KanbanNewTaskTitle">New task</DialogTitle>
            <DialogDescription className="KanbanNewTaskDescription">
              Add a draft or start work immediately.
            </DialogDescription>
          </view>
        </view>
        <DialogPanel className="KanbanNewTaskPanel">
          <view className="KanbanNewTaskProjectRow">
            <text className="KanbanNewTaskProjectLabel">Project</text>
            <scroll-view className="KanbanNewTaskProjects" scroll-orientation="horizontal">
              <view className="KanbanNewTaskProjectOptions">
                {props.projects.map((project) => (
                  <KanbanTaskProjectOption
                    key={project.id}
                    disabled={pendingAction !== null || creationStateRef.current.created}
                    project={project}
                    selected={project.id === projectId}
                    onSelect={() => setProjectId(project.id as ProjectId)}
                  />
                ))}
              </view>
            </scroll-view>
          </view>
          <NativeTaskTextarea
            disabled={pendingAction !== null}
            value={prompt}
            onInput={(event) => {
              "background only";
              composingRef.current = event.detail.isComposing;
              setPrompt(event.detail.value);
              setError(null);
            }}
          />
          {error ? (
            <view className="KanbanNewTaskError" accessibility-element accessibility-role="alert">
              <text className="KanbanNewTaskErrorText">{error}</text>
            </view>
          ) : null}
        </DialogPanel>
        <DialogFooter className="KanbanNewTaskFooter">
          <KanbanTaskDraftSwitch
            checked={sendAsDraft}
            disabled={pendingAction !== null}
            onChange={setSendAsDraft}
          />
          <Button variant="default" disabled={!canCreate} onClick={() => createTask(!sendAsDraft)}>
            {pendingAction ? "Creating…" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
