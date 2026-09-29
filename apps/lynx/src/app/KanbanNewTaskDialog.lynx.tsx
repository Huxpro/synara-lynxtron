import type {
  ClientOrchestrationCommand,
  ModelSelection,
  OrchestrationShellSnapshot,
  ProjectId,
  ProviderInteractionMode,
  ProviderKind,
  RuntimeMode,
} from "@synara/contracts";
import { createElement, useRef, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import { ComposerReferenceAttachmentsComposition } from "@synara-web/components/chat/ComposerReferenceAttachmentsComposition";
import { ComposerRuntimeModeControlComposition } from "@synara-web/components/chat/ComposerRuntimeModeControlComposition";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import laptopSvg from "@synara-central-icons/macbook-air.svg?raw";
import worktreeSvg from "@synara-central-icons/arrow-split-right.svg?raw";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { ComposerModelControl } from "../components/composer/ComposerModelControl.lynx";
import {
  ComposerVoiceButton,
  ComposerVoiceRecorderBar,
} from "../components/composer/ComposerVoiceControls.lynx";
import {
  releasePickedComposerFile,
  resolvePickedComposerFiles,
  stageNativeComposerFiles,
  type NativeComposerImageAttachment,
} from "../components/composer/composerAttachments.lynx";
import { buildComposerTurnStartCommand } from "../components/composer/composerDispatch.logic";
import {
  ensureThreadCreated,
  type ThreadCreationState,
} from "../components/composer/landingThreadCreation.logic";
import { useNativeComposerVoice } from "../components/composer/useNativeComposerVoice.lynx";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ListDetailsIcon,
  PaperclipIcon,
  PlusIcon,
} from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { dialogs } from "../platform/dialogs";
import { webStorage } from "../platform/storage";
import {
  fetchAutomationCreateModels,
  fetchAutomationCreateServerConfig,
  queryClient,
  resolveNativeAssistantDeliveryMode,
  type ProjectSummary,
} from "./queries";
import {
  buildNativeKanbanTaskCreateCommand,
  createNativeKanbanTaskId,
} from "./kanbanTaskCreation.logic";
import { defaultModelSelectionForProvider } from "../lib/defaultModelSelection";

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

const NO_ATTACHMENTS: readonly never[] = [];
const NO_IMAGE_IDS: ReadonlySet<string> = new Set();

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
    maxlines: 20,
    placeholder: "Describe the task, @tag files/folders, paste images, or use / for skills",
    "send-composing-input": true,
    bindinput: props.onInput,
  });
}

// Web KanbanTaskProjectPicker: an outline chip in the breadcrumb header.
function KanbanTaskProjectPicker(props: {
  readonly disabled: boolean;
  readonly projects: readonly ProjectSummary[];
  readonly selectedProjectId: ProjectId | null;
  readonly onProjectIdChange: (projectId: ProjectId) => void;
}) {
  const selected = props.projects.find((project) => project.id === props.selectedProjectId);
  return (
    <Menu>
      <MenuTrigger
        ariaLabel="Choose the project for this task"
        className="KanbanNewTaskProjectTrigger"
        disabled={props.disabled || props.projects.length === 0}
      >
        <text className="KanbanNewTaskProjectTriggerText">{selected?.title ?? "No project"}</text>
        <ChevronDownIcon
          className="KanbanNewTaskProjectTriggerChevron"
          color="var(--muted-foreground)"
          size={12}
        />
      </MenuTrigger>
      <MenuPopup align="start" side="bottom" className="LxPickerMenuPopup KanbanNewTaskMenu">
        <MenuRadioGroup
          value={props.selectedProjectId ?? ""}
          onValueChange={(value) => props.onProjectIdChange(value as ProjectId)}
        >
          {props.projects.map((project) => (
            <MenuRadioItem key={project.id} value={project.id}>
              {project.title}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

// Web KanbanTaskExtrasMenu: plan mode and the Local/Worktree start mode.
function KanbanTaskExtrasMenu(props: {
  readonly envMode: "local" | "worktree";
  readonly interactionMode: ProviderInteractionMode;
  readonly onEnvModeChange: (envMode: "local" | "worktree") => void;
  readonly onInteractionModeChange: (mode: ProviderInteractionMode) => void;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <Menu>
      <MenuTrigger ariaLabel="Task options" className="KanbanNewTaskIconButton">
        <PlusIcon color={semanticIconColor("secondary")} size={16} />
      </MenuTrigger>
      <MenuPopup align="start" side="top" className="LxPickerMenuPopup KanbanNewTaskMenu">
        <MenuCheckboxItem
          checked={props.interactionMode === "plan"}
          variant="switch"
          onCheckedChange={(checked) => props.onInteractionModeChange(checked ? "plan" : "default")}
        >
          <view className="KanbanNewTaskMenuRow">
            <ListDetailsIcon color={semanticIconColor("primary")} size={16} />
            <text className="KanbanNewTaskMenuText">Plan mode</text>
          </view>
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuRadioGroup
          value={props.envMode}
          onValueChange={(value) => {
            if (value === "local" || value === "worktree") props.onEnvModeChange(value);
          }}
        >
          <MenuRadioItem value="local">
            <view className="KanbanNewTaskMenuRow">
              <svg
                className="KanbanNewTaskMenuIcon"
                content={colorizeLynxSvg(laptopSvg, semanticIconColor("primary"))}
              />
              <text className="KanbanNewTaskMenuText">Local</text>
            </view>
          </MenuRadioItem>
          <MenuRadioItem value="worktree">
            <view className="KanbanNewTaskMenuRow">
              <svg
                className="KanbanNewTaskMenuIcon"
                content={colorizeLynxSvg(worktreeSvg, semanticIconColor("primary"))}
              />
              <text className="KanbanNewTaskMenuText">Worktree</text>
            </view>
          </MenuRadioItem>
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
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
    // The focusable control reports its state like the other Native switches.
    accessibilityValue: props.checked ? "On" : "Off",
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

function KanbanTaskAttachButton(props: {
  readonly disabled: boolean;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "KanbanNewTaskIconButton KanbanNewTaskAttach",
    accessibleLabel: "Attach images",
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <PaperclipIcon color={semanticIconColor("secondary")} size={16} />
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
  const threadId = threadIdRef.current;
  const creationStateRef = useRef<ThreadCreationState>({
    created: false,
    inFlight: null,
  });
  const submittingRef = useRef(false);
  const composingRef = useRef(false);
  const [projectId, setProjectId] = useState<ProjectId | null>(
    initialProject?.id as ProjectId | null,
  );
  const [prompt, setPromptState] = useState("");
  // The prompt field is uncontrolled; a voice transcript remounts it with the new text.
  const [promptFieldEpoch, setPromptFieldEpoch] = useState(0);
  const [sendAsDraft, setSendAsDraft] = useState(props.initialSendAsDraft ?? false);
  const [pendingAction, setPendingAction] = useState<"draft" | "start" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>("full-access");
  const [interactionMode, setInteractionMode] = useState<ProviderInteractionMode>("default");
  const [envMode, setEnvMode] = useState<"local" | "worktree">(
    generalSettings.defaultThreadEnvMode,
  );
  const currentProject = props.projects.find((project) => project.id === projectId) ?? null;
  const [modelSelectionOverride, setModelSelectionOverride] = useState<ModelSelection | null>(null);
  // Web useKanbanTaskScratchDraft: the default provider's model, not the project default.
  const modelSelection: ModelSelection =
    modelSelectionOverride ?? defaultModelSelectionForProvider(generalSettings.defaultProvider);
  const [modelCatalogProvider, setModelCatalogProvider] = useState<ProviderKind>(
    modelSelection.provider,
  );
  const serverConfig = useQuery({
    queryKey: ["kanban-new-task", "server-config"],
    queryFn: fetchAutomationCreateServerConfig,
    staleTime: 30_000,
  });
  const modelCatalog = useQuery({
    queryKey: [
      "kanban-new-task",
      "models",
      modelCatalogProvider,
      currentProject?.workspaceRoot ?? null,
    ],
    queryFn: () =>
      fetchAutomationCreateModels({
        provider: modelCatalogProvider,
        cwd: currentProject?.workspaceRoot ?? null,
      }),
    staleTime: 60_000,
  });
  const images = useComposerDraftStore(
    (state) => state.draftsByThreadId[threadId]?.images ?? NO_ATTACHMENTS,
  ) as readonly NativeComposerImageAttachment[];
  const normalizedPrompt = prompt.trim();
  const busy = pendingAction !== null;
  const canCreate =
    currentProject !== null && (normalizedPrompt.length > 0 || images.length > 0) && !busy;
  const providerStatuses = serverConfig.data?.providers ?? [];
  const voice = useNativeComposerVoice({
    enabled: true,
    draftKey: threadId,
    threadId,
    provider: modelSelection.provider,
    providerStatuses,
    workspaceRoot: currentProject?.workspaceRoot ?? null,
    pendingUserInputCount: 0,
    readPrompt: () => prompt,
    onTranscript: (_draftKey, nextPrompt) => {
      setPromptState(nextPrompt);
      setPromptFieldEpoch((current) => current + 1);
      setError(null);
    },
    onActionStart: () => setError(null),
  });
  const voiceActive = voice.isRecording || voice.isTranscribing;

  const releaseImages = (entries: readonly NativeComposerImageAttachment[]) => {
    "background only";
    for (const image of entries) void releasePickedComposerFile(image.token);
  };

  const attachImages = async () => {
    "background only";
    setError(null);
    try {
      const picked = await dialogs.pickFiles();
      const resolved = await resolvePickedComposerFiles({
        existingAttachmentCount: images.length,
        files: picked.files,
      });
      // The web dialog accepts images only (accept="image/*").
      await Promise.all([
        ...resolved.rejectedTokens.map((token) => releasePickedComposerFile(token)),
        ...resolved.files.map((file) => releasePickedComposerFile(file.token)),
      ]);
      if (resolved.images.length > 0) {
        useComposerDraftStore.getState().addImages(threadId, resolved.images);
      }
      const pickError = resolved.error ?? picked.errors[picked.errors.length - 1] ?? null;
      if (pickError) setError(pickError);
    } catch (pickError) {
      setError(`Unable to add images: ${String(pickError)}`);
    }
  };

  const persistDraft = async () => {
    "background only";
    if (!currentProject || (!normalizedPrompt && images.length === 0)) {
      throw new Error("Choose a project and describe the task.");
    }
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
            envMode,
            interactionMode,
            modelSelection,
            projectId: currentProject.id as ProjectId,
            prompt: normalizedPrompt || "Review the attachment.",
            runtimeMode,
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
      .then(async (createdThreadId) => {
        if (start) {
          const text = normalizedPrompt || "Review the attachment.";
          const staged = await stageNativeComposerFiles({
            files: images,
            threadId: createdThreadId,
          });
          const assistantDeliveryMode = await resolveNativeAssistantDeliveryMode();
          await staged.runWithDispatch((attachments) =>
            dispatchCommand(
              buildComposerTurnStartCommand({
                assistantDeliveryMode,
                attachments,
                commandId: createNativeKanbanTaskId("command"),
                createdAt: new Date().toISOString(),
                interactionMode,
                messageId: createNativeKanbanTaskId("message"),
                modelSelection,
                runtimeMode,
                text,
                threadId: createdThreadId,
              }),
            ),
          );
          useComposerDraftStore.getState().clearDraft(createdThreadId);
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]);
        props.onTaskCreated(createdThreadId, start);
        props.onOpenChange(false);
      })
      .catch((creationError: unknown) => {
        if (!creationStateRef.current.created) {
          useComposerDraftStore.getState().discardDraft(threadId);
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
      releaseImages(images);
      useComposerDraftStore.getState().discardDraft(threadId);
    }
    props.onOpenChange(open);
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogPopup className="KanbanNewTaskDialog">
        {/* Web: Linear-style breadcrumb header, project chip › title. */}
        <view className="KanbanNewTaskHeader">
          <KanbanTaskProjectPicker
            disabled={busy || creationStateRef.current.created}
            projects={props.projects}
            selectedProjectId={projectId}
            onProjectIdChange={setProjectId}
          />
          <ChevronRightIcon
            className="KanbanNewTaskBreadcrumb"
            color="var(--muted-foreground)"
            size={14}
          />
          <DialogTitle className="KanbanNewTaskTitle">New task</DialogTitle>
          <DialogDescription className="KanbanNewTaskDescription">
            Draft a prompt and place it in the board's Draft column. Drag it to In Progress to send
            it.
          </DialogDescription>
        </view>
        <DialogPanel className="KanbanNewTaskPanel">
          <ComposerReferenceAttachmentsComposition
            assistantSelections={NO_ATTACHMENTS}
            fileComments={NO_ATTACHMENTS}
            files={NO_ATTACHMENTS}
            images={images as never}
            nonPersistedImageIdSet={NO_IMAGE_IDS}
            onExpandImage={() => {}}
            onRemoveAssistantSelections={() => {}}
            onRemoveFileComments={() => {}}
            onRemoveFile={() => {}}
            onRemoveImage={(imageId) => {
              "background only";
              const image = images.find((entry) => entry.id === imageId);
              useComposerDraftStore.getState().removeImage(threadId, imageId);
              if (image) void releasePickedComposerFile(image.token);
            }}
          />
          <NativeTaskTextarea
            key={promptFieldEpoch}
            disabled={busy || voice.isTranscribing}
            value={prompt}
            onInput={(event) => {
              "background only";
              composingRef.current = event.detail.isComposing;
              setPromptState(event.detail.value);
              setError(null);
            }}
          />
          {error ? (
            <view className="KanbanNewTaskError" accessibility-element accessibility-role="alert">
              <text className="KanbanNewTaskErrorText">{error}</text>
            </view>
          ) : null}
        </DialogPanel>
        <view className="KanbanNewTaskFooter">
          <view className="KanbanNewTaskChips">
            {voiceActive ? (
              <ComposerVoiceRecorderBar
                durationLabel={`${Math.floor(voice.durationMs / 60000)}:${Math.floor(
                  (voice.durationMs % 60000) / 1000,
                )
                  .toString()
                  .padStart(2, "0")}`}
                waveformLevels={voice.waveformLevels}
                transcribing={voice.isTranscribing}
                onCancel={() => voice.cancel()}
                onSubmit={() => void voice.submit()}
              />
            ) : (
              <>
                <view className="KanbanNewTaskChipsLeading">
                  <KanbanTaskExtrasMenu
                    envMode={envMode}
                    interactionMode={interactionMode}
                    onEnvModeChange={setEnvMode}
                    onInteractionModeChange={setInteractionMode}
                  />
                  <ComposerRuntimeModeControlComposition
                    runtimeMode={runtimeMode}
                    onRuntimeModeChange={setRuntimeMode}
                  />
                </view>
                <view className="KanbanNewTaskChipsTrailing">
                  <ComposerModelControl
                    hideStatusLabel
                    triggerVariant="picker"
                    splitTraits
                    modelSelection={modelSelection}
                    catalogProvider={modelCatalogProvider}
                    runtimeModels={modelCatalog.data?.models ?? []}
                    modelsLoading={
                      modelCatalog.isPending || (modelCatalog.isFetching && !modelCatalog.data)
                    }
                    providers={providerStatuses}
                    onCatalogProviderChange={setModelCatalogProvider}
                    onModelSelectionChange={(selection) => {
                      setModelSelectionOverride(selection);
                      setModelCatalogProvider(selection.provider);
                    }}
                  />
                </view>
              </>
            )}
          </view>
          <view className="KanbanNewTaskBottomBar">
            <view className="KanbanNewTaskBottomLeading">
              {!voiceActive ? (
                <KanbanTaskAttachButton disabled={busy} onActivate={() => void attachImages()} />
              ) : null}
              {!voiceActive && voice.showVoiceNotesControl ? (
                <ComposerVoiceButton
                  disabled={!currentProject || busy}
                  onActivate={() => void voice.start()}
                />
              ) : null}
            </view>
            <view className="KanbanNewTaskBottomTrailing">
              <KanbanTaskDraftSwitch
                checked={sendAsDraft}
                disabled={busy}
                onChange={setSendAsDraft}
              />
              <Button
                size="sm"
                variant="default"
                disabled={!canCreate}
                onClick={() => createTask(!sendAsDraft)}
              >
                {pendingAction ? "Creating..." : "Create task"}
              </Button>
            </view>
          </view>
        </view>
      </DialogPopup>
    </Dialog>
  );
}
