import { useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type {
  KeybindingRule,
  ModelSelection,
  ProjectScript,
  ProviderKind,
} from "@synara/contracts";
import { PROVIDER_DISPLAY_NAMES } from "@synara/contracts";
import type { ThreadHeaderActionState } from "@synara/shared/threadHeaderActions";
import {
  addProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@synara/shared/projectActionScripts";
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

import { dispatchSynaraCommand } from "../data/synaraClient.lynx";
import { PlusIcon, SettingsIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { platformTerminal } from "../platform/terminal";
import { Button } from "../components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "../components/ui/menu.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { queryClient, type ThreadHeaderSummary } from "./queries";
import {
  createNativeThreadHandoff,
  fetchNativeThreadHandoffProviderContext,
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
      <PlusIcon className="ThreadHeaderTextActionIcon" size={14} />
      {!props.compact ? <text className="ThreadHeaderTextActionLabel">Add action</text> : null}
    </Button>
  );
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
  const handoffProviders = useQuery({
    queryKey: ["thread-handoff-providers"],
    queryFn: () => fetchNativeThreadHandoffProviderContext(),
  });
  const handoffTargets = resolveNativeThreadHandoffTargets(
    thread,
    handoffProviders.data ?? { providerSettings: null, providerStatuses: [] },
  );
  const handoffAllowed = handoffTargets.length > 0;

  async function createHandoff(targetProvider: ProviderKind) {
    "background only";
    if (!thread || !project || busy || !handoffAllowed) return;
    setBusy(true);
    setError(null);
    try {
      const nextThreadId = await createNativeThreadHandoff({
        project,
        targetProvider,
        thread,
      });
      props.onNavigateToThread(nextThreadId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not hand off thread.");
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
    const { fetchServerConfig } = await import(
      /* webpackMode: "eager" */ "../data/synaraClient.lynx"
    );
    const config = await fetchServerConfig().catch(() => null);
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
      await dispatchSynaraCommand({
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
        const { upsertKeybinding } = await import(
          /* webpackMode: "eager" */ "../data/synaraClient.lynx"
        );
        await upsertKeybinding(keybindingRule as KeybindingRule);
      } else {
        const { removeKeybinding } = await import(
          /* webpackMode: "eager" */ "../data/synaraClient.lynx"
        );
        await removeKeybinding(commandForProjectScript(scriptId));
      }
      await queryClient.invalidateQueries({ queryKey: ["thread-detail", thread?.id] });
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
      await dispatchSynaraCommand({
        type: "project.meta.update",
        commandId: commandId("lynx-project-action-delete"),
        projectId: project.id as never,
        scripts: deleteProjectAction(project.scripts, editingScript.id),
      });
      const { removeKeybinding } = await import(
        /* webpackMode: "eager" */ "../data/synaraClient.lynx"
      );
      await removeKeybinding(commandForProjectScript(editingScript.id));
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
            {!props.compact ? <text className="ThreadHeaderTextActionLabel">Hand off</text> : null}
          </MenuTrigger>
          <MenuPopup align="end" className="ThreadHeaderActionMenu" side="bottom" sideOffset={6}>
            {handoffTargets.map((provider) => (
              <MenuItem key={provider} onClick={() => void createHandoff(provider)}>
                <OpenAIProviderIcon provider={provider} />
                <text>Handoff to {PROVIDER_DISPLAY_NAMES[provider]}</text>
              </MenuItem>
            ))}
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
            <PlusIcon className="ThreadHeaderTextActionIcon" size={14} />
            {!props.compact ? (
              <text className="ThreadHeaderTextActionLabel">Add action</text>
            ) : null}
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
