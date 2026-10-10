// FILE: GitHubInboxPage.lynx.tsx
// Purpose: Lynx rendering of upstream's Code review page (routes/_chat.pull-requests.index.tsx
//   and components/githubInbox/GitHubInbox.tsx): a resizable list column (filter bar, Pinned
//   and All sections of pull request and issue rows, notes) beside an inline detail pane.
// Layer: Lynx presentation (L3/L4). Filters, selection, the visible-row pipeline, counts,
//   notes and copy come from upstream's githubInbox.logic; the list, refresh and pin use
//   upstream's query and mutation options, so every cache key is upstream's.
// Lynx differences: the route search lives in component state (the Lynx router has no
//   search params for this route); a pasted link opens its item on Enter because Lynx
//   inputs have no paste event; the route's Ask side chat dock is not ported.

import { useMemo, useRef, useState } from "@lynx-js/react";
import type { GitHubInboxItem, GitHubInboxListError, ProjectId } from "@synara/contracts";
import { pullRequestListProjectContexts } from "@synara/shared/githubRepository";
import type {
  GitHubInboxInvolvementFilter,
  GitHubInboxKindFilter,
  GitHubInboxStateFilter,
  TimestampFormat,
} from "@synara-web/appSettings";
import { resolveSidebarThreadListPaging } from "@synara-web/components/Sidebar.logic";
import {
  CLEARED_GITHUB_INBOX_FILTER_SEARCH,
  CLEARED_GITHUB_INBOX_FILTER_SETTINGS,
  CLEARED_GITHUB_INBOX_SELECTION,
  INBOX_SECTION_PAGE_SIZE,
  collectInboxLabelOptions,
  countActiveGitHubInboxFilters,
  countInboxItemsByKind,
  countTruncatedInboxRepositories,
  githubInboxItemNoun,
  githubInboxListState,
  githubInboxSelection,
  githubInboxSelectionForItem,
  groupVisibleInboxItems,
  inboxErrorsInScope,
  isGitHubInboxItemSelected,
  mergeGitHubInboxSearch,
  resolveGitHubInboxFilters,
  resolveInboxItemReference,
  selectVisibleInboxItems,
  type GitHubInboxSearch,
  type GitHubInboxSearchPatch,
} from "@synara-web/components/githubInbox/githubInbox.logic";
import {
  PullRequestListEmptyComposition,
  PullRequestListLoadingComposition,
} from "@synara-web/components/pullRequest/PullRequestListComposition";
import { PullRequestRowComposition } from "@synara-web/components/pullRequest/PullRequestRowComposition";
import { pullRequestDetailInputKey } from "@synara-web/components/pullRequest/pullRequestDetail.logic";
import {
  pullRequestListEntryKey,
  pullRequestPinToggleInputs,
  type PullRequestListGroupKey,
} from "@synara-web/components/pullRequest/pullRequestList.logic";
import { pinActionLabel } from "@synara-web/lib/pin.logic";
import {
  githubInboxListQueryOptions,
  pullRequestMutationKeys,
  pullRequestQueryErrorState,
  pullRequestSetPinnedMutationOptions,
  pullRequestsForceRefreshMutationOptions,
} from "@synara-web/lib/pullRequestReactQuery";
import { formatRelativeTime } from "@synara-web/lib/relativeTime";
import { useStore } from "@synara-web/store";
import { formatShortTimestamp } from "@synara-web/timestampFormat";
import { useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import pullRequestSvg from "@synara-central-icons/pull-request.svg?raw";
import issueClosedSvg from "@synara-central-icons/circle-check.svg?raw";
import issueOpenSvg from "@synara-central-icons/record.svg?raw";

import {
  PullRequestRowActionElement,
  PullRequestRowAuthorElement,
  PullRequestRowCopyElement,
  PullRequestRowMetaElement,
  PullRequestRowMetaSegmentElement,
  PullRequestRowMetaSegmentsElement,
  PullRequestRowPinElement,
  PullRequestRowRootElement,
  PullRequestRowTimeElement,
  PullRequestRowTitleElement,
  PullRequestRowTrailingElement,
} from "../adapters/PullRequestRowCompositionElements.lynx";
import { PullRequestsUnavailableState } from "../adapters/PullRequestsUnavailableState.lynx";
import { PullRequestWarningBanner } from "../adapters/PullRequestWarningBanner.lynx";
import { SidebarChatsPaginationElement } from "../adapters/SidebarChatsSectionElements.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { Button } from "../components/ui/button";
import { toastManager } from "../components/ui/toast.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { GitHubInboxFilterBar } from "./GitHubInboxFilterBar.lynx";
import { GitHubIssueDetailPane } from "./GitHubIssueDetailPane.lynx";
import { useGitHubInboxSettings } from "./githubInboxSettings.lynx";
import { PullRequestDetailPane } from "./PullRequestDetailPane.lynx";
import { queryClient } from "./queries";
import {
  createLynxSidebarResizeSession,
  isLynxSidebarPrimaryPointer,
  moveLynxSidebarResizeSession,
  readLynxSidebarPointerX,
  type LynxSidebarPointerEvent,
  type LynxSidebarResizeSession,
} from "./sidebarResize.lynx.logic";
import "./github-inbox.css";

// Upstream GitHubInbox.tsx: the list never gets narrower than its compact filter bar, and a
// drag of its handle leaves the detail at least this much.
const LIST_MIN_WIDTH = 16 * 16;
const DETAIL_MIN_WIDTH = 18 * 16;

type GitHubInboxIssueItem = Extract<GitHubInboxItem, { kind: "issue" }>;

function rateLimitedWarningText(
  error: GitHubInboxListError,
  timestampFormat: TimestampFormat,
): string {
  const resetTime = error.retryAt ? formatShortTimestamp(error.retryAt, timestampFormat) : null;
  const refresh = resetTime ? `Refreshing resumes at ${resetTime}.` : "Refreshing resumes soon.";
  return error.showingCachedData
    ? `GitHub rate limit reached. Showing the last loaded items. ${refresh}`
    : `GitHub rate limit reached. Some repositories could not be loaded. ${refresh}`;
}

/** An issue row on the pull request row's elements (upstream PullRequestRow renders both). */
function GitHubInboxIssueRow(props: {
  readonly entry: GitHubInboxIssueItem;
  readonly selected: boolean;
  readonly showProjectTitle: boolean;
  readonly onSelect: () => void;
  readonly onTogglePinned: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const { entry } = props;
  const projectContexts = pullRequestListProjectContexts(entry);
  const projectLabel =
    projectContexts.length > 1 ? `${projectContexts.length} projects` : entry.projectTitle;
  const stateLabel = entry.state === "open" ? "Open issue" : "Closed issue";
  return (
    <PullRequestRowRootElement selected={props.selected}>
      <PullRequestRowActionElement
        accessibleLabel={`${entry.title}, issue #${entry.number}`}
        projectId={entry.projectId}
        repository={entry.repository}
        number={entry.number}
        selected={props.selected}
        onActivate={props.onSelect}
      >
        <view
          className="SharedPrState"
          accessibility-element={true}
          accessibility-label={stateLabel}
        >
          <svg
            className="SharedPrStateIcon"
            content={colorizeLynxSvg(
              entry.state === "open" ? issueOpenSvg : issueClosedSvg,
              entry.state === "open" ? "#00a240" : semanticIconColor("secondary"),
            )}
          />
        </view>
        <PullRequestRowCopyElement>
          <PullRequestRowTitleElement title={entry.title} number={entry.number} />
          <PullRequestRowMetaElement>
            <PullRequestRowAuthorElement actor={entry.author} />
            <PullRequestRowMetaSegmentsElement>
              {props.showProjectTitle ? (
                <PullRequestRowMetaSegmentElement
                  title={projectContexts.map((context) => context.projectTitle).join(", ")}
                  truncateWidth="max-w-[12rem]"
                  showSeparator={false}
                >
                  {projectLabel}
                </PullRequestRowMetaSegmentElement>
              ) : null}
              <PullRequestRowMetaSegmentElement showSeparator={props.showProjectTitle}>
                {entry.repository}
              </PullRequestRowMetaSegmentElement>
            </PullRequestRowMetaSegmentsElement>
          </PullRequestRowMetaElement>
        </PullRequestRowCopyElement>
        <PullRequestRowTrailingElement>
          <PullRequestRowTimeElement>
            {formatRelativeTime(entry.updatedAt)}
          </PullRequestRowTimeElement>
        </PullRequestRowTrailingElement>
      </PullRequestRowActionElement>
      <PullRequestRowPinElement
        label={pinActionLabel(
          props.showProjectTitle
            ? `issue #${entry.number} in ${projectLabel}`
            : `issue #${entry.number}`,
          entry.isPinned === true,
        )}
        pinned={entry.isPinned === true}
        onActivate={props.onTogglePinned}
      />
    </PullRequestRowRootElement>
  );
}

function DetailEmptyState() {
  const { semanticIconColor } = useTheme();
  return (
    <view className="GitHubInboxDetailEmpty">
      <svg
        className="GitHubInboxDetailEmptyIcon"
        content={colorizeLynxSvg(pullRequestSvg, semanticIconColor("secondary"))}
      />
      <text className="GitHubInboxDetailEmptyTitle">Select a pull request or issue</text>
      <text className="GitHubInboxDetailEmptyDescription">
        Choose one from the sidebar to review it
      </text>
    </view>
  );
}

export function GitHubInboxPage() {
  const { settings, updateSettings } = useGitHubInboxSettings();
  const [search, setSearch] = useState<GitHubInboxSearch>({});
  const onSearchChange = (patch: GitHubInboxSearchPatch) => {
    "background only";
    setSearch((previous) => mergeGitHubInboxSearch(previous, patch));
  };
  const projects = useStore((store) => store.projects);
  const repositoryProjects = useMemo(
    () =>
      projects
        .filter((project) => project.kind === "project")
        .sort((left, right) => left.name.localeCompare(right.name)),
    [projects],
  );
  const projectOptions = useMemo(
    () => repositoryProjects.map((project) => ({ id: project.id, name: project.name })),
    [repositoryProjects],
  );
  const existingProjectIds = useMemo(
    () => new Set(repositoryProjects.map((project) => project.id)),
    [repositoryProjects],
  );
  const filters = resolveGitHubInboxFilters(search, settings, existingProjectIds);
  const selection = githubInboxSelection(search);
  const listState = githubInboxListState(filters.state);

  // One list per state and sort; kind, project, involvement, label and text filters apply
  // below, so switching them never reaches GitHub.
  const listQuery = useQuery(githubInboxListQueryOptions(listState, settings.githubInboxSort));
  const refreshMutation = useMutation(pullRequestsForceRefreshMutationOptions(queryClient));
  const pinMutation = useMutation(pullRequestSetPinnedMutationOptions(queryClient));
  const activeActionCount = useIsMutating({ mutationKey: pullRequestMutationKeys.action });
  const { initialError, backgroundError } = pullRequestQueryErrorState(listQuery);
  const listData = listQuery.data;

  const query = search.q ?? "";
  const normalizedQuery = query.trim().toLowerCase();
  const entries = selectVisibleInboxItems(listData?.items ?? [], filters, {
    viewer: listData?.viewer,
    sort: settings.githubInboxSort,
    normalizedQuery,
    preferredProjectId: selection?.projectId,
  });
  const groups = groupVisibleInboxItems(entries);
  const labelOptions = collectInboxLabelOptions(listData?.items ?? [], filters);
  const activeFilterCount = countActiveGitHubInboxFilters(filters, query);
  const truncatedRepositoryCount = countTruncatedInboxRepositories(
    listData?.repositoryBatches ?? [],
    filters,
  );
  const scopedErrors = inboxErrorsInScope(listData?.errors ?? [], filters);
  const rateLimitedError = scopedErrors.find((error) => error.reason === "rate-limited");
  const unavailableErrorCount = scopedErrors.filter(
    (error) => error.reason !== "rate-limited",
  ).length;
  const noun = githubInboxItemNoun(filters.kind);

  // ── Filters: a change persists and drops that filter's one-visit override ──
  const setKind = (kind: GitHubInboxKindFilter) => {
    "background only";
    updateSettings({ githubInboxKind: kind });
    if (search.type !== undefined) onSearchChange({ type: undefined });
  };
  const setState = (state: GitHubInboxStateFilter) => {
    "background only";
    updateSettings({ githubInboxState: state });
    if (search.state !== undefined) onSearchChange({ state: undefined });
  };
  const setInvolvement = (involvement: GitHubInboxInvolvementFilter) => {
    "background only";
    updateSettings({ githubInboxInvolvement: involvement });
    if (search.involvement !== undefined) onSearchChange({ involvement: undefined });
  };
  const setProjectIds = (projectIds: ProjectId[]) => {
    "background only";
    updateSettings({ githubInboxProjectIds: projectIds });
    if (search.projectId !== undefined) onSearchChange({ projectId: undefined });
  };
  const clearFilters = () => {
    "background only";
    updateSettings(CLEARED_GITHUB_INBOX_FILTER_SETTINGS);
    onSearchChange(CLEARED_GITHUB_INBOX_FILTER_SEARCH);
  };

  // ── Rows ──
  const selectItem = (item: GitHubInboxItem) => onSearchChange(githubInboxSelectionForItem(item));
  // A pull request or issue link (or #number) that names one loaded item opens it.
  const openReference = () => {
    "background only";
    const item = resolveInboxItemReference(query, listData?.items ?? []);
    if (!item) return;
    selectItem(item);
    onSearchChange({ q: undefined });
  };
  const togglePinned = (item: GitHubInboxItem) => {
    "background only";
    for (const input of pullRequestPinToggleInputs(item)) {
      pinMutation.mutate(input, {
        onError: (error) =>
          toastManager.add({
            type: "error",
            title: "Could not update pin",
            description: error instanceof Error ? error.message : "The pin could not be saved.",
          }),
      });
    }
  };
  const refreshBlockedReason = refreshMutation.isPending
    ? "Refreshing…"
    : activeActionCount > 0
      ? "Wait for the pull request action to finish"
      : null;
  const refresh = () => {
    "background only";
    if (refreshBlockedReason !== null) return;
    refreshMutation.mutate(
      { state: listState, sort: settings.githubInboxSort },
      {
        onError: (error) =>
          toastManager.add({
            type: "error",
            title: "Could not refresh code review",
            description:
              error instanceof Error ? error.message : "Code review could not be refreshed.",
          }),
      },
    );
  };

  // Extra pages each section has revealed. Not persisted, as upstream.
  const [extraPages, setExtraPages] = useState<Partial<Record<PullRequestListGroupKey, number>>>(
    {},
  );
  const showProjectTitle = filters.projectIds.length !== 1 && repositoryProjects.length > 1;
  const renderEntry = (entry: GitHubInboxItem) =>
    entry.kind === "issue" ? (
      <GitHubInboxIssueRow
        key={pullRequestListEntryKey(entry)}
        entry={entry}
        selected={isGitHubInboxItemSelected(entry, selection)}
        showProjectTitle={showProjectTitle}
        onSelect={() => selectItem(entry)}
        onTogglePinned={() => togglePinned(entry)}
      />
    ) : (
      <PullRequestRowComposition
        key={pullRequestListEntryKey(entry)}
        entry={entry}
        showProjectTitle={showProjectTitle}
        selected={isGitHubInboxItemSelected(entry, selection)}
        onClick={() => selectItem(entry)}
        onTogglePinned={() => togglePinned(entry)}
      />
    );

  // ── Layout: the list column's width, dragged from the handle on its right edge ──
  const [bodyWidth, setBodyWidth] = useState(0);
  const [draggedListWidth, setDraggedListWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [handleHovered, setHandleHovered] = useState(false);
  const [listWidth, setListWidth] = useState(0);
  const sessionRef = useRef<LynxSidebarResizeSession | null>(null);
  const percent =
    draggedListWidth !== null && bodyWidth > 0
      ? Math.round((draggedListWidth / bodyWidth) * 100)
      : 32;
  const startResize = (event: LynxSidebarPointerEvent) => {
    "background only";
    if (!isLynxSidebarPrimaryPointer(event) || listWidth <= 0) return;
    const startX = readLynxSidebarPointerX(event);
    if (startX === null) return;
    sessionRef.current = createLynxSidebarResizeSession({
      side: "left",
      startWidth: listWidth,
      startX,
    });
    setDragging(true);
  };
  const stopResize = () => {
    "background only";
    sessionRef.current = null;
    setDragging(false);
  };
  const moveResize = (event: LynxSidebarPointerEvent) => {
    "background only";
    const session = sessionRef.current;
    if (!session) return;
    const result = moveLynxSidebarResizeSession({
      event,
      minWidth: LIST_MIN_WIDTH,
      minimumContentWidth: DETAIL_MIN_WIDTH,
      session,
      viewportWidth: bodyWidth,
    });
    if (result.kind === "ended-missed-mouseup") {
      stopResize();
      return;
    }
    if (result.kind !== "moved") return;
    sessionRef.current = result.session;
    setDraggedListWidth(result.session.width);
  };

  const reviewRequestsOnlyOpen =
    filters.involvement === "reviewRequested" && filters.state !== "open";
  const closeDetail = () => onSearchChange(CLEARED_GITHUB_INBOX_SELECTION);
  const detailInput = selection
    ? {
        projectId: selection.projectId,
        repository: selection.repository,
        number: selection.number,
      }
    : null;

  return (
    <view className="FeaturePage GitHubInboxPage">
      {/* Upstream's route header: only the window drag strip; the title heads the list. */}
      <view className="GitHubInboxTopStrip AppWindowDragRegion" />
      <view
        className={`GitHubInboxBody${selection ? " GitHubInboxBody--detail-open" : ""}`}
        bindlayoutchange={(event: { readonly detail?: { readonly width?: number } }) => {
          "background only";
          const width = event.detail?.width;
          if (typeof width === "number" && width > 0) setBodyWidth(width);
        }}
      >
        <view
          className="GitHubInboxList"
          accessibility-element={true}
          accessibility-label="Code review list"
          accessibility-trait="none"
          style={
            draggedListWidth === null
              ? undefined
              : { width: `${draggedListWidth}px`, maxWidth: `${draggedListWidth}px` }
          }
          bindlayoutchange={(event: { readonly detail?: { readonly width?: number } }) => {
            "background only";
            const width = event.detail?.width;
            if (typeof width === "number" && width > 0) setListWidth(width);
          }}
        >
          <GitHubInboxFilterBar
            filters={filters}
            sort={settings.githubInboxSort}
            onSortChange={(sort) => updateSettings({ githubInboxSort: sort })}
            query={query}
            kindCounts={
              listData
                ? countInboxItemsByKind(listData.items, filters, {
                    viewer: listData.viewer,
                    normalizedQuery,
                    repositoryBatches: listData.repositoryBatches,
                  })
                : null
            }
            projectOptions={projectOptions}
            labelOptions={labelOptions}
            refreshing={refreshMutation.isPending}
            refreshBlockedReason={refreshBlockedReason}
            onQueryChange={(value) => onSearchChange({ q: value || undefined })}
            onQuerySubmit={openReference}
            onKindChange={setKind}
            onStateChange={setState}
            onInvolvementChange={setInvolvement}
            onProjectIdsChange={setProjectIds}
            onLabelsChange={(labels) => updateSettings({ githubInboxLabels: labels })}
            onClearFilters={clearFilters}
            onRefresh={refresh}
          />
          <scroll-view className="GitHubInboxListScroller" scroll-orientation="vertical">
            <view className="GitHubInboxListInner">
              {listQuery.isPending ? (
                <PullRequestListLoadingComposition label="Loading code review" />
              ) : initialError ? (
                <PullRequestsUnavailableState
                  error={initialError}
                  retrying={listQuery.isFetching}
                  onRetry={() => void listQuery.refetch()}
                />
              ) : entries.length === 0 ? (
                <view className="GitHubInboxEmpty">
                  <PullRequestListEmptyComposition
                    title={
                      repositoryProjects.length === 0
                        ? "No projects yet"
                        : reviewRequestsOnlyOpen
                          ? "Review requests only apply to open pull requests"
                          : `No ${noun} found`
                    }
                    description={
                      repositoryProjects.length === 0
                        ? "Code review lists pull requests and issues from the GitHub repositories of your projects."
                        : reviewRequestsOnlyOpen
                          ? "Select Open to see pull requests awaiting your review."
                          : activeFilterCount > 0
                            ? "Try another filter, or clear them."
                            : "Nothing here in the repositories of your projects."
                    }
                  />
                  {activeFilterCount > 0 ? (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                </view>
              ) : (
                <view className="GitHubInboxSections">
                  {groups.map((group) => {
                    const paging = resolveSidebarThreadListPaging({
                      totalCount: group.entries.length,
                      baseLimit: INBOX_SECTION_PAGE_SIZE,
                      pageSize: INBOX_SECTION_PAGE_SIZE,
                      requestedExtraPages: extraPages[group.key] ?? 0,
                    });
                    const setPages = (pages: number) =>
                      setExtraPages((current) => ({
                        ...current,
                        [group.key]: Math.max(0, pages),
                      }));
                    return (
                      <view
                        key={group.key}
                        className="GitHubInboxSection"
                        accessibility-element={true}
                        accessibility-label={group.label}
                        accessibility-trait="none"
                      >
                        {/* All shows its label only under Pinned, as upstream. */}
                        {group.key === "pinned" || groups.length > 1 ? (
                          <text className="GitHubInboxSectionLabel" accessibility-trait="header">
                            {group.label}
                          </text>
                        ) : null}
                        <view className="GitHubInboxSectionRows">
                          {group.entries.slice(0, paging.previewLimit).map(renderEntry)}
                          <SidebarChatsPaginationElement
                            canShowMore={paging.canShowMore}
                            canShowLess={paging.canShowLess}
                            onShowMore={() => setPages(paging.effectiveExtraPages + 1)}
                            onShowLess={() => setPages(paging.effectiveExtraPages - 1)}
                          />
                        </view>
                      </view>
                    );
                  })}
                </view>
              )}
              {truncatedRepositoryCount > 0 ? (
                <text className="GitHubInboxFootnote">
                  {filters.state === "merged"
                    ? "Showing merged pull requests from the 50"
                    : "Showing the 50"}{" "}
                  {settings.githubInboxSort === "created" ? "newest" : "most recently updated"}{" "}
                  {filters.state === "merged" ? "closed pull requests" : noun} per repository.{" "}
                  {truncatedRepositoryCount}{" "}
                  {truncatedRepositoryCount === 1 ? "repository has" : "repositories have"} more on
                  GitHub.
                </text>
              ) : null}
              {rateLimitedError ? (
                <PullRequestWarningBanner shape="callout">
                  {rateLimitedWarningText(rateLimitedError, settings.timestampFormat)}
                </PullRequestWarningBanner>
              ) : null}
              {unavailableErrorCount > 0 ? (
                <PullRequestWarningBanner shape="callout">
                  {unavailableErrorCount} project{" "}
                  {unavailableErrorCount === 1 ? "repository was" : "repositories were"}{" "}
                  unavailable. Healthy repositories are still shown.
                </PullRequestWarningBanner>
              ) : null}
              {backgroundError ? (
                <PullRequestWarningBanner shape="callout">
                  The latest background refresh failed. Showing the last loaded items.
                </PullRequestWarningBanner>
              ) : null}
            </view>
          </scroll-view>
          <view
            className={`GitHubInboxResizeHandle${handleHovered ? " ui-hover" : ""}${
              dragging ? " GitHubInboxResizeHandle--dragging" : ""
            }`}
            aria-label="Resize code review list"
            accessibility-element={true}
            accessibility-label="Resize code review list"
            accessibility-trait="adjustable"
            accessibility-value={`List takes ${percent}% of the width`}
            bindmousedown={startResize}
            bindmousemove={moveResize}
            bindmouseup={stopResize}
            bindmouseenter={() => setHandleHovered(true)}
            bindmouseleave={() => setHandleHovered(false)}
            bindtouchstart={startResize}
            bindtouchmove={moveResize}
            bindtouchend={stopResize}
            bindtouchcancel={stopResize}
          >
            <view className="GitHubInboxResizeHandleLine" />
          </view>
        </view>
        <view
          className="GitHubInboxDetail"
          accessibility-element={true}
          accessibility-label="Item details"
          accessibility-trait="none"
        >
          {selection && detailInput ? (
            selection.kind === "issue" ? (
              <GitHubIssueDetailPane
                key={`issue:${pullRequestDetailInputKey(detailInput)}`}
                input={detailInput}
                onClose={closeDetail}
              />
            ) : (
              <PullRequestDetailPane
                key={`pullRequest:${pullRequestDetailInputKey(detailInput)}`}
                input={detailInput}
                onClose={closeDetail}
              />
            )
          ) : (
            <DetailEmptyState />
          )}
        </view>
        {dragging ? (
          <view
            className="GitHubInboxResizeOverlay"
            bindmousemove={moveResize}
            bindmouseup={stopResize}
            bindtouchmove={moveResize}
            bindtouchend={stopResize}
            bindtouchcancel={stopResize}
          />
        ) : null}
      </view>
    </view>
  );
}
