import { useMemo, useState } from "@lynx-js/react";
import { ensureNativeApi } from "~/nativeApi";
import { useQueries } from "@tanstack/react-query";
import { DEFAULT_MODEL_BY_PROVIDER } from "@synara/contracts";

import {
  SidebarSearchPalette,
  type SidebarSearchPaletteMode,
  type ImportProviderKind,
} from "@synara-web/components/SidebarSearchPaletteComposition";
import { isFilesystemBrowseQuery } from "@synara-web/lib/projectPaths";
import { newCommandId } from "@synara-web/lib/utils";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import {
  providerComposerCapabilitiesQueryOptions,
  supportsThreadImport,
} from "@synara-web/lib/providerDiscoveryReactQuery";
import type { SidebarSnapshot } from "../../app/queries";
import { getNavigatorPlatform } from "~/platform/env";
import { webStorage } from "../../platform/storage";
import {
  buildNativeSearchImportThreadCreateCommand,
  buildNativeSearchProjectCreateCommand,
} from "./sidebarSearchActions.logic";
import { buildLynxSidebarSearchActions } from "./sidebarSearchSpaceActions.logic";
import { FeedbackDialogLynx, resolveNativeFeedbackContext } from "./FeedbackDialog.lynx";
import {
  useSidebarSearchThreadsWithLoadedMessages,
  useSidebarThreadSearch,
} from "./useSidebarThreadSearch.lynx";

const EMPTY_SEARCH_THREADS: SidebarSnapshot["searchThreads"] = [];

const IMPORT_PROVIDERS: readonly ImportProviderKind[] = [
  "codex",
  "claudeAgent",
  "cursor",
  "opencode",
];

export function SidebarSearchPaletteLynx(props: {
  readonly open: boolean;
  readonly activeThreadId?: string | null;
  readonly initialQuery?: string;
  readonly snapshot: SidebarSnapshot | undefined;
  readonly searchStatus: "ready" | "loading" | "error";
  readonly searchErrorMessage?: string | null;
  readonly onRetrySearch: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpenProject: (projectId: string) => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onCreateThread: () => void;
  readonly onCreateProjectThread: (projectId: string) => void;
  readonly onCreateSpace: () => void;
  readonly onOpenSettings: (section?: "usage") => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const [mode, setMode] = useState<SidebarSearchPaletteMode>("search");
  const actions = useMemo(
    () => buildLynxSidebarSearchActions(props.onCreateSpace),
    [props.onCreateSpace],
  );
  const projects = useMemo(
    () =>
      (props.snapshot?.searchProjects ?? []).filter((project) =>
        (props.snapshot?.projects ?? []).some(
          (source) => source.id === project.id && source.kind === "project",
        ),
      ),
    [props.snapshot],
  );
  // The palette owns its input; this mirrors what is typed, for the server search.
  const [query, setQuery] = useState(() => props.initialQuery ?? "");
  const trimmedQuery = query.trim();
  const serverThreadMatches = useSidebarThreadSearch({
    query,
    enabled:
      props.open &&
      !(trimmedQuery.length > 0 && isFilesystemBrowseQuery(trimmedQuery, getNavigatorPlatform())),
  });
  const threads = useSidebarSearchThreadsWithLoadedMessages(
    props.snapshot?.searchThreads ?? EMPTY_SEARCH_THREADS,
    props.open,
  );
  const newThreadProjectId =
    props.snapshot?.projects.find((project) => project.kind === "project")?.id ?? null;
  // As upstream's palette controller: one capabilities query per candidate,
  // on upstream's keys (the composer reads the same cache).
  const importCapabilityQueries = useQueries({
    queries: IMPORT_PROVIDERS.map((provider) => providerComposerCapabilitiesQueryOptions(provider)),
  });
  const importProviderKey = IMPORT_PROVIDERS.filter((_, index) =>
    supportsThreadImport(importCapabilityQueries[index]?.data),
  ).join(",");
  const importProviders = useMemo(
    () => (importProviderKey ? (importProviderKey.split(",") as ImportProviderKind[]) : []),
    [importProviderKey],
  );

  const addProjectPath = async (workspaceRoot: string, options?: { createIfMissing?: boolean }) => {
    "background only";
    const command = buildNativeSearchProjectCreateCommand({
      workspaceRoot,
      createIfMissing: options?.createIfMissing === true,
      defaultProvider: generalSettings.defaultProvider,
    });
    await ensureNativeApi().orchestration.dispatchCommand(command);
    props.onOpenProject(command.projectId);
  };

  const importThread = async (provider: ImportProviderKind, externalId: string) => {
    "background only";
    const target = props.snapshot?.projects.find((project) => project.kind === "project");
    if (!target) throw new Error("Add a project before importing a thread.");
    const model = DEFAULT_MODEL_BY_PROVIDER[provider];
    if (!model) throw new Error(`No default model is available for ${provider}.`);
    const command = buildNativeSearchImportThreadCreateCommand({
      projectId: target.id,
      provider,
      model,
      externalId,
      envMode: generalSettings.defaultThreadEnvMode,
    });
    let created = false;
    try {
      await ensureNativeApi().orchestration.dispatchCommand(command);
      created = true;
      await ensureNativeApi().orchestration.importThread({
        threadId: command.threadId,
        externalId: externalId.trim(),
      });
      props.onOpenThread(command.threadId);
    } catch (error) {
      if (created) {
        await ensureNativeApi()
          .orchestration.dispatchCommand({
            type: "thread.delete",
            commandId: newCommandId(),
            threadId: command.threadId,
          })
          .catch(() => undefined);
      }
      throw error;
    }
  };

  const activeThread = props.snapshot?.threads.find((thread) => thread.id === props.activeThreadId);
  const activeProject = activeThread
    ? props.snapshot?.projects.find((project) => project.id === activeThread.projectId)
    : null;
  const feedbackContext = useMemo(
    () => resolveNativeFeedbackContext(activeThread, activeProject?.kind),
    [activeProject?.kind, activeThread],
  );

  return (
    <>
      <SidebarSearchPalette
        open={props.open}
        initialQuery={props.initialQuery}
        mode={mode}
        onModeChange={setMode}
        onOpenChange={props.onOpenChange}
        actions={actions}
        projects={projects}
        threads={threads}
        serverThreadMatches={serverThreadMatches}
        onQueryChange={setQuery}
        searchStatus={props.searchStatus}
        searchErrorMessage={props.searchErrorMessage}
        onRetrySearch={props.onRetrySearch}
        onCreateChat={props.onCreateThread}
        onCreateThread={() => {
          if (newThreadProjectId) props.onCreateProjectThread(newThreadProjectId);
          else props.onCreateThread();
        }}
        onAddProjectPath={addProjectPath}
        homeDir={null}
        onOpenSettings={props.onOpenSettings}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenUsageSettings={() => props.onOpenSettings("usage")}
        onOpenProject={props.onOpenProject}
        onOpenThread={props.onOpenThread}
        importProviders={importProviders}
        onImportThread={importThread}
        onBrowseFilesystem={async (partialPath) => {
          "background only";
          return ensureNativeApi()
            .filesystem.browse({ partialPath })
            .catch(() => null);
        }}
        filesystemBrowseEnabled
        appearanceEnabled
      />
      <FeedbackDialogLynx
        activeThreadId={props.activeThreadId}
        open={feedbackOpen}
        fallbackContext={feedbackContext}
        onOpenChange={setFeedbackOpen}
      />
    </>
  );
}
