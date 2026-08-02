// FILE: PullRequestRouteControlsComposition.tsx
// Purpose: Physical shared source for the pull-request route header and filter anatomy.

import type {
  ProjectId,
  PullRequestInvolvement,
  PullRequestState,
} from "@synara/contracts";

import {
  PullRequestFilterPillGroupElement,
  PullRequestFiltersPillRowElement,
  PullRequestFiltersRootElement,
  PullRequestFiltersSearchRowElement,
  PullRequestProjectFilterElement,
  PullRequestRouteHeaderNavigationElement,
  PullRequestRouteHeaderRefreshElement,
  PullRequestRouteHeaderRootElement,
  PullRequestRouteHeaderRowElement,
  PullRequestRouteHeaderScopeElement,
  PullRequestRouteHeaderSpacerElement,
  PullRequestRouteHeaderTitleElement,
  PullRequestSearchElement,
  PullRequestSearchUnavailableElement,
} from "~/components/pullRequest/PullRequestRouteControlsCompositionElements";

export const PULL_REQUEST_INVOLVEMENT_OPTIONS: ReadonlyArray<{
  readonly value: PullRequestInvolvement;
  readonly label: string;
}> = [
  { value: "all", label: "All" },
  { value: "reviewing", label: "Reviewing" },
  { value: "authored", label: "Authored" },
];

export const PULL_REQUEST_STATE_OPTIONS: ReadonlyArray<{
  readonly value: PullRequestState;
  readonly label: string;
}> = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "merged", label: "Merged" },
];

export function PullRequestRouteHeaderComposition(props: {
  readonly scopedProjectName?: string | undefined;
  readonly refreshDisabled: boolean;
  readonly refreshing: boolean;
  readonly refreshBlockedReason?: string | undefined;
  readonly onRefresh: () => void;
  readonly hostClassName?: string | undefined;
  readonly navigationAvailable?: boolean | undefined;
}) {
  return (
    <PullRequestRouteHeaderRootElement hostClassName={props.hostClassName}>
      <PullRequestRouteHeaderRowElement>
        {props.navigationAvailable === false ? null : (
          <PullRequestRouteHeaderNavigationElement />
        )}
        <PullRequestRouteHeaderTitleElement>Pull requests</PullRequestRouteHeaderTitleElement>
        {props.scopedProjectName ? (
          <PullRequestRouteHeaderScopeElement>{props.scopedProjectName}</PullRequestRouteHeaderScopeElement>
        ) : null}
        <PullRequestRouteHeaderSpacerElement />
        <PullRequestRouteHeaderRefreshElement
          disabled={props.refreshDisabled}
          refreshing={props.refreshing}
          title={props.refreshBlockedReason ?? "Refresh"}
          onActivate={props.onRefresh}
        />
      </PullRequestRouteHeaderRowElement>
    </PullRequestRouteHeaderRootElement>
  );
}

export function PullRequestRouteFiltersComposition(props: {
  readonly involvement: PullRequestInvolvement;
  readonly state: PullRequestState;
  readonly projectId?: ProjectId | undefined;
  readonly projects: ReadonlyArray<readonly [ProjectId, string]>;
  readonly searchQuery: string;
  readonly searchCapability: "editable" | "unavailable";
  readonly onInvolvementChange: (value: PullRequestInvolvement) => void;
  readonly onStateChange: (value: PullRequestState) => void;
  readonly onStateIntent?: ((value: PullRequestState) => void) | undefined;
  readonly onProjectChange: (value: ProjectId | undefined) => void;
  readonly onSearchChange?: ((value: string) => void) | undefined;
}) {
  return (
    <PullRequestFiltersRootElement>
      <PullRequestFiltersPillRowElement>
        <PullRequestFilterPillGroupElement
          value={props.involvement}
          options={PULL_REQUEST_INVOLVEMENT_OPTIONS}
          onChange={props.onInvolvementChange}
        />
        <PullRequestFilterPillGroupElement
          value={props.state}
          options={PULL_REQUEST_STATE_OPTIONS}
          onChange={props.onStateChange}
          onIntent={props.onStateIntent}
        />
      </PullRequestFiltersPillRowElement>
      <PullRequestFiltersSearchRowElement>
        {props.searchCapability === "editable" && props.onSearchChange ? (
          <PullRequestSearchElement
            value={props.searchQuery}
            placeholder="Search pull requests"
            onChange={props.onSearchChange}
          />
        ) : (
          <PullRequestSearchUnavailableElement>
            Search unavailable in this runtime
          </PullRequestSearchUnavailableElement>
        )}
        <PullRequestProjectFilterElement
          projects={props.projects}
          value={props.projectId}
          onChange={props.onProjectChange}
        />
      </PullRequestFiltersSearchRowElement>
    </PullRequestFiltersRootElement>
  );
}
