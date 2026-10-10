// FILE: GitHubInboxFilterBar.lynx.tsx
// Purpose: Lynx rendering of upstream's components/githubInbox/GitHubInboxFilterBar.tsx:
//   the "Code review" panel title with the Sort, Filter and More menus, the search field,
//   the kind tabs with a count each and, while something is filtered, the removable chips.
// Layer: Lynx presentation. Controlled, like upstream's: the page owns persistence.
// Option tables repeat upstream's (they are module-private there); labels, filter
//   semantics and label toggling come from githubInbox.logic.

import type { GitHubInboxSort, ProjectId } from "@synara/contracts";
import sortSvg from "@synara-central-icons/arrow-top-bottom.svg?raw";
import closeSvg from "@synara-central-icons/cross-small.svg?raw";
import filterSvg from "@synara-central-icons/filter-2.svg?raw";
import type {
  GitHubInboxInvolvementFilter,
  GitHubInboxKindFilter,
  GitHubInboxStateFilter,
} from "@synara-web/appSettings";
import {
  isGitHubInboxLabelSelected,
  toggleGitHubInboxLabel,
  type GitHubInboxFilters,
  type GitHubInboxKindCounts,
  type GitHubInboxLabelOption,
} from "@synara-web/components/githubInbox/githubInbox.logic";

import { SettingsSidebarSearchElement } from "../adapters/SettingsSidebarChromeCompositionElements.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { EllipsisIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import "./github-inbox.css";

const STATE_OPTIONS: ReadonlyArray<{ value: GitHubInboxStateFilter; label: string }> = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "merged", label: "Merged" },
];

const SORT_OPTIONS: ReadonlyArray<{ value: GitHubInboxSort; label: string }> = [
  { value: "created", label: "Newest" },
  { value: "updated", label: "Recently updated" },
];

const INVOLVEMENT_OPTIONS: ReadonlyArray<{ value: GitHubInboxInvolvementFilter; label: string }> = [
  { value: "everything", label: "Anyone" },
  { value: "involved", label: "Involving me" },
  { value: "reviewRequested", label: "Review requested" },
  { value: "authored", label: "Authored by me" },
  { value: "assigned", label: "Assigned to me" },
];

const KIND_TABS: ReadonlyArray<{ value: GitHubInboxKindFilter; label: string; short: string }> = [
  { value: "all", label: "All", short: "All" },
  { value: "pullRequest", label: "Pull requests", short: "PRs" },
  { value: "issue", label: "Issues", short: "Issues" },
];

function KindTab(props: {
  readonly tab: (typeof KIND_TABS)[number];
  readonly active: boolean;
  readonly count: number | undefined;
  readonly onSelect: () => void;
}) {
  const label = props.count === undefined ? props.tab.label : `${props.tab.label}, ${props.count}`;
  const interaction = useLynxInteractiveState({
    baseClassName: `GitHubInboxKindTab${props.active ? " GitHubInboxKindTab--active" : ""}`,
    accessibleLabel: label,
    accessibilityValue: props.active ? "Selected" : undefined,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-label={label}
      aria-checked={props.active}
      {...interaction.eventProps}
    >
      <text className="GitHubInboxKindTabLabel">{props.tab.short}</text>
      {props.count === undefined ? null : (
        <text className="GitHubInboxKindTabCount">{props.count}</text>
      )}
    </view>
  );
}

function ActiveFilterChip(props: { readonly label: string; readonly onRemove: () => void }) {
  const { activeTheme } = useTheme();
  const removeLabel = `Remove filter: ${props.label}`;
  const interaction = useLynxInteractiveState({
    baseClassName: "GitHubInboxChipRemove",
    accessibleLabel: removeLabel,
    onActivate: props.onRemove,
  });
  return (
    <view className="GitHubInboxChip">
      <text className="GitHubInboxChipLabel" text-maxline="1">
        {props.label}
      </text>
      <view className={interaction.className} aria-label={removeLabel} {...interaction.eventProps}>
        <svg
          className="GitHubInboxChipRemoveIcon"
          content={colorizeLynxSvg(closeSvg, activeTheme.theme.accent)}
        />
      </view>
    </view>
  );
}

function ClearChipsButton(props: { readonly onClear: () => void }) {
  const interaction = useLynxInteractiveState({
    baseClassName: "GitHubInboxChipClear",
    accessibleLabel: "Clear",
    onActivate: props.onClear,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="GitHubInboxChipClearLabel">Clear</text>
    </view>
  );
}

export function GitHubInboxFilterBar(props: {
  readonly filters: GitHubInboxFilters;
  readonly sort: GitHubInboxSort;
  readonly onSortChange: (sort: GitHubInboxSort) => void;
  readonly query: string;
  /** Rows each kind would show under the other filters; null while the list loads. */
  readonly kindCounts: GitHubInboxKindCounts | null;
  readonly projectOptions: ReadonlyArray<{ readonly id: ProjectId; readonly name: string }>;
  readonly labelOptions: ReadonlyArray<GitHubInboxLabelOption>;
  readonly refreshing: boolean;
  /** Why refresh is unavailable right now, or null when it can run. */
  readonly refreshBlockedReason: string | null;
  readonly onQueryChange: (query: string) => void;
  /** Enter in the search field: opens the item a pasted link or #number names. */
  readonly onQuerySubmit: () => void;
  readonly onKindChange: (kind: GitHubInboxKindFilter) => void;
  readonly onStateChange: (state: GitHubInboxStateFilter) => void;
  readonly onInvolvementChange: (involvement: GitHubInboxInvolvementFilter) => void;
  readonly onProjectIdsChange: (projectIds: ProjectId[]) => void;
  readonly onLabelsChange: (labels: string[]) => void;
  readonly onClearFilters: () => void;
  readonly onRefresh: () => void;
}) {
  const { activeTheme, semanticIconColor } = useTheme();
  const { filters } = props;
  const sortLabel = SORT_OPTIONS.find((option) => option.value === props.sort)!.label;
  const involvement =
    INVOLVEMENT_OPTIONS.find((option) => option.value === filters.involvement) ??
    INVOLVEMENT_OPTIONS[0]!;
  const toggleProject = (projectId: ProjectId) =>
    props.onProjectIdsChange(
      filters.projectIds.includes(projectId)
        ? filters.projectIds.filter((id) => id !== projectId)
        : [...filters.projectIds, projectId],
    );
  // What the Filter menu holds; the kind tabs and the search text show their own state.
  const menuFilterCount =
    (filters.state !== "open" ? 1 : 0) +
    (filters.involvement !== "everything" ? 1 : 0) +
    (filters.projectIds.length > 0 ? 1 : 0) +
    (filters.labels.length > 0 ? 1 : 0);
  const iconColor = semanticIconColor("secondary");
  const filterColor = menuFilterCount > 0 ? activeTheme.theme.accent : iconColor;

  return (
    <view className="GitHubInboxFilterBar">
      <view className="AppRailPanelTitleRow GitHubInboxTitleRow">
        <text className="AppRailPanelTitle" accessibility-trait="header">
          Code review
        </text>
        <view className="GitHubInboxTitleActions">
          <Menu>
            <MenuTrigger ariaLabel={`Sort: ${sortLabel}`} className="GitHubInboxIconButton">
              <svg className="GitHubInboxIcon" content={colorizeLynxSvg(sortSvg, iconColor)} />
            </MenuTrigger>
            <MenuPopup align="end" className="LxComposerPickerMenuPopup GitHubInboxSortMenu">
              <MenuGroup>
                <MenuGroupLabel>Sort by</MenuGroupLabel>
                <MenuRadioGroup
                  value={props.sort}
                  onValueChange={(value) => props.onSortChange(value as GitHubInboxSort)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
            </MenuPopup>
          </Menu>
          <Menu>
            <MenuTrigger
              ariaLabel={menuFilterCount > 0 ? `Filter (${menuFilterCount} active)` : "Filter"}
              className="GitHubInboxIconButton"
            >
              <svg className="GitHubInboxIcon" content={colorizeLynxSvg(filterSvg, filterColor)} />
              {menuFilterCount > 0 ? <view className="GitHubInboxFilterDot" /> : null}
            </MenuTrigger>
            <MenuPopup align="end" className="LxComposerPickerMenuPopup GitHubInboxFilterMenu">
              <MenuGroup>
                <MenuGroupLabel>Status</MenuGroupLabel>
                <MenuRadioGroup
                  value={filters.state}
                  onValueChange={(value) => props.onStateChange(value as GitHubInboxStateFilter)}
                >
                  {STATE_OPTIONS.map((option) => (
                    <MenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuGroupLabel>Involvement</MenuGroupLabel>
                <MenuRadioGroup
                  value={filters.involvement}
                  onValueChange={(value) =>
                    props.onInvolvementChange(value as GitHubInboxInvolvementFilter)
                  }
                >
                  {INVOLVEMENT_OPTIONS.map((option) => (
                    <MenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
              <MenuSeparator />
              <MenuSub>
                <MenuSubTrigger>
                  {filters.projectIds.length > 0
                    ? `Projects (${filters.projectIds.length})`
                    : "Projects"}
                </MenuSubTrigger>
                <MenuSubPopup className="GitHubInboxSubMenu">
                  {props.projectOptions.length === 0 ? (
                    <MenuItem disabled>No projects</MenuItem>
                  ) : (
                    props.projectOptions.map((option) => (
                      <MenuCheckboxItem
                        key={option.id}
                        checked={filters.projectIds.includes(option.id)}
                        onCheckedChange={() => toggleProject(option.id)}
                      >
                        {option.name}
                      </MenuCheckboxItem>
                    ))
                  )}
                </MenuSubPopup>
              </MenuSub>
              <MenuSub>
                <MenuSubTrigger>
                  {filters.labels.length > 0 ? `Labels (${filters.labels.length})` : "Labels"}
                </MenuSubTrigger>
                <MenuSubPopup className="GitHubInboxSubMenu">
                  {props.labelOptions.length === 0 ? (
                    <MenuItem disabled>No labels in this view</MenuItem>
                  ) : (
                    props.labelOptions.map((option) => (
                      <MenuCheckboxItem
                        key={option.name}
                        checked={isGitHubInboxLabelSelected(filters.labels, option.name)}
                        onCheckedChange={() =>
                          props.onLabelsChange(toggleGitHubInboxLabel(filters.labels, option.name))
                        }
                      >
                        {`${option.name} (${option.count})`}
                      </MenuCheckboxItem>
                    ))
                  )}
                </MenuSubPopup>
              </MenuSub>
              {menuFilterCount > 0 ? (
                <>
                  <MenuSeparator />
                  <MenuItem onClick={props.onClearFilters}>Clear filters</MenuItem>
                </>
              ) : null}
            </MenuPopup>
          </Menu>
          <Menu>
            <MenuTrigger ariaLabel="More code review actions" className="GitHubInboxIconButton">
              <EllipsisIcon className="GitHubInboxIcon" color={iconColor} size={14} />
            </MenuTrigger>
            <MenuPopup align="end" className="LxComposerPickerMenuPopup GitHubInboxSortMenu">
              <MenuItem disabled={props.refreshBlockedReason !== null} onClick={props.onRefresh}>
                {props.refreshing ? "Refreshing…" : "Refresh"}
              </MenuItem>
              {menuFilterCount > 0 ? (
                <MenuItem onClick={props.onClearFilters}>Clear filters</MenuItem>
              ) : null}
            </MenuPopup>
          </Menu>
        </view>
      </view>
      <view className="GitHubInboxFilterBody">
        <SettingsSidebarSearchElement
          value={props.query}
          placeholder="Search or paste a PR link"
          accessibleLabel="Search pull requests and issues"
          onValueChange={props.onQueryChange}
          onSubmit={props.onQuerySubmit}
          onEscape={() => props.onQueryChange("")}
        />
        <view
          className="GitHubInboxKindTabs"
          accessibility-element={true}
          accessibility-label="Kind"
          accessibility-trait="none"
        >
          {KIND_TABS.map((tab) => (
            <KindTab
              key={tab.value}
              tab={tab}
              active={tab.value === filters.kind}
              count={props.kindCounts?.[tab.value]}
              onSelect={() => props.onKindChange(tab.value)}
            />
          ))}
        </view>
        {menuFilterCount > 0 ? (
          <view
            className="GitHubInboxChips"
            accessibility-element={true}
            accessibility-label="Active filters"
            accessibility-trait="none"
          >
            {filters.state !== "open" ? (
              <ActiveFilterChip
                label={filters.state === "merged" ? "Merged" : "Closed"}
                onRemove={() => props.onStateChange("open")}
              />
            ) : null}
            {filters.involvement !== "everything" ? (
              <ActiveFilterChip
                label={involvement.label}
                onRemove={() => props.onInvolvementChange("everything")}
              />
            ) : null}
            {filters.projectIds.map((projectId) => (
              <ActiveFilterChip
                key={projectId}
                label={
                  props.projectOptions.find((option) => option.id === projectId)?.name ?? "Project"
                }
                onRemove={() => toggleProject(projectId)}
              />
            ))}
            {filters.labels.map((label) => (
              <ActiveFilterChip
                key={label}
                label={label}
                onRemove={() => props.onLabelsChange(toggleGitHubInboxLabel(filters.labels, label))}
              />
            ))}
            <ClearChipsButton onClear={props.onClearFilters} />
          </view>
        ) : null}
      </view>
    </view>
  );
}
