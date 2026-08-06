import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from '@lynx-js/react';
import { getRectByRef } from '@lynx-js/lynx-ui';
import type { NodesRef } from '@lynx-js/types';
import { useQuery } from '@tanstack/react-query';

import { SidebarPrimarySurfaceNavigation } from '@synara-web/components/SidebarPrimarySurfaceNavigation';
import { resolvePullRequestReviewBadge } from '@synara-web/components/SidebarActionBadges.logic';
import { countUniqueViewerReviewRequests } from '@synara-web/components/pullRequest/pullRequestList.logic';
import { resolveSidebarPrimarySurface } from '@synara-web/components/SidebarSurface.logic';
import { SidebarSegmentedPicker } from '@synara-web/components/SidebarSegmentedPicker';
import { SidebarProjectDisclosure } from '@synara-web/components/SidebarProjectDisclosure';
import { SidebarProjectSummary } from '@synara-web/components/SidebarProjectSummary';
import { SidebarThreadRowComposition } from '@synara-web/components/SidebarThreadRowComposition';
import {
  shouldShowSidebarThreadProviderIdentity,
} from '@synara-web/components/SidebarThreadProviderIdentity';
import { resolveSidebarThreadMetaDescriptors } from '@synara-web/components/SidebarThreadMetaModel.logic';
import { SidebarThreadTrailingCluster } from '@synara-web/components/SidebarThreadTrailingCluster';
import {
  resolveSidebarProjectStatus,
  resolveSidebarStatusPresentation,
} from '@synara-web/components/SidebarStatus.logic';
import { resolveSidebarProjectsSectionState } from '@synara-web/components/SidebarProjectsState.logic';
import { resolveSidebarThreadRowModel } from '@synara-web/components/SidebarThreadRowModel.logic';
import {
  SIDEBAR_THREAD_PREVIEW_LIMIT,
  SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
} from '@synara-web/components/SidebarThreadPaging.logic';
import {
  deriveSidebarChatRows,
  resolveSidebarChatListTransition,
  type SidebarChatListAction,
} from '@synara-web/components/SidebarChatRows.logic';
import {
  normalizeSidebarProjectThreadListCwd,
  pruneProjectThreadListPagingForCollapsedProjects,
} from '@synara-web/components/SidebarProjectPaging.logic';
import { deriveSidebarProjectRows } from '@synara-web/components/SidebarProjectRows.logic';
import { SidebarChatsSection } from '@synara-web/components/SidebarChatsSection';
import { SidebarProjectsSection } from '@synara-web/components/SidebarProjectsSection';
import { SidebarStudioSection } from '@synara-web/components/SidebarStudioSection';
import { SidebarPinnedSection } from '@synara-web/components/SidebarPinnedSection';
import { SidebarFooterSection } from '@synara-web/components/SidebarFooterSection';
import { SidebarSurfaceContent } from '@synara-web/components/SidebarSurfaceContent';
import { SidebarDesktopHeader } from '@synara-web/components/SidebarDesktopHeader';
import { SidebarListSectionHeaderAddProjectElement } from '~/components/SidebarListSectionHeaderElements';
import {
  buildThreadContextMenuItems,
  type ThreadContextMenuActionId,
} from '@synara-web/components/ThreadContextMenuItems.logic';
import { SIDEBAR_CHAT_SECTION_DEFAULT_EXPANDED } from '@synara-web/components/SidebarDefaults.logic';
import {
  collectVisibleSidebarThreadIds,
  getNextVisibleSidebarThreadId,
} from '@synara-web/components/SidebarThreadNavigation.logic';
import {
  fetchPullRequests,
  fetchSidebarSnapshot,
  queryClient,
  type ThreadSummary,
} from '../../app/queries';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  SettingsIcon,
} from '../../lib/icons';
import { useLynxInteractiveState } from '../ui/interactive-state.lynx';
import { deriveSidebarSections } from './sidebar.logic';
import { SidebarSearchPaletteLynx } from './SidebarSearchPalette.lynx';
import { LYNX_PRIMARY_SHORTCUT_LABELS } from './sidebarShortcuts';
import { focusLynxElementById } from '../ui/focus.lynx';
import {
  buildNativeThreadContextCommand,
  nativeThreadContextConfirmation,
  resolveSecondaryPointerOffset,
} from './threadContextActions.logic';
import './sidebar.css';

const SEARCH_TRIGGER_ELEMENT_ID = 'synara-sidebar-search-trigger';
const ADD_PROJECT_TRIGGER_ELEMENT_ID = 'synara-sidebar-add-project-trigger';

interface PersistedSidebarListState {
  readonly expanded: boolean;
  readonly chatExtraPages: number;
  readonly projectExtraPagesByCwd: Readonly<Record<string, number>>;
  readonly expandedProjectCwds: readonly string[];
  readonly pinnedThreadIds: readonly string[];
  readonly pinnedProjectIds: readonly string[];
}

function SidebarNavigationRow(props: {
  readonly children?: ReactNode;
  readonly className: string;
  readonly expanded?: boolean;
  readonly label: string;
  readonly onActivate: () => void;
  readonly onContextMenu?: (
    position: { readonly x: number; readonly y: number }
  ) => void;
}) {
  const rowRef = useRef<NodesRef>(null);
  const interaction = useLynxInteractiveState({
    baseClassName: props.className,
    accessibleLabel: props.label,
    accessibilityValue:
      props.expanded === undefined
        ? undefined
        : props.expanded
          ? 'Expanded'
          : 'Collapsed',
    onActivate: props.onActivate,
  });
  return (
    <view
      ref={rowRef}
      className={interaction.className}
      aria-label={props.label}
      aria-expanded={props.expanded}
      {...interaction.eventProps}
      bindmousedown={(event: {
        readonly button?: number;
        readonly x?: number;
        readonly y?: number;
      }) => {
        interaction.eventProps.bindmousedown?.();
        const offset = resolveSecondaryPointerOffset(event);
        if (!offset || !props.onContextMenu) return;
        void getRectByRef(rowRef, true)
          .then((rect) => {
            props.onContextMenu?.({
              x: rect.left + offset.x,
              y: rect.top + offset.y,
            });
          })
          .catch(() => {
            // A context menu with invented coordinates is worse than no menu.
          });
      }}
    >
      {props.children}
    </view>
  );
}

function SidebarThreadTrailing({
  thread,
}: {
  readonly thread: ThreadSummary;
}) {
  const providerShown =
    shouldShowSidebarThreadProviderIdentity(thread.title) &&
    Boolean(thread.provider);
  const descriptors = resolveSidebarThreadMetaDescriptors({
    forkSourceThreadId: thread.forkSourceThreadId,
    sidechatSourceThreadId: thread.sidechatSourceThreadId,
    handoffBadgeLabel: thread.handoffSourceProvider
      ? `${thread.handoffSourceProvider} handoff`
      : null,
    handoffShownInAvatar:
      providerShown && Boolean(thread.handoffSourceProvider),
  });
  const status =
    thread.status ??
    resolveSidebarStatusPresentation({
      working: thread.live,
      connecting: thread.sessionStatus === 'connecting',
    });

  if (descriptors.length === 0 && !status) return null;
  return (
    <SidebarThreadTrailingCluster
      metaContent={
        descriptors.length > 0
          ? descriptors.map((descriptor) => (
              <text
                key={descriptor.id}
                aria-label={descriptor.tooltip}
                className={`AppSidebarThreadMeta AppSidebarThreadMeta--${descriptor.id}`}
              >
                {descriptor.id === 'fork'
                  ? '⑂'
                  : descriptor.id === 'handoff'
                    ? '⇢'
                    : descriptor.id === 'worktree'
                      ? '◇'
                      : '◷'}
              </text>
            ))
          : null
      }
      status={status}
    />
  );
}

async function readPersistedSidebarListState(): Promise<PersistedSidebarListState> {
  'background only';
  const { hydrateStorage } = await import(
    /* webpackMode: "eager" */ '../../platform/storage'
  );
  await hydrateStorage();
  const { readSidebarUiState } = await import(
    /* webpackMode: "eager" */ '@synara-web/components/Sidebar.uiState'
  );
  const { readPersistedProjectExpansionState } = await import(
    /* webpackMode: "eager" */ '@synara-web/storePersistence'
  );
  const { usePinnedThreadsStore } = await import(
    /* webpackMode: "eager" */ '@synara-web/pinnedThreadsStore'
  );
  const { usePinnedProjectsStore } = await import(
    /* webpackMode: "eager" */ '@synara-web/pinnedProjectsStore'
  );
  await usePinnedThreadsStore.persist.rehydrate();
  await usePinnedProjectsStore.persist.rehydrate();
  const state = readSidebarUiState();
  return {
    expanded: state.chatSectionExpanded,
    chatExtraPages: state.chatThreadListExtraPages,
    projectExtraPagesByCwd: state.projectThreadListExtraPagesByCwd,
    expandedProjectCwds:
      readPersistedProjectExpansionState().expandedProjectCwds,
    pinnedThreadIds: usePinnedThreadsStore.getState().pinnedThreadIds,
    pinnedProjectIds: usePinnedProjectsStore.getState().pinnedProjectIds,
  };
}

async function persistSidebarListState(state: PersistedSidebarListState): Promise<void> {
  'background only';
  const { persistSidebarUiState, readSidebarUiState } = await import(
    /* webpackMode: "eager" */ '@synara-web/components/Sidebar.uiState'
  );
  persistSidebarUiState({
    ...readSidebarUiState(),
    chatSectionExpanded: state.expanded,
    chatThreadListExtraPages: state.chatExtraPages,
    projectThreadListExtraPagesByCwd: { ...state.projectExtraPagesByCwd },
  });
}

async function persistProjectDisclosureState(
  projects: ReadonlyArray<{ readonly cwd: string; readonly expanded: boolean }>
): Promise<void> {
  'background only';
  const { persistProjectExpansionState } = await import(
    /* webpackMode: "eager" */ '@synara-web/storePersistence'
  );
  persistProjectExpansionState(projects);
}

export function Sidebar({
  activeThreadId,
  activePath,
  navigate,
}: {
  readonly activeThreadId: string | null;
  readonly activePath: string;
  readonly navigate: (to: string) => void;
}) {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 5_000,
  });
  const { data: pullRequests } = useQuery({
    queryKey: ['pull-requests', 'sidebar-review-count'],
    queryFn: fetchPullRequests,
    refetchInterval: 30_000,
  });
  const pullRequestsReviewBadge = resolvePullRequestReviewBadge(
    pullRequests
      ? {
          count: countUniqueViewerReviewRequests(pullRequests.entries),
          incomplete: false,
        }
      : undefined
  );
  const primarySidebarSurface = resolveSidebarPrimarySurface({
    isOnStudio: activePath === '/studio',
    isOnWorkspace: false,
  });
  const [persistedPinnedThreadIds, setPersistedPinnedThreadIds] = useState<
    readonly string[]
  >([]);
  const [persistedPinnedProjectIds, setPersistedPinnedProjectIds] = useState<
    readonly string[]
  >([]);
  const sections = useMemo(
    () =>
      deriveSidebarSections({
        projects: data?.projects ?? [],
        threads: data?.threads ?? [],
        persistedPinnedThreadIds,
        persistedPinnedProjectIds,
      }),
    [data, persistedPinnedProjectIds, persistedPinnedThreadIds]
  );
  const [expandedProjectCwds, setExpandedProjectCwds] =
    useState<ReadonlySet<string> | null>(null);
  // Match the authoritative Web Sidebar.uiState default; persistence moves with
  // the shared controller boundary rather than inventing a second default here.
  const [chatsExpanded, setChatsExpanded] = useState(
    SIDEBAR_CHAT_SECTION_DEFAULT_EXPANDED
  );
  const [chatExtraPages, setChatExtraPages] = useState(0);
  const [projectExtraPagesByCwd, setProjectExtraPagesByCwd] = useState<
    Readonly<Record<string, number>>
  >({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [searchPaletteKey, setSearchPaletteKey] = useState(0);
  const [searchReturnFocusElementId, setSearchReturnFocusElementId] = useState(
    SEARCH_TRIGGER_ELEMENT_ID
  );
  const setSearchPaletteOpen = useCallback((open: boolean) => {
    'background only';
    setSearchOpen(open);
    void import(/* webpackMode: "eager" */ '../../platform/bridge')
      .then(({ bridgeCall }) =>
        bridgeCall('shellSetSearchNavigationEnabled', { enabled: open })
      )
      .catch(() => {
        // The Web host has no native application-menu accelerators.
      });
    if (!open) focusLynxElementById(searchReturnFocusElementId);
  }, [searchReturnFocusElementId]);
  const openSearchPalette = useCallback(
    (initialQuery = '', returnFocusElementId = SEARCH_TRIGGER_ELEMENT_ID) => {
      setSearchInitialQuery(initialQuery);
      setSearchReturnFocusElementId(returnFocusElementId);
      setSearchPaletteKey((current) => current + 1);
      setSearchPaletteOpen(true);
    },
    [setSearchPaletteOpen]
  );
  useEffect(() => {
    'background only';
    return () => {
      void import(/* webpackMode: "eager" */ '../../platform/bridge')
        .then(({ bridgeCall }) =>
          bridgeCall('shellSetSearchNavigationEnabled', { enabled: false })
        )
        .catch(() => {});
    };
  }, []);

  async function openThreadContextMenu(
    thread: ThreadSummary,
    workspaceRoot: string,
    position: { readonly x: number; readonly y: number }
  ) {
    'background only';
    const isPinned =
      thread.isPinned === true ||
      persistedPinnedThreadIds.includes(thread.id);
    const { showContextMenu } = await import(
      /* webpackMode: "eager" */ '../../platform/contextMenu'
    );
    const action = (await showContextMenu(
      buildThreadContextMenuItems({
        isPinned,
        renameAvailable: false,
        markUnreadAvailable: false,
        copyPathAvailable: workspaceRoot.length > 0,
        openPathInTerminalAvailable: false,
        archiveAvailable: !thread.live,
        deleteAvailable: !thread.live,
      }),
      position
    )) as ThreadContextMenuActionId | null;
    if (!action) return;

    if (action === 'copy-path' || action === 'copy-thread-id') {
      const { clipboard } = await import(
        /* webpackMode: "eager" */ '../../platform/clipboard'
      );
      await clipboard.writeText(
        action === 'copy-path' ? workspaceRoot : thread.id
      );
      return;
    }

    const confirmation = nativeThreadContextConfirmation(action, thread.title);
    if (confirmation) {
      const { dialogs } = await import(
        /* webpackMode: "eager" */ '../../platform/dialogs'
      );
      if (!(await dialogs.confirm(confirmation))) return;
    }

    const command = buildNativeThreadContextCommand({
      action,
      commandId: `lynx-command-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,
      isPinned,
      threadId: thread.id,
    });
    if (!command) return;
    const { dispatchSynaraCommand } = await import(
      /* webpackMode: "eager" */ '../../data/synaraClient'
    );
    await dispatchSynaraCommand(command);
    await queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] });

    if (action === 'toggle-pin') {
      const { usePinnedThreadsStore } = await import(
        /* webpackMode: "eager" */ '@synara-web/pinnedThreadsStore'
      );
      if (isPinned) {
        usePinnedThreadsStore.getState().unpinThread(thread.id as never);
      } else {
        usePinnedThreadsStore.getState().pinThread(thread.id as never);
      }
      setPersistedPinnedThreadIds(
        usePinnedThreadsStore.getState().pinnedThreadIds
      );
    } else if (activeThreadId === thread.id) {
      navigate('/');
    }
  }

  useEffect(() => {
    'background only';
    let active = true;
    void readPersistedSidebarListState().then((value) => {
      if (!active) return;
      setChatsExpanded(value.expanded);
      setChatExtraPages(value.chatExtraPages);
      setProjectExtraPagesByCwd(value.projectExtraPagesByCwd);
      setExpandedProjectCwds(
        value.expandedProjectCwds.length > 0
          ? new Set(value.expandedProjectCwds)
          : null
      );
      setPersistedPinnedThreadIds(value.pinnedThreadIds);
      setPersistedPinnedProjectIds(value.pinnedProjectIds);
    });
    return () => {
      active = false;
    };
  }, []);
  const chatRows = useMemo(
    () =>
      deriveSidebarChatRows({
        threads:
          primarySidebarSurface === 'studio'
            ? sections.studioThreads
            : sections.chatThreads,
        expanded: chatsExpanded,
        activeThreadId: activeThreadId ?? undefined,
        requestedExtraPages: chatExtraPages,
        previewLimit: SIDEBAR_THREAD_PREVIEW_LIMIT,
        previewPageSize: SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
      }),
    [
      activeThreadId,
      chatExtraPages,
      chatsExpanded,
      primarySidebarSurface,
      sections.chatThreads,
      sections.studioThreads,
    ]
  );
  const projectRowsById = useMemo(() => {
    const sortedThreadsByProjectId = new Map(
      sections.projectGroups.map((group) => [group.id, group.threads] as const)
    );
    return deriveSidebarProjectRows({
      projects: sections.projectGroups.map((group) => {
        const key = normalizeSidebarProjectThreadListCwd(group.workspaceRoot);
        return {
          id: group.id,
          cwd: group.workspaceRoot,
          expanded:
            expandedProjectCwds === null || expandedProjectCwds.has(key),
        };
      }),
      sortedThreadsByProjectId,
      pinnedThreadIds: [],
      filterPinnedThreads: (threads) => threads,
      resolveThreadStatus: (thread) =>
        thread.status ??
        resolveSidebarStatusPresentation({
          working: thread.live,
          connecting: thread.sessionStatus === 'connecting',
        }),
      resolveProjectStatus: resolveSidebarProjectStatus,
      threadListExtraPagesByProjectCwd: new Map(
        Object.entries(projectExtraPagesByCwd)
      ),
      normalizeProjectCwd: normalizeSidebarProjectThreadListCwd,
      activeThreadId: activeThreadId ?? undefined,
      previewLimit: SIDEBAR_THREAD_PREVIEW_LIMIT,
      previewPageSize: SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
    });
  }, [
    activeThreadId,
    expandedProjectCwds,
    projectExtraPagesByCwd,
    sections.projectGroups,
  ]);
  useEffect(() => {
    if (expandedProjectCwds === null) return;
    setProjectExtraPagesByCwd((current) => {
      const currentMap = new Map(Object.entries(current));
      const nextMap = pruneProjectThreadListPagingForCollapsedProjects({
        threadListExtraPagesByProjectCwd: currentMap,
        projects: sections.projectGroups.map((project) => ({
          cwd: project.workspaceRoot,
          expanded: expandedProjectCwds.has(
            normalizeSidebarProjectThreadListCwd(project.workspaceRoot)
          ),
        })),
        normalizeProjectCwd: normalizeSidebarProjectThreadListCwd,
      });
      if (nextMap === currentMap) return current;
      const next = Object.fromEntries(nextMap);
      void persistSidebarListState({
        expanded: chatsExpanded,
        chatExtraPages,
        projectExtraPagesByCwd: next,
      });
      return next;
    });
  }, [
    chatExtraPages,
    chatsExpanded,
    expandedProjectCwds,
    sections.projectGroups,
  ]);
  const visibleThreadIds = useMemo(
    () =>
      collectVisibleSidebarThreadIds({
        pinnedThreadIds: sections.pinnedThreads.map((thread) => thread.id),
        projectVisibleThreadIds: sections.projectGroups.map(
          (group) =>
            projectRowsById
              .get(group.id)
              ?.visibleEntries.map((entry) => entry.rowId) ?? []
        ),
        trailingThreadIds: chatRows.visibleEntries.map((entry) => entry.rowId),
      }),
    [
      chatRows.visibleEntries,
      projectRowsById,
      sections.pinnedThreads,
      sections.projectGroups,
    ]
  );
  useEffect(() => {
    'background only';
    let active = true;
    let disposers: Array<() => void> = [];
    void import(/* webpackMode: "eager" */ '../../platform/bridge').then(
      ({ onGlobalEvent }) => {
        if (!active) return;
        disposers = [
          onGlobalEvent('shell:command', (command: string) => {
            if (command === 'chat.new') {
              navigate('/');
              return;
            }
            if (command === 'sidebar.search') {
              openSearchPalette();
              return;
            }
            if (
              command !== 'chat.visible.previous' &&
              command !== 'chat.visible.next'
            ) {
              return;
            }
            const threadId = getNextVisibleSidebarThreadId({
              visibleThreadIds,
              activeThreadId: activeThreadId ?? undefined,
              direction:
                command === 'chat.visible.previous' ? 'backward' : 'forward',
            });
            if (threadId) navigate(`/thread/${threadId}`);
          }),
        ];
      }
    );
    return () => {
      active = false;
      for (const dispose of disposers) dispose();
    };
  }, [activeThreadId, navigate, openSearchPalette, visibleThreadIds]);

  function setProjectExtraPages(projectCwd: string, extraPages: number) {
    const key = normalizeSidebarProjectThreadListCwd(projectCwd);
    setProjectExtraPagesByCwd((current) => {
      const next = { ...current };
      if (extraPages > 0) next[key] = extraPages;
      else delete next[key];
      void persistSidebarListState({
        expanded: chatsExpanded,
        chatExtraPages,
        projectExtraPagesByCwd: next,
      });
      return next;
    });
  }

  function toggleProject(projectCwd: string) {
    'background only';
    const projectKey = normalizeSidebarProjectThreadListCwd(projectCwd);
    setExpandedProjectCwds((current) => {
      const next =
        current === null
          ? new Set(
              sections.projectGroups
                .map((project) =>
                  normalizeSidebarProjectThreadListCwd(project.workspaceRoot)
                )
                .filter(Boolean)
            )
          : new Set(current);
      if (next.has(projectKey)) next.delete(projectKey);
      else next.add(projectKey);
      void persistProjectDisclosureState(
        sections.projectGroups
          .filter((project) => project.workspaceRoot.length > 0)
          .map((project) => ({
            cwd: project.workspaceRoot,
            expanded: next.has(
              normalizeSidebarProjectThreadListCwd(project.workspaceRoot)
            ),
          }))
      );
      return next;
    });
  }

  function applyChatListAction(action: SidebarChatListAction) {
    const next = resolveSidebarChatListTransition({
      expanded: chatsExpanded,
      requestedExtraPages: chatExtraPages,
      effectiveExtraPages: chatRows.effectiveExtraPages,
      action,
    });
    setChatsExpanded(next.expanded);
    setChatExtraPages(next.requestedExtraPages);
    void persistSidebarListState({
      expanded: next.expanded,
      chatExtraPages: next.requestedExtraPages,
      projectExtraPagesByCwd,
    });
  }

  return (
    <view className="AppSidebar">
          <SidebarDesktopHeader />
          <SidebarSurfaceContent
            surfaceKey={primarySidebarSurface}
            picker={
          <SidebarSegmentedPicker
            views={['studio', 'threads']}
            activeView={activePath === '/studio' ? 'studio' : 'threads'}
            onSelectView={(view) => navigate(view === 'studio' ? '/studio' : '/')}
          />
            }
            navigation={
          <SidebarPrimarySurfaceNavigation
            surface={primarySidebarSurface}
            pullRequestIcon={MessageCircleIcon}
            searchOpen={searchOpen}
            searchElementId={SEARCH_TRIGGER_ELEMENT_ID}
            kanbanActive={activePath === '/kanban'}
            pullRequestsActive={activePath === '/pull-requests'}
            pullRequestsBadge={pullRequestsReviewBadge}
            newThreadShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.newThread}
            searchShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.search}
            onCreateThread={() => navigate('/')}
            onCreateStudioChat={() => navigate('/studio')}
            onOpenSearch={() => openSearchPalette()}
            onOpenKanban={() => navigate('/kanban')}
            onOpenPullRequests={() => navigate('/pull-requests')}
          />
            }
            body={
        <>
          <SidebarPinnedSection
            rows={sections.pinnedThreads}
            renderRow={(thread) => {
                  const rowModel = resolveSidebarThreadRowModel({
                    threadId: thread.id,
                    parentThreadId: thread.parentThreadId,
                    sidechatSourceThreadId: thread.sidechatSourceThreadId,
                    activeThreadId,
                    topLevel: true,
                  });
                  return (
                    <SidebarNavigationRow
                      key={thread.id}
                      className={`AppSidebarThread AppSidebarPinnedThread${
                        rowModel.isActive ? ' AppSidebarThread--active' : ''
                      }`}
                      label={thread.title}
                      onActivate={() => navigate(`/thread/${thread.id}`)}
                      onContextMenu={(position) =>
                        void openThreadContextMenu(
                          thread,
                          sections.projectGroups.find(
                            (group) => group.id === thread.projectId
                          )?.workspaceRoot ?? '',
                          position
                        )
                      }
                    >
                      <SidebarThreadRowComposition
                        thread={thread}
                        provider={thread.provider}
                        handoffSourceProvider={thread.handoffSourceProvider}
                        isActive={rowModel.isActive}
                        variant="pinned"
                        subagentIndentPx={rowModel.subagentIndentPx}
                        suffix={<SidebarThreadTrailing thread={thread} />}
                      />
                    </SidebarNavigationRow>
                  );
                }}
          />
          {primarySidebarSurface === 'studio' ? (
            <SidebarStudioSection
              hydrated={!isPending}
              rows={chatRows.visibleEntries}
              renderRow={({ row: { thread, depth } }) => {
                const rowModel = resolveSidebarThreadRowModel({
                  threadId: thread.id,
                  parentThreadId: thread.parentThreadId,
                  sidechatSourceThreadId: thread.sidechatSourceThreadId,
                  activeThreadId,
                  topLevel: true,
                });
                return (
                  <SidebarNavigationRow
                    key={thread.id}
                    className={`AppSidebarThread AppSidebarChatThread${
                      rowModel.isActive ? ' AppSidebarThread--active' : ''
                    }`}
                    label={thread.title}
                    onActivate={() => navigate(`/thread/${thread.id}`)}
                    onContextMenu={(position) =>
                      void openThreadContextMenu(
                        thread,
                        sections.projectGroups.find(
                          (group) => group.id === thread.projectId
                        )?.workspaceRoot ?? '',
                        position
                      )
                    }
                  >
                    <SidebarThreadRowComposition
                      thread={thread}
                      provider={thread.provider}
                      handoffSourceProvider={thread.handoffSourceProvider}
                      isActive={rowModel.isActive}
                      variant="standard"
                      subagentIndentPx={Math.max(
                        rowModel.subagentIndentPx,
                        depth * 10
                      )}
                      suffix={<SidebarThreadTrailing thread={thread} />}
                    />
                  </SidebarNavigationRow>
                );
              }}
            />
          ) : (
          <SidebarProjectsSection
            state={resolveSidebarProjectsSectionState({
              loading: isPending,
              error: Boolean(error) && data === undefined,
              projectCount: sections.projectGroups.length,
            })}
            headerActions={
              <SidebarListSectionHeaderAddProjectElement
                elementId={ADD_PROJECT_TRIGGER_ELEMENT_ID}
                onActivate={() =>
                  openSearchPalette('~/', ADD_PROJECT_TRIGGER_ELEMENT_ID)
                }
              />
            }
            rows={sections.projectGroups}
            renderRow={(group) => {
              const projectPagingKey = normalizeSidebarProjectThreadListCwd(
                group.workspaceRoot
              );
              const isExpanded =
                expandedProjectCwds === null ||
                expandedProjectCwds.has(projectPagingKey);
              const projectRows = projectRowsById.get(group.id);
              const visibleProjectThreadRows = projectRows?.visibleEntries ?? [];
              return (
                <SidebarProjectDisclosure
                  key={group.id}
                  expanded={isExpanded}
                  header={
                    <SidebarNavigationRow
                      className="AppSidebarProjectHeader"
                      expanded={isExpanded}
                      label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.title}`}
                      onActivate={() => toggleProject(group.workspaceRoot)}
                    >
                      <SidebarProjectSummary
                        leading={
                          isExpanded ? (
                            <ChevronDownIcon size={13} color="var(--muted-foreground)" />
                          ) : (
                            <ChevronRightIcon size={13} color="var(--muted-foreground)" />
                          )
                        }
                        name={group.title}
                      />
                      {!isExpanded && projectRows?.projectStatus ? (
                        <SidebarThreadTrailingCluster
                          status={projectRows.projectStatus}
                        />
                      ) : null}
                    </SidebarNavigationRow>
                  }
                  rows={visibleProjectThreadRows}
                  renderRow={({ thread, depth }) => {
                    const rowModel = resolveSidebarThreadRowModel({
                      threadId: thread.id,
                      parentThreadId: thread.parentThreadId,
                      sidechatSourceThreadId: thread.sidechatSourceThreadId,
                      activeThreadId,
                    });
                    return (
                      <SidebarNavigationRow
                        key={thread.id}
                        className={`AppSidebarThread${
                          rowModel.isActive ? ' AppSidebarThread--active' : ''
                        }`}
                        label={thread.title}
                        onActivate={() => navigate(`/thread/${thread.id}`)}
                        onContextMenu={(position) =>
                          void openThreadContextMenu(
                            thread,
                            group.workspaceRoot,
                            position
                          )
                        }
                      >
                        <SidebarThreadRowComposition
                          thread={thread}
                          provider={thread.provider}
                          handoffSourceProvider={thread.handoffSourceProvider}
                          isActive={rowModel.isActive}
                          variant="standard"
                          subagentIndentPx={Math.max(
                            rowModel.subagentIndentPx,
                            depth * 10
                          )}
                          suffix={<SidebarThreadTrailing thread={thread} />}
                        />
                      </SidebarNavigationRow>
                    );
                  }}
                  canShowMore={projectRows?.canShowMoreThreads ?? false}
                  canShowLess={projectRows?.canShowLessThreads ?? false}
                  onShowMore={() =>
                    setProjectExtraPages(
                      group.workspaceRoot,
                      (projectRows?.threadListExtraPages ?? 0) + 1
                    )
                  }
                  onShowLess={() =>
                    setProjectExtraPages(
                      group.workspaceRoot,
                      Math.max(
                        0,
                        (projectRows?.threadListExtraPages ?? 0) - 1
                      )
                    )
                  }
                />
              );
            }}
          />
          )}
        </>
            }
            trailing={
          <SidebarChatsSection
            visible={
              primarySidebarSurface === 'threads' && !isPending && !error
            }
            expanded={chatsExpanded}
            rows={chatRows.visibleEntries}
            canShowMore={chatRows.canShowMoreThreads}
            canShowLess={chatRows.canShowLessThreads}
            renderRow={({ row: { thread, depth } }) => {
              const rowModel = resolveSidebarThreadRowModel({
                threadId: thread.id,
                parentThreadId: thread.parentThreadId,
                sidechatSourceThreadId: thread.sidechatSourceThreadId,
                activeThreadId,
                topLevel: true,
              });
              return (
                <SidebarNavigationRow
                  key={thread.id}
                  className={`AppSidebarThread AppSidebarChatThread${
                    rowModel.isActive ? ' AppSidebarThread--active' : ''
                  }`}
                  label={thread.title}
                  onActivate={() => navigate(`/thread/${thread.id}`)}
                  onContextMenu={(position) =>
                    void openThreadContextMenu(
                      thread,
                      sections.projectGroups.find(
                        (group) => group.id === thread.projectId
                      )?.workspaceRoot ?? '',
                      position
                    )
                  }
                >
                  <SidebarThreadRowComposition
                    thread={thread}
                    provider={thread.provider}
                    handoffSourceProvider={thread.handoffSourceProvider}
                    isActive={rowModel.isActive}
                    variant="standard"
                    subagentIndentPx={Math.max(
                      rowModel.subagentIndentPx,
                      depth * 10
                    )}
                    suffix={<SidebarThreadTrailing thread={thread} />}
                  />
                </SidebarNavigationRow>
              );
            }}
            onToggle={() => applyChatListAction('toggle')}
            onShowMore={() => applyChatListAction('show_more')}
            onShowLess={() => applyChatListAction('show_less')}
          />
            }
          />
        <SidebarFooterSection
          settingsVisible={activePath !== '/settings'}
          settingsActive={activePath === '/settings'}
          settingsIcon={
            <SettingsIcon className="AppSidebarSettingsIcon" size={15} />
          }
          onOpenSettings={() => navigate('/settings')}
        />
        <SidebarSearchPaletteLynx
          key={searchPaletteKey}
          open={searchOpen}
          initialQuery={searchInitialQuery}
          snapshot={data}
          searchStatus={data ? 'ready' : isPending ? 'loading' : 'error'}
          searchErrorMessage={error instanceof Error ? error.message : null}
          onRetrySearch={() => void refetch()}
          onOpenChange={setSearchPaletteOpen}
          onOpenProject={() => navigate('/kanban')}
          onOpenThread={(threadId) => navigate(`/thread/${threadId}`)}
          onCreateThread={() => navigate('/')}
          onCreateProjectThread={(projectId) =>
            navigate(`/new-thread/${encodeURIComponent(projectId)}`)
          }
          onOpenSettings={(section) =>
            navigate(section ? `/settings/${section}` : '/settings')
          }
        />
    </view>
  );
}
