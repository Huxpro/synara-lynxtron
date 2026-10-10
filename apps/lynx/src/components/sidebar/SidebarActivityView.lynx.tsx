import folderSvg from "@synara-central-icons/folder-2.svg?raw";
import branchSvg from "@synara-central-icons/branch.svg?raw";
import newThreadSvg from "@synara-central-icons/compose-pencil.svg?raw";
import pinSvg from "@synara-central-icons/pin.svg?raw";
import plusSvg from "@synara-central-icons/plus-medium.svg?raw";
import sortSvg from "@synara-central-icons/arrow-top-bottom.svg?raw";
import worktreeSvg from "@synara-central-icons/arrow-split-right.svg?raw";
import pinFilledSvg from "@synara-central-icons-fill/pin.svg?raw";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "@lynx-js/react";

import type { ProjectId, ThreadId } from "@synara/contracts";
import { resolveThreadEnvironmentMode } from "@synara/shared/threadEnvironment";
import {
  resolveSidebarThreadListPaging,
  resolveThreadDisplayBranch,
  resolveThreadProjectLabel,
  resolveThreadStatusTrailingIndicator,
} from "@synara-web/components/Sidebar.logic";
import {
  buildActivityViewModel,
  collectActivityScopeOptions,
  collectUnreadActivityThreads,
  collectVisibleActivityThreadIds,
  groupActivityThreadsByProject,
  isThreadSettledForActivity,
  resolveActivityScope,
  splitActivityThreadsByDateBucket,
  splitRecentActivityThreads,
  type ActivityGroupMode,
  type ActivityScopeOption,
  type ActivityScopeSelection,
} from "@synara-web/components/SidebarActivityView.logic";
import type { ThreadStatusPill } from "@synara-web/components/Sidebar.logic";
import { SidebarThreadTrailingCluster } from "@synara-web/components/SidebarThreadTrailingCluster";
import { sidebarTrailingClusterStatus } from "./sidebarStatusGlyph.logic";
import type { SidebarThreadSummary } from "@synara-web/types";

import { SidebarThreadProviderIdentityIconElement } from "../../adapters/SidebarThreadProviderIdentityElements.lynx";
import { useLynxInteractiveState } from "../../adapters/useLynxInteractiveState";
import { useTheme } from "../../adapters/useTheme.lynx";
import {
  ArchiveIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  Undo2Icon,
} from "../../lib/icons.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { disclosureContentClassName, useLynxDisclosurePresence } from "../../platform/motion.lynx";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../ui/menu.lynx";
import { SidebarHoverAction, SidebarNavigationRow } from "./SidebarNavigationRow.lynx";
import "./sidebar-activity-view.css";

const ACTIVITY_LIST_BASE_LIMIT = 20;
const ACTIVITY_LIST_PAGE_SIZE = 20;

/** The slice of a Lynx sidebar project the Activity view labels rows and scopes with. */
export interface ActivityProject {
  readonly id: string;
  readonly kind: "project" | "chat" | "studio" | "group";
  readonly title: string;
  readonly workspaceRoot: string;
}

function activityProjectLabel(project: ActivityProject | undefined): string {
  if (!project) return resolveThreadProjectLabel(null);
  const segments = project.workspaceRoot.split(/[\\/]/).filter(Boolean);
  return resolveThreadProjectLabel({
    kind: project.kind,
    name: project.title,
    folderName: segments[segments.length - 1] ?? "",
  });
}

type ContextMenuHandler = (
  threadId: ThreadId,
  position: { readonly x: number; readonly y: number },
  restoreFocus: () => void,
) => void;

function ActivityThreadRow(props: {
  readonly thread: SidebarThreadSummary;
  readonly project: ActivityProject | undefined;
  readonly isActive: boolean;
  readonly isSettled: boolean;
  readonly isPinned: boolean;
  readonly status: ThreadStatusPill | null;
  readonly hoverCard: ReactNode;
  readonly onOpen: () => void;
  readonly onSetSettled: (settled: boolean) => void;
  readonly onTogglePinned: () => void;
  readonly onArchive: () => void;
  readonly onContextMenu: ContextMenuHandler;
}) {
  const { thread } = props;
  const { semanticIconColor } = useTheme();
  const provider = thread.session?.provider ?? thread.modelSelection.provider;
  const branch = resolveThreadDisplayBranch(thread);
  const isWorktree =
    resolveThreadEnvironmentMode({
      envMode: thread.envMode,
      worktreePath: thread.worktreePath,
    }) === "worktree";
  const trailingStatus = resolveThreadStatusTrailingIndicator({
    status: props.status,
    isActive: props.isActive,
  });
  const actionColor = semanticIconColor("tertiary");
  return (
    <SidebarNavigationRow
      threadId={thread.id}
      active={props.isActive}
      className={`AppSidebarActivityRow${props.isActive ? " AppSidebarActivityRow--active" : ""}${
        props.isSettled ? " AppSidebarActivityRow--settled" : ""
      }`}
      label={thread.title}
      hoverCard={props.hoverCard}
      onActivate={props.onOpen}
      onContextMenu={(position, restoreFocus) =>
        props.onContextMenu(thread.id, position, restoreFocus)
      }
      actions={
        <>
          <SidebarHoverAction
            label={props.isPinned ? "Unpin thread" : "Pin thread"}
            onActivate={props.onTogglePinned}
          >
            <svg
              className="AppSidebarHoverActionIcon"
              content={colorizeLynxSvg(props.isPinned ? pinFilledSvg : pinSvg, actionColor)}
            />
          </SidebarHoverAction>
          <SidebarHoverAction label="Archive thread" onActivate={props.onArchive}>
            <ArchiveIcon className="AppSidebarHoverActionIcon" color={actionColor} size={15} />
          </SidebarHoverAction>
          <SidebarHoverAction
            label={props.isSettled ? "Undo" : "Done"}
            onActivate={() => props.onSetSettled(!props.isSettled)}
          >
            {props.isSettled ? (
              <Undo2Icon className="AppSidebarHoverActionIcon" color={actionColor} size={15} />
            ) : (
              <CircleCheckIcon
                className="AppSidebarHoverActionIcon"
                color={actionColor}
                size={15}
              />
            )}
          </SidebarHoverAction>
        </>
      }
    >
      <view className="AppSidebarActivityRowTitleLine">
        <view className="AppSidebarActivityRowProvider">
          <SidebarThreadProviderIdentityIconElement provider={provider} placement="single" />
        </view>
        <text className="AppSidebarActivityRowTitle">{thread.title}</text>
      </view>
      <view className="AppSidebarActivityRowMetaLine">
        <svg
          className="AppSidebarActivityRowMetaIcon"
          content={colorizeLynxSvg(folderSvg, semanticIconColor("secondary"))}
        />
        <text className="AppSidebarActivityRowProject">{activityProjectLabel(props.project)}</text>
        {isWorktree ? (
          <svg
            aria-label="Worktree"
            className="AppSidebarActivityRowMetaIcon"
            content={colorizeLynxSvg(worktreeSvg, semanticIconColor("secondary"))}
          />
        ) : null}
        {branch ? (
          <view className="AppSidebarActivityRowBranch">
            <svg
              className="AppSidebarActivityRowMetaIcon"
              content={colorizeLynxSvg(branchSvg, semanticIconColor("secondary"))}
            />
            <text className="AppSidebarActivityRowBranchText">{branch}</text>
          </view>
        ) : null}
      </view>
      {trailingStatus ? (
        <view className="AppSidebarActivityRowStatus">
          <SidebarThreadTrailingCluster status={sidebarTrailingClusterStatus(trailingStatus)} />
        </view>
      ) : null}
    </SidebarNavigationRow>
  );
}

function ActivitySectionLabel(props: { readonly label: string }) {
  return (
    <view className="AppSidebarActivitySectionLabel">
      <text className="AppSidebarActivityLabelText">{props.label}</text>
    </view>
  );
}

/** Pinned, Earlier and Done: a label with the shared disclosure chevron and motion. */
function ActivityCollapsibleSection(props: {
  readonly label: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "AppSidebarActivityDisclosure",
    accessibleLabel: props.label,
    accessibilityValue: props.open ? "Expanded" : "Collapsed",
    onActivate: props.onToggle,
  });
  const present = useLynxDisclosurePresence(props.open);
  const Chevron = props.open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <view className="AppSidebarActivitySection">
      <view
        className={interaction.className}
        aria-expanded={props.open}
        {...interaction.eventProps}
      >
        <text className="AppSidebarActivityLabelText">{props.label}</text>
        <Chevron
          className="LynxDisclosureChevron AppSidebarActivityChevron"
          color="var(--muted-foreground)"
          size={14}
        />
      </view>
      <view className={disclosureContentClassName(props.open, "AppSidebarActivityRows")}>
        {present ? props.children : null}
      </view>
    </view>
  );
}

function ActivityScopeMenu(props: {
  readonly options: ReadonlyArray<ActivityScopeOption>;
  readonly projectById: ReadonlyMap<string, ActivityProject>;
  readonly scopeSelection: ActivityScopeSelection;
  readonly onChangeScopeSelection: (selection: ActivityScopeSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const scopeLabel =
    props.scopeSelection === null
      ? "All activity"
      : props.scopeSelection === "chats"
        ? "Synara"
        : activityProjectLabel(props.projectById.get(props.scopeSelection));
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <Menu autoHighlightFirst={false} open={open} onOpenChange={setOpen}>
      <MenuTrigger ariaLabel="Filter activity by project" className="AppSidebarActivityScope">
        <text
          className={`AppSidebarActivityLabelText${
            props.scopeSelection !== null ? " AppSidebarActivityLabelText--scoped" : ""
          }`}
        >
          {scopeLabel}
        </text>
        <Chevron
          className="LynxDisclosureChevron AppSidebarActivityScopeChevron"
          color="var(--muted-foreground)"
          size={14}
        />
      </MenuTrigger>
      <MenuPopup
        align="start"
        side="bottom"
        sideOffset={4}
        className="LxComposerPickerMenuPopup AppSidebarActivityMenu"
      >
        <MenuGroup>
          <MenuGroupLabel className="AppSidebarActivityMenuLabel">Activity scope</MenuGroupLabel>
          <MenuRadioGroup
            value={props.scopeSelection ?? "all"}
            onValueChange={(value) =>
              props.onChangeScopeSelection(
                value === "all" ? null : value === "chats" ? "chats" : (value as ProjectId),
              )
            }
          >
            <MenuRadioItem value="all" className="AppSidebarActivityMenuItem">
              All activity
            </MenuRadioItem>
            {props.options.map((option) => {
              const value = option.kind === "project" ? option.projectId : "chats";
              return (
                <MenuRadioItem key={value} value={value} className="AppSidebarActivityMenuItem">
                  <view className="AppSidebarActivityScopeOption">
                    <text className="AppSidebarActivityScopeOptionLabel">
                      {option.kind === "project"
                        ? activityProjectLabel(props.projectById.get(option.projectId))
                        : "Synara"}
                    </text>
                    <text className="AppSidebarActivityScopeOptionCount">
                      {String(option.threadCount)}
                    </text>
                  </view>
                </MenuRadioItem>
              );
            })}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

function ActivityIconButton(props: {
  readonly icon: string;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "AppSidebarActivityIconButton",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <svg
        className="AppSidebarActivityIconButtonGlyph"
        content={colorizeLynxSvg(props.icon, semanticIconColor("secondary"))}
      />
    </view>
  );
}

/** Group-by choice plus "Mark all as read". */
function ActivityFilterMenu(props: {
  readonly groupMode: ActivityGroupMode;
  readonly onChangeGroupMode: (mode: ActivityGroupMode) => void;
  readonly markAllReadDisabled: boolean;
  readonly onMarkAllRead: () => void;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <Menu autoHighlightFirst={false}>
      <MenuTrigger ariaLabel="Activity options" className="AppSidebarActivityIconButton">
        <svg
          className="AppSidebarActivityIconButtonGlyph"
          content={colorizeLynxSvg(sortSvg, semanticIconColor("secondary"))}
        />
      </MenuTrigger>
      <MenuPopup
        align="end"
        side="bottom"
        sideOffset={4}
        className="LxComposerPickerMenuPopup AppSidebarActivityMenu"
      >
        <MenuGroup>
          <MenuGroupLabel className="AppSidebarActivityMenuLabel">Group by</MenuGroupLabel>
          <MenuRadioGroup
            value={props.groupMode}
            onValueChange={(value) => props.onChangeGroupMode(value as ActivityGroupMode)}
          >
            <MenuRadioItem value="time" className="AppSidebarActivityMenuItem">
              Time
            </MenuRadioItem>
            <MenuRadioItem value="project" className="AppSidebarActivityMenuItem">
              Project
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          className="AppSidebarActivityMenuItem"
          disabled={props.markAllReadDisabled}
          onClick={props.onMarkAllRead}
        >
          Mark all as read
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}

function ActivityShowMoreRow(props: {
  readonly canShowMore: boolean;
  readonly canShowLess: boolean;
  readonly onShowMore: () => void;
  readonly onShowLess: () => void;
}) {
  if (!props.canShowMore && !props.canShowLess) return null;
  return (
    <view className="AppSidebarActivityShowMore">
      {props.canShowMore ? (
        <ActivityShowMoreButton label="Show more" grow onActivate={props.onShowMore} />
      ) : null}
      {props.canShowLess ? (
        <ActivityShowMoreButton
          label="Show less"
          grow={!props.canShowMore}
          onActivate={props.onShowLess}
        />
      ) : null}
    </view>
  );
}

function ActivityShowMoreButton(props: {
  readonly label: string;
  readonly grow: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AppSidebarActivityShowMoreButton${
      props.grow ? " AppSidebarActivityShowMoreButton--grow" : ""
    }`,
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="AppSidebarActivityShowMoreText">{props.label}</text>
    </view>
  );
}

/**
 * Electron's SidebarActivityView: every top-level thread as a two-line task row, grouped
 * by recency (or project), with pinned rows on top and settled ("Done") rows at the end.
 */
export function SidebarActivityView(props: {
  readonly threads: readonly SidebarThreadSummary[];
  readonly projects: readonly ActivityProject[];
  readonly activeThreadId: string | null;
  readonly pinnedThreadIdSet: ReadonlySet<ThreadId>;
  readonly settledOverrideByThreadId: ReadonlyMap<ThreadId, boolean>;
  readonly threadsHydrated: boolean;
  readonly resolveThreadStatus: (threadId: ThreadId) => ThreadStatusPill | null;
  readonly renderThreadHoverCard: (threadId: ThreadId) => ReactNode;
  readonly onOpenThread: (threadId: ThreadId) => void;
  readonly onSetThreadSettled: (threadId: ThreadId, settled: boolean) => void;
  readonly onToggleThreadPinned: (threadId: ThreadId) => void;
  readonly onArchiveThread: (threadId: ThreadId) => void;
  readonly onMarkThreadRead: (threadId: ThreadId, completedAt?: string) => void;
  readonly onThreadContextMenu: ContextMenuHandler;
  readonly onVisibleThreadIdsChange?: (threadIds: readonly ThreadId[]) => void;
  readonly onCreateChat: () => void;
  readonly onAddProject: () => void;
}) {
  const [scopeSelection, setScopeSelection] = useState<ActivityScopeSelection>(null);
  const [groupMode, setGroupMode] = useState<ActivityGroupMode>("time");
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [earlierOpen, setEarlierOpen] = useState(false);
  const [earlierExtraPages, setEarlierExtraPages] = useState(0);
  const [settledOpen, setSettledOpen] = useState(false);
  const [settledExtraPages, setSettledExtraPages] = useState(0);
  const [projectExtraPagesByKey, setProjectExtraPagesByKey] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
  const header = useLynxInteractiveState({
    baseClassName: "AppSidebarActivityHeader LynxWebHoverOwner",
    focusable: false,
  });

  const projectById = useMemo(
    () => new Map(props.projects.map((project) => [project.id, project] as const)),
    [props.projects],
  );
  const isRealProject = useCallback(
    (projectId: ProjectId) => projectById.get(projectId)?.kind === "project",
    [projectById],
  );
  // Scope options and the unread sweep ignore the active scope: the menu keeps offering
  // every project, and "Mark all as read" means all.
  const scopeOptions = useMemo(
    () => collectActivityScopeOptions(props.threads, isRealProject),
    [isRealProject, props.threads],
  );
  const unreadThreads = useMemo(() => collectUnreadActivityThreads(props.threads), [props.threads]);
  const { scope: activeScope, projectFilterIds } = resolveActivityScope(
    scopeSelection,
    scopeOptions,
  );
  useEffect(() => {
    if (scopeSelection !== activeScope) setScopeSelection(activeScope);
  }, [activeScope, scopeSelection]);

  const model = useMemo(
    () =>
      buildActivityViewModel({
        threads: props.threads,
        pinnedThreadIdSet: props.pinnedThreadIdSet,
        settledOverrideByThreadId: props.settledOverrideByThreadId,
        projectFilterIds,
      }),
    [projectFilterIds, props.pinnedThreadIdSet, props.settledOverrideByThreadId, props.threads],
  );
  // Day-granular buckets only need a minute-granular clock.
  const nowMs = Math.floor(Date.now() / 60_000) * 60_000;
  const { recent: recentThreads, rest: remainingActiveThreads } = useMemo(
    () => splitRecentActivityThreads(model.active, { nowMs }),
    [model.active, nowMs],
  );
  const dateBuckets = useMemo(
    () => splitActivityThreadsByDateBucket(remainingActiveThreads, nowMs),
    [nowMs, remainingActiveThreads],
  );
  const projectGroups = useMemo(
    () =>
      groupMode === "project" ? groupActivityThreadsByProject(model.active, isRealProject) : [],
    [groupMode, isRealProject, model.active],
  );
  const pagingFor = (totalCount: number, requestedExtraPages: number) =>
    resolveSidebarThreadListPaging({
      totalCount,
      baseLimit: ACTIVITY_LIST_BASE_LIMIT,
      pageSize: ACTIVITY_LIST_PAGE_SIZE,
      requestedExtraPages,
    });
  const earlierPaging = pagingFor(dateBuckets.earlier.length, earlierExtraPages);
  const settledPaging = pagingFor(model.settled.length, settledExtraPages);
  const pagedProjectGroups = projectGroups.map((group) => {
    const paging = pagingFor(group.threads.length, projectExtraPagesByKey.get(group.key) ?? 0);
    return { group, paging, threads: group.threads.slice(0, paging.previewLimit) };
  });

  const visibleThreadIds = collectVisibleActivityThreadIds({
    groupMode,
    pinnedOpen,
    pinned: model.pinned,
    // Draft threads are a client-side concept Lynx does not have (no draft-thread store).
    drafts: [],
    recent: recentThreads,
    today: dateBuckets.today,
    yesterday: dateBuckets.yesterday,
    earlierOpen,
    earlier: dateBuckets.earlier.slice(0, earlierPaging.previewLimit),
    projectGroups: pagedProjectGroups.map((group) => group.threads),
    settledOpen,
    settled: model.settled.slice(0, settledPaging.previewLimit),
  });
  const visibleThreadIdsFingerprint = visibleThreadIds.join("\0");
  const visibleThreadIdsRef = useRef(visibleThreadIds);
  visibleThreadIdsRef.current = visibleThreadIds;
  const { onVisibleThreadIdsChange } = props;
  useEffect(() => {
    onVisibleThreadIdsChange?.(visibleThreadIdsRef.current);
  }, [onVisibleThreadIdsChange, visibleThreadIdsFingerprint]);

  const markAllRead = () => {
    for (const thread of unreadThreads) {
      props.onMarkThreadRead(thread.id, thread.latestTurn?.completedAt ?? undefined);
    }
  };

  const renderRow = (thread: SidebarThreadSummary, isSettled: boolean) => (
    <ActivityThreadRow
      key={thread.id}
      thread={thread}
      project={projectById.get(thread.projectId)}
      isActive={props.activeThreadId === thread.id}
      isSettled={isSettled}
      isPinned={props.pinnedThreadIdSet.has(thread.id)}
      status={props.resolveThreadStatus(thread.id)}
      hoverCard={props.renderThreadHoverCard(thread.id)}
      onOpen={() => props.onOpenThread(thread.id)}
      onSetSettled={(settled) => {
        if (settled) props.onMarkThreadRead(thread.id, thread.latestTurn?.completedAt ?? undefined);
        props.onSetThreadSettled(thread.id, settled);
      }}
      onTogglePinned={() => props.onToggleThreadPinned(thread.id)}
      onArchive={() => props.onArchiveThread(thread.id)}
      onContextMenu={props.onThreadContextMenu}
    />
  );
  const renderActiveRow = (thread: SidebarThreadSummary) =>
    renderRow(thread, isThreadSettledForActivity(thread, props.settledOverrideByThreadId));
  const renderRows = (label: string, threads: readonly SidebarThreadSummary[]) =>
    threads.length > 0 ? (
      <view className="AppSidebarActivitySection">
        <ActivitySectionLabel label={label} />
        <view className="AppSidebarActivityRows">{threads.map(renderActiveRow)}</view>
      </view>
    ) : null;

  // The placeholder speaks for the whole surface, so it only appears when no section has rows.
  const isEmpty =
    model.active.length === 0 && model.settled.length === 0 && model.pinned.length === 0;
  const emptyLabel =
    activeScope === null
      ? "No activity yet"
      : activeScope === "chats"
        ? "No activity in Synara chats"
        : "No activity for this project";

  return (
    <view className="AppSidebarActivity">
      {model.pinned.length > 0 ? (
        <ActivityCollapsibleSection
          label="Pinned"
          open={pinnedOpen}
          onToggle={() => setPinnedOpen((open) => !open)}
        >
          {model.pinned.map(renderActiveRow)}
        </ActivityCollapsibleSection>
      ) : null}

      <view className={header.className} {...header.eventProps}>
        <view className="AppSidebarActivityScopeSlot">
          <ActivityScopeMenu
            options={scopeOptions}
            projectById={projectById}
            scopeSelection={activeScope}
            onChangeScopeSelection={setScopeSelection}
          />
        </view>
        <view className="AppSidebarActivityHeaderToolbar">
          <ActivityIconButton
            icon={newThreadSvg}
            label="Start new chat in last used project"
            onActivate={props.onCreateChat}
          />
          <ActivityIconButton icon={plusSvg} label="Add project" onActivate={props.onAddProject} />
        </view>
        <ActivityFilterMenu
          groupMode={groupMode}
          onChangeGroupMode={setGroupMode}
          markAllReadDisabled={unreadThreads.length === 0}
          onMarkAllRead={markAllRead}
        />
      </view>

      {isEmpty ? (
        <view className="AppSidebarActivityEmpty">
          <text className="AppSidebarActivityEmptyText">
            {props.threadsHydrated ? emptyLabel : "Loading activity..."}
          </text>
        </view>
      ) : groupMode === "project" ? (
        pagedProjectGroups.map(({ group, paging, threads }) => (
          <view key={group.key} className="AppSidebarActivitySection">
            <ActivitySectionLabel
              label={
                group.kind === "chats"
                  ? "Synara"
                  : activityProjectLabel(projectById.get(group.projectId))
              }
            />
            <view className="AppSidebarActivityRows">
              {threads.map(renderActiveRow)}
              <ActivityShowMoreRow
                canShowMore={paging.canShowMore}
                canShowLess={paging.canShowLess}
                onShowMore={() =>
                  setProjectExtraPagesByKey((current) =>
                    new Map(current).set(group.key, paging.effectiveExtraPages + 1),
                  )
                }
                onShowLess={() =>
                  setProjectExtraPagesByKey((current) => {
                    const next = new Map(current);
                    const extraPages = Math.max(0, paging.effectiveExtraPages - 1);
                    if (extraPages === 0) next.delete(group.key);
                    else next.set(group.key, extraPages);
                    return next;
                  })
                }
              />
            </view>
          </view>
        ))
      ) : (
        <>
          {renderRows("Recent", recentThreads)}
          {renderRows("Today", dateBuckets.today)}
          {renderRows("Yesterday", dateBuckets.yesterday)}
          {dateBuckets.earlier.length > 0 ? (
            <ActivityCollapsibleSection
              label="Earlier"
              open={earlierOpen}
              onToggle={() => setEarlierOpen((open) => !open)}
            >
              {dateBuckets.earlier.slice(0, earlierPaging.previewLimit).map(renderActiveRow)}
              <ActivityShowMoreRow
                canShowMore={earlierPaging.canShowMore}
                canShowLess={earlierPaging.canShowLess}
                onShowMore={() => setEarlierExtraPages(earlierPaging.effectiveExtraPages + 1)}
                onShowLess={() =>
                  setEarlierExtraPages(Math.max(0, earlierPaging.effectiveExtraPages - 1))
                }
              />
            </ActivityCollapsibleSection>
          ) : null}
        </>
      )}

      {model.settled.length > 0 ? (
        <ActivityCollapsibleSection
          label="Done"
          open={settledOpen}
          onToggle={() => setSettledOpen((open) => !open)}
        >
          {model.settled
            .slice(0, settledPaging.previewLimit)
            .map((thread) => renderRow(thread, true))}
          <ActivityShowMoreRow
            canShowMore={settledPaging.canShowMore}
            canShowLess={settledPaging.canShowLess}
            onShowMore={() => setSettledExtraPages(settledPaging.effectiveExtraPages + 1)}
            onShowLess={() =>
              setSettledExtraPages(Math.max(0, settledPaging.effectiveExtraPages - 1))
            }
          />
        </ActivityCollapsibleSection>
      ) : null}
    </view>
  );
}
