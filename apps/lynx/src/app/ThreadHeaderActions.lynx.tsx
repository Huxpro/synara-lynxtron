import { useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import {
  serverConfigQueryOptions,
  serverSettingsQueryOptions,
} from "@synara-web/lib/serverReactQuery";
import type { KeybindingRule, ModelSelection, ProjectScript } from "@synara/contracts";
import type { ThreadHandoffTarget } from "@synara-web/lib/threadHandoff";
import type { ThreadHeaderActionState } from "../logic/threadHeaderActions";
import {
  addProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "../logic/projectActionScripts";
import {
  decodeProjectScriptKeybindingRule,
  keybindingValueForCommand,
} from "@synara-web/lib/projectScriptKeybindings";
import { newCommandId } from "@synara-web/lib/utils";
import {
  commandForProjectScript,
  nextProjectScriptId,
  projectScriptRuntimeEnv,
} from "@synara-web/projectScripts";
import { DEFAULT_THREAD_TERMINAL_ID } from "@synara-web/types";
import handoffSvg from "@synara-central-icons/arrow-left-right.svg?raw";

import { ensureNativeApi } from "~/nativeApi";
import { PlusIcon, SettingsIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { platformTerminal } from "../platform/terminal";
import { Button } from "../components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { toastManager } from "../components/ui/toast.lynx";
import { useThreadHandoff } from "../generated/threadHandoff.generated";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import type { ThreadHeaderSummary } from "./queries";
import { withLeasedThreadDetail } from "./threadDetailLease.lynx";
import {
  resolveNativeContinueHandoffTargets,
  resolveNativeThreadHandoffTargets,
} from "./threadHandoff.lynx";
import { ProjectActionEditor, type ProjectActionEditorValue } from "./ProjectActionEditor.lynx";

import "./thread-header-actions.css";

interface HeaderProject {
  readonly id: string;
  readonly cwd: string;
  readonly defaultModelSelection: ModelSelection | null;
  readonly scripts: readonly ProjectScript[];
}

export function ProjectActionAddButton(props: {
  readonly compact: boolean;
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  return (
    <Button
      className="ThreadHeaderTextAction"
      disabled={props.disabled}
      size="xs"
      variant="chrome-outline"
      aria-label="Add action"
      onClick={props.onActivate}
    >
      <PlusIcon className="ThreadHeaderTextActionIcon" size={16} />
    </Button>
  );
}

/**
 * Drops every binding of one project-script command. Upstream's `reset` edit
 * restores the shipped bindings, which for a project-script command (none
 * shipped) leaves it unassigned.
 */
function resetProjectScriptKeybinding(scriptId: string) {
  "background only";
  return ensureNativeApi().server.editKeybindings({
    edits: [{ type: "reset", command: commandForProjectScript(scriptId) }],
  });
}

function commandId(prefix: string): never {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}` as never;
}

export function ThreadHeaderActions(props: {
  readonly actionState: Pick<ThreadHeaderActionState, "showHandoff" | "showProjectActions">;
  readonly onNavigateToThread: (threadId: string) => void;
  readonly onOpenTerminal: () => void;
  readonly project: HeaderProject | null;
  readonly thread: ThreadHeaderSummary | undefined;
  /** Kept for callers; Electron's header actions are icon-only at every width. */
  readonly compact: boolean;
}) {
  const { semanticIconColor } = useTheme();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<ProjectScript | null>(null);
  const [editingKeybinding, setEditingKeybinding] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thread = props.thread;
  const project = props.project;
  // Upstream's config and settings queries; session sync invalidates both, so
  // the hand-off targets follow a provider being enabled, disabled or going down.
  const serverConfig = useQuery(serverConfigQueryOptions());
  const serverSettings = useQuery(serverSettingsQueryOptions());
  const handoffTargets = resolveNativeThreadHandoffTargets(thread, {
    providerSettings: serverSettings.data?.providers ?? null,
    providerStatuses: serverConfig.data?.providers ?? [],
  });
  const continueHandoffTargets = resolveNativeContinueHandoffTargets(thread, handoffTargets);
  const handoffAllowed = handoffTargets.length > 0;
  // Upstream's hook: `continueThreadHandoff` keeps the thread and switches who runs its
  // next turn; `createThreadHandoff` opens a new thread with the imported transcript.
  const { continueThreadHandoff, createThreadHandoff } = useThreadHandoff();

  async function handOff(target: ThreadHandoffTarget, destination: "this-thread" | "new-thread") {
    "background only";
    if (!thread || !project || busy || !handoffAllowed) return;
    setBusy(true);
    setError(null);
    try {
      // The hook takes the store's thread, as upstream's header passes `activeThread`, and
      // waits on it for a handoff in place. The header's thread is the routed one, which
      // the thread page already leases; holding a lease here as well keeps the wait fed if
      // the user leaves the thread before the target provider has started.
      const nextThreadId = await withLeasedThreadDetail(thread.id, async (storeThread) => {
        if (destination === "this-thread") {
          await continueThreadHandoff(storeThread, target.provider, target.instanceId);
          return null;
        }
        return createThreadHandoff(storeThread, target.provider, target.instanceId);
      });
      // The hook already routed there; this records it as the last opened thread.
      if (nextThreadId) props.onNavigateToThread(nextThreadId);
    } catch (cause) {
      const title =
        destination === "this-thread"
          ? "Could not hand off this thread"
          : "Could not create handoff thread";
      const description =
        cause instanceof Error
          ? cause.message
          : destination === "this-thread"
            ? "An error occurred while handing off the thread."
            : "An error occurred while creating the handoff thread.";
      toastManager.add({ type: "error", title, description });
      // Lynx has no toast surface yet; the header's inline error line shows it.
      setError(`${title}: ${description}`);
    } finally {
      setBusy(false);
    }
  }

  async function runScript(script: ProjectScript) {
    "background only";
    if (!thread || !project || busy) return;
    setBusy(true);
    setError(null);
    props.onOpenTerminal();
    try {
      await platformTerminal.open({
        threadId: thread.id as never,
        terminalId: DEFAULT_THREAD_TERMINAL_ID,
        cwd: thread.worktreePath ?? project.cwd,
        env: projectScriptRuntimeEnv({
          project,
          worktreePath: thread.worktreePath,
        }),
        cols: 120,
        rows: 30,
      });
      await platformTerminal.write({
        threadId: thread.id as never,
        terminalId: DEFAULT_THREAD_TERMINAL_ID,
        data: `${script.command}\r`,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Failed to run ${script.name}.`);
    } finally {
      setBusy(false);
    }
  }

  function openActionEditor() {
    setError(null);
    setEditingScript(null);
    setEditingKeybinding(null);
    setActionDialogOpen(true);
  }

  async function openEditActionEditor(script: ProjectScript) {
    "background only";
    setError(null);
    setEditingScript(script);
    setEditingKeybinding(null);
    setActionDialogOpen(true);
    const config = await ensureNativeApi()
      .server.getConfig()
      .catch(() => null);
    setEditingKeybinding(
      config
        ? keybindingValueForCommand(config.keybindings, commandForProjectScript(script.id))
        : null,
    );
  }

  async function saveAction(value: ProjectActionEditorValue) {
    "background only";
    if (!project || busy) return;
    setBusy(true);
    setError(null);
    try {
      const scriptId =
        editingScript?.id ??
        nextProjectScriptId(
          value.name,
          project.scripts.map((script) => script.id),
        );
      const scripts = editingScript
        ? updateProjectAction(project.scripts, scriptId, value)
        : addProjectAction(project.scripts, scriptId, value);
      await ensureNativeApi().orchestration.dispatchCommand({
        type: "project.meta.update",
        commandId: commandId("lynx-project-action"),
        projectId: project.id as never,
        scripts,
      });
      const keybindingRule = decodeProjectScriptKeybindingRule({
        keybinding: value.keybinding,
        command: commandForProjectScript(scriptId),
      });
      if (keybindingRule) {
        await ensureNativeApi().server.upsertKeybinding({
          rule: keybindingRule as KeybindingRule,
        });
      } else {
        await resetProjectScriptKeybinding(scriptId);
      }
      setActionDialogOpen(false);
      setEditingScript(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add project action.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAction() {
    "background only";
    if (!project || !editingScript || busy) return;
    setBusy(true);
    setError(null);
    try {
      await ensureNativeApi().orchestration.dispatchCommand({
        type: "project.meta.update",
        commandId: commandId("lynx-project-action-delete"),
        projectId: project.id as never,
        scripts: deleteProjectAction(project.scripts, editingScript.id),
      });
      await resetProjectScriptKeybinding(editingScript.id);
      setActionDialogOpen(false);
      setEditingScript(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete project action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {props.actionState.showHandoff ? (
        <Menu>
          <MenuTrigger
            ariaLabel="Hand off thread"
            disabled={!project || busy || !handoffAllowed || handoffTargets.length === 0}
            render={
              <Button
                className="ThreadHeaderTextAction"
                disabled={!project || busy || !handoffAllowed || handoffTargets.length === 0}
                size="xs"
                variant="chrome-outline"
              />
            }
          >
            <svg
              className="ThreadHeaderTextActionIcon"
              content={colorizeLynxSvg(handoffSvg, semanticIconColor("primary"))}
            />
          </MenuTrigger>
          <MenuPopup
            align="end"
            className="LxComposerPickerMenuPopup LxPickerMenuPopup ThreadHeaderActionMenu ThreadHeaderHandoffMenu"
            side="bottom"
            sideOffset={4}
          >
            {continueHandoffTargets.length > 0 ? (
              <>
                <MenuGroup className="ThreadHeaderHandoffGroup--this-thread">
                  <MenuGroupLabel>Continue in this thread</MenuGroupLabel>
                  {continueHandoffTargets.map((target) => (
                    <MenuItem
                      key={target.instanceId}
                      onClick={() => void handOff(target, "this-thread")}
                    >
                      <OpenAIProviderIcon provider={target.provider} />
                      <text className="ThreadHeaderHandoffItemLabel">{target.label}</text>
                    </MenuItem>
                  ))}
                </MenuGroup>
                <MenuSeparator />
              </>
            ) : null}
            <MenuGroup className="ThreadHeaderHandoffGroup--new-thread">
              <MenuGroupLabel>Continue in a new thread</MenuGroupLabel>
              {handoffTargets.map((target) => (
                <MenuItem
                  key={target.instanceId}
                  onClick={() => void handOff(target, "new-thread")}
                >
                  <OpenAIProviderIcon provider={target.provider} />
                  <text className="ThreadHeaderHandoffItemLabel">{target.label}</text>
                </MenuItem>
              ))}
            </MenuGroup>
          </MenuPopup>
        </Menu>
      ) : null}
      {props.actionState.showProjectActions && (project?.scripts.length ?? 0) > 0 ? (
        <Menu>
          <MenuTrigger
            ariaLabel="Add action"
            disabled={!project || busy}
            render={
              <Button
                className="ThreadHeaderTextAction"
                disabled={!project || busy}
                size="xs"
                variant="chrome-outline"
              />
            }
          >
            <PlusIcon className="ThreadHeaderTextActionIcon" size={16} />
          </MenuTrigger>
          <MenuPopup align="end" className="ThreadHeaderActionMenu" side="bottom" sideOffset={6}>
            {project?.scripts.map((script) => (
              <MenuItem
                key={script.id}
                onClick={() => void runScript(script)}
                trailing={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Edit ${script.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void openEditActionEditor(script);
                    }}
                  >
                    <SettingsIcon size={14} color="var(--color-icon-secondary)" />
                  </Button>
                }
              >
                <text>{script.name}</text>
              </MenuItem>
            ))}
            <MenuItem onClick={openActionEditor}>
              <PlusIcon size={14} color="var(--color-icon-secondary)" />
              <text>Add action</text>
            </MenuItem>
          </MenuPopup>
        </Menu>
      ) : props.actionState.showProjectActions ? (
        <ProjectActionAddButton
          compact={props.compact}
          disabled={!project || busy}
          onActivate={openActionEditor}
        />
      ) : null}
      {props.actionState.showHandoff || props.actionState.showProjectActions ? (
        <view className="ThreadHeaderActionDivider" />
      ) : null}
      <ProjectActionEditor
        key={`${editingScript?.id ?? "new"}-${actionDialogOpen ? "open" : "closed"}-${editingKeybinding ?? ""}`}
        busy={busy}
        error={error}
        initialValue={
          editingScript
            ? {
                command: editingScript.command,
                icon: editingScript.icon,
                keybinding: editingKeybinding,
                name: editingScript.name,
                runOnWorktreeCreate: editingScript.runOnWorktreeCreate,
              }
            : undefined
        }
        open={actionDialogOpen}
        onOpenChange={(open) => {
          setActionDialogOpen(open);
          if (!open) setEditingScript(null);
        }}
        onDelete={editingScript ? deleteAction : undefined}
        onSave={saveAction}
      />
      {error && !actionDialogOpen ? (
        <text className="ThreadHeaderActionInlineError">{error}</text>
      ) : null}
    </>
  );
}
