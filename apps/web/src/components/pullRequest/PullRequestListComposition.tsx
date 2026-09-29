// FILE: PullRequestListComposition.tsx
// Purpose: Physical shared source for pull-request list grouping, row order, loading, and empty copy.

import type { ProjectId, PullRequestListEntry } from "@synara/contracts";

import {
  PullRequestListEmptyElement,
  PullRequestListGroupTitleElement,
  PullRequestListLoadingElement,
  PullRequestListRootElement,
} from "~/components/pullRequest/PullRequestListCompositionElements";
import { pullRequestListEntryKey, type PullRequestListGroup } from "./pullRequestList.logic";
import { PullRequestRowComposition } from "./PullRequestRowComposition";

export function PullRequestListComposition(props: {
  readonly entries: readonly PullRequestListEntry[];
  readonly grouped: readonly PullRequestListGroup[] | null;
  readonly selectedProjectId?: ProjectId | undefined;
  readonly selectedRepo?: string | undefined;
  readonly selectedNumber?: number | undefined;
  readonly showProjectTitle?: boolean;
  readonly onSelect?: ((entry: PullRequestListEntry) => void) | undefined;
  readonly onTogglePinned?: ((entry: PullRequestListEntry) => void) | undefined;
  readonly nowMs?: number;
}) {
  const renderEntry = (entry: PullRequestListEntry) => (
    <PullRequestRowComposition
      key={pullRequestListEntryKey(entry)}
      entry={entry}
      showProjectTitle={props.showProjectTitle}
      selected={
        props.selectedProjectId === entry.projectId &&
        props.selectedRepo === entry.repository &&
        props.selectedNumber === entry.number
      }
      {...(props.onSelect ? { onClick: props.onSelect } : {})}
      {...(props.onTogglePinned ? { onTogglePinned: props.onTogglePinned } : {})}
      {...(props.nowMs !== undefined ? { nowMs: props.nowMs } : {})}
    />
  );

  return (
    <PullRequestListRootElement>
      {props.grouped
        ? props.grouped.flatMap((group, groupIndex) => [
            <PullRequestListGroupTitleElement key={`group:${group.key}`} separated={groupIndex > 0}>
              {group.label}
            </PullRequestListGroupTitleElement>,
            ...group.entries.map(renderEntry),
          ])
        : props.entries.map(renderEntry)}
    </PullRequestListRootElement>
  );
}

export function PullRequestListLoadingComposition(props: {
  readonly rowCount?: number;
  readonly label?: string;
}) {
  return (
    <PullRequestListLoadingElement
      rowCount={props.rowCount ?? 7}
      label={props.label ?? "Loading pull requests…"}
    />
  );
}

export function PullRequestListEmptyComposition(props: {
  readonly title: string;
  readonly description: string;
  readonly intent?: "empty" | "alert";
}) {
  return (
    <PullRequestListEmptyElement
      title={props.title}
      description={props.description}
      intent={props.intent ?? "empty"}
    />
  );
}
