import { useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";

import type { KanbanCard } from "@synara-web/components/kanban/kanban.logic";
import { isKanbanDraftOnlyCard } from "@synara-web/components/kanban/kanban.logic";
import {
  KANBAN_MUTATION_COPY,
  createKanbanMutationGate,
  resolveKanbanCardActions,
  type KanbanCardActionId,
  type KanbanMutationActionId,
} from "@synara-web/components/kanban/kanbanMutation.logic";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import { resolveThreadWorkspaceCwd } from "@synara/shared/threadEnvironment";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { Button } from "../components/ui/button";
import {
  buildNativeThreadContextCommand,
  nativeThreadContextConfirmation,
} from "../components/sidebar/threadContextActions.logic";
import { webStorage } from "../platform/storage";
import {
  fetchThreadHeaderSummary,
  queryClient,
  resolveNativeAssistantDeliveryMode,
} from "./queries";
import {
  buildNativeKanbanArchiveCommand,
  buildNativeKanbanRenameCommand,
  buildNativeKanbanStartCommand,
  resolveNativeKanbanMutationError,
} from "./kanbanMutation.logic";

interface KanbanMutationTarget {
  readonly action: KanbanMutationActionId;
  readonly card: KanbanCard;
  readonly value: string;
  readonly error: string | null;
}

function newKanbanCommandId(kind: string): string {
  return `lynx-kanban-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface NativeKanbanCardActionsController {
  readonly actionPanels: ReactNode;
  readonly mutationPending: boolean;
  readonly openCardActions: (card: KanbanCard) => void;
  readonly openCardContextMenu: (
    card: KanbanCard,
    event: React.MouseEvent,
    restoreFocus?: () => void,
  ) => Promise<void>;
  readonly showNotice: (notice: string) => void;
  readonly startCard: (card: KanbanCard, prompt: string) => Promise<void>;
  readonly selectAction: (card: KanbanCard, action: KanbanCardActionId) => Promise<void>;
}

export function useNativeKanbanCardActions(input: {
  readonly projectWorkspaceRoot: (projectId: string) => string | null;
}): NativeKanbanCardActionsController {
  const [mutationTarget, setMutationTarget] = useState<KanbanMutationTarget | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationNotice, setMutationNotice] = useState<string | null>(null);
  const [mutationChooserCard, setMutationChooserCard] = useState<KanbanCard | null>(null);
  const mutationGateRef = useRef(createKanbanMutationGate());
  const mutationTextareaRef = useRef<React.ElementRef<"textarea">>(null);

  const workspacePathForCard = (card: KanbanCard) =>
    resolveThreadWorkspaceCwd({
      projectCwd: input.projectWorkspaceRoot(card.projectId),
      envMode: card.envMode,
      worktreePath: card.worktreePath,
    });

  const actionsForCard = (card: KanbanCard) =>
    resolveKanbanCardActions(card, {
      canSupplyStartPrompt: true,
      deleteAvailable: card.column !== "inProgress",
      copyPathAvailable: workspacePathForCard(card) !== null,
    });

  const executeMutation = async (target: KanbanMutationTarget) => {
    "background only";
    const { card, action } = target;
    if (!mutationGateRef.current.tryAcquire(card.threadId)) return;
    setMutationPending(true);
    setMutationTarget({ ...target, error: null });
    try {
      const { dispatchSynaraCommand } = await import(
        /* webpackMode: "eager" */ "../data/synaraClient"
      );
      let command;
      if (action === "start") {
        const text = target.value.trim();
        if (text.length === 0) {
          throw new Error("Write a prompt before starting this task.");
        }
        const summary = await fetchThreadHeaderSummary(card.threadId);
        if (!summary) throw new Error("This task is no longer available.");
        command = buildNativeKanbanStartCommand({
          assistantDeliveryMode: await resolveNativeAssistantDeliveryMode(),
          commandId: newKanbanCommandId("start"),
          createdAt: new Date().toISOString(),
          interactionMode: summary.interactionMode,
          messageId: newKanbanCommandId("message"),
          modelSelection: summary.modelSelection,
          runtimeMode: summary.runtimeMode,
          text,
          threadId: card.threadId,
        });
      } else if (action === "rename") {
        const title = target.value.trim();
        if (title.length === 0) throw new Error("Task name cannot be empty.");
        command = buildNativeKanbanRenameCommand({
          commandId: newKanbanCommandId("rename"),
          threadId: card.threadId,
          title,
        });
      } else {
        command = buildNativeKanbanArchiveCommand({
          commandId: newKanbanCommandId("archive"),
          threadId: card.threadId,
        });
      }
      await dispatchSynaraCommand(command);
      await queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
      setMutationNotice(KANBAN_MUTATION_COPY[action].success);
      setMutationTarget(null);
    } catch (error) {
      setMutationTarget({
        ...target,
        error: resolveNativeKanbanMutationError(error),
      });
    } finally {
      mutationGateRef.current.release(card.threadId);
      setMutationPending(false);
    }
  };

  const selectAction = async (card: KanbanCard, action: KanbanCardActionId) => {
    "background only";
    setMutationChooserCard(null);
    setMutationNotice(null);
    const isDraftOnly = isKanbanDraftOnlyCard(card);
    const workspacePath = workspacePathForCard(card);
    try {
      if (action === "copy-path" || action === "copy-thread-id") {
        const { clipboard } = await import(/* webpackMode: "eager" */ "../platform/clipboard");
        await clipboard.writeText(action === "copy-path" ? (workspacePath ?? "") : card.threadId);
        setMutationNotice(action === "copy-path" ? "Task path copied" : "Task ID copied");
        return;
      }
      if (action === "delete" && (card.thread === null || isDraftOnly)) {
        const settings = readSettingsBehaviorProjection(
          webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
        );
        if (settings.confirmThreadDelete) {
          const { dialogs } = await import(/* webpackMode: "eager" */ "../platform/dialogs");
          if (!(await dialogs.confirm("Delete this draft? This removes its unsent prompt."))) {
            return;
          }
        }
        if (card.thread === null) {
          useComposerDraftStore.getState().discardDraft(card.threadId);
        } else {
          useComposerDraftStore.getState().clearDraft(card.threadId);
        }
        setMutationNotice("Draft deleted");
        return;
      }
      if (action === "toggle-pin" || action === "delete") {
        const settings = readSettingsBehaviorProjection(
          webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
        );
        const confirmation = nativeThreadContextConfirmation(action, card.title, settings);
        if (confirmation) {
          const { dialogs } = await import(/* webpackMode: "eager" */ "../platform/dialogs");
          if (!(await dialogs.confirm(confirmation))) return;
        }
        const command = buildNativeThreadContextCommand({
          action,
          commandId: newKanbanCommandId(action),
          isPinned: card.thread?.isPinned ?? false,
          threadId: card.threadId,
        });
        if (!command) return;
        const { dispatchSynaraCommand } = await import(
          /* webpackMode: "eager" */ "../data/synaraClient"
        );
        await dispatchSynaraCommand(command);
        await queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
        setMutationNotice(
          action === "toggle-pin"
            ? card.thread?.isPinned
              ? "Task unpinned"
              : "Task pinned"
            : "Task deleted",
        );
        return;
      }
    } catch (error) {
      setMutationNotice(resolveNativeKanbanMutationError(error));
      return;
    }
    if (action === "archive") {
      const { dialogs } = await import(/* webpackMode: "eager" */ "../platform/dialogs");
      const confirmed = await dialogs.confirm(
        [
          `Archive task "${card.title}"?`,
          "Archived tasks leave this board and can be restored later.",
        ].join("\n"),
      );
      if (!confirmed) return;
      const target = { action, card, value: "", error: null } as const;
      setMutationTarget(target);
      await executeMutation(target);
      return;
    }
    setMutationTarget({
      action,
      card,
      value: action === "rename" ? card.title : "",
      error: null,
    });
  };

  const openCardContextMenu = async (
    card: KanbanCard,
    event: React.MouseEvent,
    restoreFocus?: () => void,
  ) => {
    "background only";
    event.preventDefault();
    event.stopPropagation();
    const actions = actionsForCard(card);
    if (actions.length === 0) return;
    const { showContextMenu } = await import(/* webpackMode: "eager" */ "../platform/contextMenu");
    const action = await showContextMenu(
      actions,
      {
        x: event.clientX,
        y: event.clientY,
      },
      { restoreFocus },
    );
    if (action) await selectAction(card, action);
  };

  useEffect(() => {
    "background only";
    if (
      !mutationTarget ||
      (mutationTarget.action !== "start" && mutationTarget.action !== "rename")
    )
      return;
    const value = mutationTarget.value;
    mutationTextareaRef.current?.invoke({ method: "setValue", params: { value } }).exec();
    mutationTextareaRef.current
      ?.invoke({
        method: "setSelectionRange",
        params: { selectionStart: value.length, selectionEnd: value.length },
      })
      .exec();
  }, [mutationTarget?.action, mutationTarget?.card.threadId]);

  const mutationCopy = mutationTarget ? KANBAN_MUTATION_COPY[mutationTarget.action] : null;

  const actionPanels = (
    <>
      {mutationNotice ? (
        <view
          className="KanbanMutationNotice"
          accessibility-element
          accessibility-label={mutationNotice}
        >
          <text className="KanbanMutationNoticeText">{mutationNotice}</text>
        </view>
      ) : null}
      {mutationChooserCard ? (
        <view
          className="KanbanMutationPanel"
          accessibility-element
          accessibility-label={`Actions for ${mutationChooserCard.title}`}
        >
          <view className="KanbanMutationPanelHeader">
            <text className="KanbanMutationPanelTitle">Task actions</text>
            <text className="KanbanMutationPanelTask" maxlines={1}>
              {mutationChooserCard.title}
            </text>
          </view>
          <view className="KanbanMutationActions KanbanMutationActions--chooser">
            {actionsForCard(mutationChooserCard).map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.destructive ? "destructive-outline" : "outline"}
                onClick={() => void selectAction(mutationChooserCard, action.id)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setMutationChooserCard(null)}>
              Cancel
            </Button>
          </view>
        </view>
      ) : null}
      {mutationTarget ? (
        <view
          className="KanbanMutationPanel"
          accessibility-element
          accessibility-label={`${mutationTarget.action} ${mutationTarget.card.title}`}
        >
          <view className="KanbanMutationPanelHeader">
            <text className="KanbanMutationPanelTitle">
              {mutationTarget.action === "start"
                ? "Start task"
                : mutationTarget.action === "rename"
                  ? "Rename task"
                  : mutationPending
                    ? mutationCopy?.pending
                    : mutationCopy?.error}
            </text>
            <text className="KanbanMutationPanelTask" maxlines={1}>
              {mutationTarget.card.title}
            </text>
          </view>
          {mutationTarget.action === "start" || mutationTarget.action === "rename" ? (
            <textarea
              ref={mutationTextareaRef}
              key={`${mutationTarget.action}:${mutationTarget.card.threadId}`}
              className={`KanbanMutationTextarea${mutationTarget.error ? " KanbanMutationTextarea--invalid" : ""}`}
              default-value={mutationTarget.value}
              readonly={mutationPending}
              aria-label={mutationTarget.action === "start" ? "Task instructions" : "Task name"}
              aria-invalid={Boolean(mutationTarget.error)}
              accessibility-element
              accessibility-label={
                mutationTarget.action === "start" ? "Task instructions" : "Task name"
              }
              placeholder={
                mutationTarget.action === "start" ? "What should the agent do?" : "Task name"
              }
              maxlength={8000}
              maxlines={4}
              bindinput={(event) => {
                "background only";
                setMutationTarget((current) =>
                  current ? { ...current, value: event.detail.value, error: null } : current,
                );
              }}
            />
          ) : null}
          {mutationTarget.error ? (
            <text className="KanbanMutationError" accessibility-element accessibility-role="alert">
              {mutationTarget.error}
            </text>
          ) : null}
          <view className="KanbanMutationActions">
            <Button
              size="sm"
              variant="ghost"
              disabled={mutationPending}
              onClick={() => setMutationTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                mutationPending ||
                ((mutationTarget.action === "start" || mutationTarget.action === "rename") &&
                  mutationTarget.value.trim().length === 0)
              }
              onClick={() => void executeMutation(mutationTarget)}
            >
              {mutationPending
                ? mutationCopy?.pending
                : mutationTarget.error
                  ? KANBAN_MUTATION_COPY.retry
                  : mutationTarget.action === "start"
                    ? "Start"
                    : mutationTarget.action === "rename"
                      ? "Save"
                      : KANBAN_MUTATION_COPY.retry}
            </Button>
          </view>
        </view>
      ) : null}
    </>
  );

  return {
    actionPanels,
    mutationPending,
    openCardActions(card) {
      setMutationTarget(null);
      setMutationNotice(null);
      setMutationChooserCard(card);
    },
    openCardContextMenu,
    showNotice: setMutationNotice,
    async startCard(card, prompt) {
      const target = { action: "start", card, value: prompt, error: null } as const;
      setMutationTarget(target);
      await executeMutation(target);
    },
    selectAction,
  };
}
