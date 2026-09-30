import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx sidebar hover parity", () => {
  it("invalidates live thread projections from orchestration domain events", () => {
    const source = readFileSync(new URL("../../app/router.tsx", import.meta.url), "utf8");

    expect(source).toContain("subscribeOrchestrationShellEvents((item) => {");
    expect(source).toContain("if (invalidateTimer !== null) return;");
    expect(source).toContain("}, 50);");
    expect(source).toContain('queryClient.invalidateQueries({ queryKey: ["threads"] })');
  });

  it("renders the hover card outside the interactive row hit tree", () => {
    const source = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
    const rowStart = source.indexOf("function SidebarNavigationRow");
    const actionStart = source.indexOf("function SidebarHoverAction");
    const rowSource = source.slice(rowStart, actionStart);

    expect(rowSource).toContain("const [previewVisible, setPreviewVisible] = useState(false)");
    expect(rowSource).toContain("setPreviewVisible(true)");
    expect(rowSource).toContain("setPreviewVisible(false)");
    expect(rowSource).toContain("await sleepOnHost(50)");
    expect(rowSource).toContain("props.hoverCard && previewVisible && hoverCardPosition");
    expect(rowSource).toMatch(/<\/view>\s*\{props\.hoverCard && previewVisible/);
    expect(source).toContain("<MenuOverlayPortal>");
    expect(source).toContain("</MenuOverlayPortal>");
  });

  it("reveals real project and thread actions without activating the row", () => {
    const source = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./sidebar.css", import.meta.url), "utf8");

    expect(source).toContain("lynxNestedInteractiveEventProps");
    expect(source).toContain("data-project-id={props.projectId}");
    expect(source).toContain("data-thread-id={props.threadId}");
    const projectIdentityIndex = source.indexOf("data-project-id={props.projectId}");
    const threadIdentityIndex = source.indexOf(
      "data-thread-id={props.threadId}",
      projectIdentityIndex,
    );
    const activeIdentityIndex = source.indexOf("data-active={props.active}", threadIdentityIndex);
    expect(projectIdentityIndex).toBeGreaterThanOrEqual(0);
    expect(threadIdentityIndex).toBeGreaterThan(projectIdentityIndex);
    expect(activeIdentityIndex).toBeGreaterThan(threadIdentityIndex);
    expect(source.match(/threadId=\{thread.id\}/g)).toHaveLength(3);
    expect(source).toContain("projectId={group.id}");
    expect(source).toContain('void performThreadAction(thread, "", "toggle-pin")');
    expect(source).toContain('void performThreadAction(thread, "", "archive")');
    expect(source).toContain("getFallbackThreadIdAfterDelete({");
    expect(source).toContain("sortOrder: threadSortOrder");
    expect(source).toContain('navigate(fallbackThreadId ? `/thread/${fallbackThreadId}` : "/")');
    expect(source).toContain('queryClient.invalidateQueries({ queryKey: ["threads"] })');
    expect(source).toContain('type: "project.meta.update"');
    expect(source).toContain("buildProjectContextMenuItems({");
    expect(source).toContain('action === "delete-threads" || action === "delete"');
    expect(source).toContain("...(data?.archivedThreads ?? []).filter(");
    expect(source).toContain('action === "delete"');
    expect(source).toContain("threads: removalThreads");
    expect(source).toContain("deleteNativeProjectThreads({");
    expect(source).toContain("removeNativeProject({");
    expect(source).toContain("hasAnyThreads: projectThreads.length > 0");
    expect(source).toContain("fetchProjectDevServers");
    expect(source).toContain('action === "start-dev"');
    expect(source).toContain("selectPrimaryProjectRunCommand({");
    expect(source).toContain("discoverProjectScripts({ cwd: projectSummary.workspaceRoot })");
    expect(source).toContain("upsertProjectRunCommandScripts({");
    expect(source).toContain("<ProjectRunDialogLynx");
    expect(source).toContain("localServerMatchesRun(candidate, run)");
    expect(source).toContain("findDeepestWorkspaceRootMatch(");
    expect(source).toContain("projectRunServerByProjectId.get(group.id)");
    expect(source).toContain('action === "stop-dev"');
    expect(source).toContain('action === "open-dev-server"');
    expect(source).toContain("platformWindow.openExternal(projectRunUrl)");
    expect(source).toContain('action === "rename"');
    expect(source).toContain("<ProjectRenameDialogLynx");
    expect(source).toContain("<ThreadRenameDialogLynx");
    expect(source).toContain('if (action === "rename")');
    expect(source).toContain("setRenameThreadId(thread.id)");
    expect(source).toContain('if (action === "mark-unread")');
    expect(source).toContain("useStore.getState().markThreadUnread(thread.id as never)");
    expect(source).toContain("resolveNativeThreadHandoffTargets(detail, handoffProviders)");
    expect(source).toContain('id: "handoff:" + provider');
    expect(source).toContain("await createNativeThreadHandoff({");
    expect(source).toContain('if (action === "open-path-in-terminal")');
    expect(source).toContain(
      "requestOpenThreadPathInTerminal({ threadId: thread.id, cwd: workspaceRoot })",
    );
    expect(source).toContain("renameProjectLocally(renameProjectId");
    expect(source).toContain("invalidateSidebarSnapshotProjectionCache()");
    expect(source).not.toContain(
      "type: 'project.meta.update',\n            projectId: renameProjectId",
    );
    expect(source).toContain("hasArchivableThreads: archivePlan.archivableThreadIds.length > 0");
    expect(source).toContain('action === "archive-threads"');
    expect(source).toContain("projectThreadArchiveConfirmation({");
    expect(source).toContain("archiveNativeProjectThreads({");
    expect(source).toContain("const archivedThreadIds = new Set(result.archivedThreadIds)");
    expect(source).toContain("deletedThreadIds: archivedThreadIds");
    expect(source).toContain('action === "new-space"');
    expect(source).toContain("setProjectIdAfterSpaceCreate(project.id as ProjectId)");
    expect(source).toContain("if (projectIdAfterSpaceCreate)");
    expect(source).toContain("was created, but the project was not moved.");
    expect(source).toContain('action?.startsWith("move-to-space:")');
    expect(source).toContain("buildNativeProjectMoveCommand({");
    expect(source).toContain("<SpaceSwitcherLynx");
    expect(source).toContain("spaces={data?.spaces ?? []}");
    expect(source).toContain("setActiveSpaceId(spaceId)");
    expect(source).toContain("rememberSpaceThread(activeProject.spaceId ?? null");
    expect(source).toContain("const routeSpaceId = activeProject.spaceId ?? null");
    expect(source).toContain("setActiveSpaceId(routeSpaceId)");
    expect(source).toContain("buildSpaceContextMenuItems()");
    expect(source).toContain("buildNativeSpaceDeleteCommand(space.id)");
    expect(source).toContain("nativeSpaceDeleteConfirmation(space.name, projectCount)");
    expect(source).toContain('className="AppSidebarSpaceActionError"');
    expect(source).toContain('setSpaceEditorMode("create")');
    expect(source).toContain("<SpaceProjectPickerDialogLynx");
    expect(source).toContain("setSpaceProjectPickerTarget({ id: spaceId");
    expect(source).toContain("assignNativeProjectsToSpace({");
    expect(source).toContain("Move projects here");
    expect(source).toContain("void openProjectContextMenu(group, position, restoreFocus)");
    expect(source).toContain("() => focusLynxNode(rowRef)");
    expect(source).toContain("platformWindow.showInFolder(project.workspaceRoot)");
    expect(source).toContain("navigate(`/kanban/${encodeURIComponent(project.id)}`)");
    expect(source).toContain("clipboard.writeText(project.workspaceRoot)");
    expect(source).toContain("<FolderOpenIcon size={16} />");
    expect(source).toContain("<FolderIcon size={16} />");
    expect(source).toContain("<ProjectPinAction");
    expect(source).toContain("props.pinned ? pinFilledSvg : pinSvg");
    expect(source).toContain("projectRun || projectRunServer");
    expect(source).toContain("findDeepestWorkspaceRootMatch(");
    expect(source).toContain("status={collapsedProjectStatus}");
    expect(styles).toMatch(
      /\.AppSidebarProjectRunDot\s*\{[^}]*width:\s*6px;[^}]*height:\s*6px;[^}]*background-color:\s*#34d399;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectHeader\.ui-hover \.AppSidebarProjectRunDot,[^{]*\{[^}]*opacity:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarHoverAction\s*\{[^}]*color:\s*var\(--color-icon-secondary\);/s,
    );
    expect(source).toContain('const sidebarSecondaryIconColor = semanticIconColor("secondary")');
    expect(source).toContain("colorizeLynxSvg(pinSvg, sidebarSecondaryIconColor)");
    expect(source).toContain("color={sidebarSecondaryIconColor}");
    expect(source).toMatch(/terminalSvg,\s*sidebarSecondaryIconColor/);
    expect(source).not.toContain("colorizeLynxSvg(pinSvg, svgColors.iconSecondary)");
    const hoverActionStateRule = styles.slice(
      styles.indexOf(".AppSidebarHoverAction.ui-hover,"),
      styles.indexOf(".AppSidebarHoverActionIcon"),
    );
    expect(hoverActionStateRule).not.toMatch(/(?:^|[;{])\s*color\s*:/);
    expect(styles).toContain("animation: AppSidebarProjectRunPulse 2s");
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.AppSidebarProjectRunDot\s*\{\s*animation:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectPin\s*\{[^}]*position:\s*absolute;[^}]*left:\s*8px;[^}]*width:\s*16px;[^}]*opacity:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectPin--pinned,[\s\S]*?\.AppSidebarProjectHeader\.ui-hover \.AppSidebarProjectPin,[\s\S]*?opacity:\s*1;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectFolder--hidden,[\s\S]*?\.AppSidebarProjectHeader\.ui-hover \.SharedSidebarProjectSummaryLeading,[\s\S]*?opacity:\s*0;/s,
    );
    expect(source).toContain('navigate("/pull-requests")');
    expect(source).toContain("void createProjectTerminalThread(group.id)");
    expect(source).toContain('title: "New terminal"');
    expect(source).toContain(".openTerminalThreadPage(threadId, { terminalOnly: true })");
    expect(source).toContain("terminalSvg,");
    expect(source).toContain("`/new-thread/${encodeURIComponent(group.id)}`");
    expect(styles).toMatch(
      /\.AppSidebarProjectHeader\.ui-hover \.AppSidebarRowHoverActions,[\s\S]*?opacity:\s*1;[\s\S]*?pointer-events:\s*auto;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectHeader\.ui-hover \.SharedSidebarProjectSummaryCopy,[\s\S]*?padding-right:\s*76px;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarRowHoverActions\s*\{[^}]*background-color:\s*transparent;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectHeader\.ui-focus,[\s\S]*?\.SharedSidebarChatsPaginationAction\.ui-focus\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px var\(--ring\);/s,
    );
    expect(styles).not.toMatch(
      /\.AppSidebarProjectHeader\.ui-focus,[\s\S]*?\.SharedSidebarChatsPaginationAction\.ui-focus\s*\{[^}]*border:\s*1px/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarThread--active\s*\{[^}]*background-color:\s*var\(--sidebar-accent-active\);/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarThread--active\.ui-hover,[\s\S]*?\.AppSidebarThread--active\.ui-pressed\s*\{[^}]*background-color:\s*var\(--sidebar-accent-active\);/s,
    );
    const summaryStyles = readFileSync(
      new URL("../../adapters/sidebar-project-summary-elements.css", import.meta.url),
      "utf8",
    );
    expect(summaryStyles).toMatch(
      /\.SharedSidebarProjectSummaryCopy\s*\{[^}]*overflow:\s*hidden;[^}]*transition:\s*padding-right 150ms cubic-bezier\(0,\s*0,\s*0\.2,\s*1\);/s,
    );
  });

  it("renders the thread preview as a fixed overlay outside sidebar clipping", () => {
    const source = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
    const hoverCardSource = readFileSync(
      new URL("./SidebarHoverCards.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./sidebar.css", import.meta.url), "utf8");

    expect(source).toContain("getRectByRef(rowRef, true)");
    expect(source).toContain('className="AppSidebarRowHoverCard"');
    expect(styles).toMatch(
      /\.AppSidebarRowHoverCard\s*\{[^}]*position:\s*fixed;[^}]*width:\s*256px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(source).toContain("resolveThreadHoverCardMetadata({");
    expect(source).toContain("branch={metadata.branch}");
    expect(source).toContain("sourceProjectName={metadata.sourceProjectName}");
    expect(source).toContain("worktreeName={metadata.worktreeName}");
    expect(hoverCardSource).toContain("props.sourceProjectName ? (");
    expect(hoverCardSource).toContain("props.branch ? (");
    expect(hoverCardSource).toContain("props.worktreeName ? (");
    expect(hoverCardSource).toContain("const metadataIconColor = svgColors.mutedForeground");
    expect(hoverCardSource).toContain("color={metadataIconColor}");
    expect(hoverCardSource).toContain("content={colorizeLynxSvg(worktreeSvg, metadataIconColor)}");
    expect(styles).toMatch(
      /\.AppSidebarThreadHoverCard \.AppSidebarHoverCardIcon\s*\{[^}]*opacity:\s*0\.75;/s,
    );
  });

  it("reuses the row-owned hover portal for the complete project summary card", () => {
    const source = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
    const hoverCardSource = readFileSync(
      new URL("./SidebarHoverCards.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./sidebar.css", import.meta.url), "utf8");

    expect(hoverCardSource).toContain("function SidebarProjectHoverCard");
    expect(source).toContain("hoverCard={");
    expect(source).toContain("chatCount={group.threads.length}");
    expect(source).toContain("abbreviateHomePath(");
    expect(hoverCardSource).toMatch(
      /<FolderOpenIcon[\s\S]*?className="AppSidebarHoverCardIcon"[\s\S]*?color=\{metadataIconColor\}/,
    );
    expect(hoverCardSource).toMatch(
      /<MessageCircleIcon[\s\S]*?className="AppSidebarHoverCardIcon"[\s\S]*?color=\{metadataIconColor\}/,
    );
    expect(hoverCardSource).toContain(
      '<text className="AppSidebarHoverCardMeta">Edit project</text>',
    );
    expect(hoverCardSource).toContain('? semanticIconColor("primary")');
    expect(styles).toMatch(/\.AppSidebarHoverCardPin--pinned\s*\{[^}]*opacity:\s*1;/s);
    expect(styles).toMatch(
      /\.AppSidebarProjectHoverCard \.AppSidebarHoverCardHeader,[\s\S]*?min-height:\s*26px;[\s\S]*?gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.AppSidebarHoverCardSeparator\s*\{[^}]*height:\s*1px;[^}]*background-color:\s*var\(--border\);/s,
    );
  });
});
