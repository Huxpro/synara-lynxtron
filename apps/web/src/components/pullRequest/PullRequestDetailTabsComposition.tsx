// FILE: PullRequestDetailTabsComposition.tsx
// Purpose: Physical shared source for pull-request detail tab order, availability,
//          active state, and unavailable-capability copy.

import {
  PullRequestDetailCapabilityElement,
  PullRequestDetailTabElement,
  PullRequestDetailTabsRootElement,
} from "~/components/pullRequest/PullRequestDetailTabsCompositionElements";

export type PullRequestDetailTab = "summary" | "timeline" | "code";

export const PULL_REQUEST_DETAIL_TABS: ReadonlyArray<{
  readonly value: PullRequestDetailTab;
  readonly label: string;
}> = [
  { value: "summary", label: "Summary" },
  { value: "timeline", label: "Timeline" },
  { value: "code", label: "Code" },
];

export function PullRequestDetailTabsComposition(props: {
  readonly activeTab: PullRequestDetailTab;
  readonly availableTabs: readonly PullRequestDetailTab[];
  readonly onSelectTab: (tab: PullRequestDetailTab) => void;
}) {
  const available = new Set(props.availableTabs);
  return (
    <PullRequestDetailTabsRootElement>
      {PULL_REQUEST_DETAIL_TABS.map((tab) => (
        <PullRequestDetailTabElement
          key={tab.value}
          active={props.activeTab === tab.value}
          available={available.has(tab.value)}
          label={tab.label}
          onActivate={() => props.onSelectTab(tab.value)}
        />
      ))}
    </PullRequestDetailTabsRootElement>
  );
}

function formatUnavailableTabs(tabs: readonly string[]): string {
  if (tabs.length === 1) return tabs[0]!;
  if (tabs.length === 2) return `${tabs[0]} and ${tabs[1]}`;
  return `${tabs.slice(0, -1).join(", ")}, and ${tabs[tabs.length - 1]}`;
}

export function PullRequestDetailCapabilityComposition(props: {
  readonly availableTabs: readonly PullRequestDetailTab[];
}) {
  const available = new Set(props.availableTabs);
  const unavailableLabels = PULL_REQUEST_DETAIL_TABS.filter((tab) => !available.has(tab.value)).map(
    (tab) => tab.label,
  );
  if (unavailableLabels.length === 0) return null;
  return (
    <PullRequestDetailCapabilityElement>
      {formatUnavailableTabs(unavailableLabels)} {unavailableLabels.length === 1 ? "is" : "are"}{" "}
      unavailable in this runtime.
    </PullRequestDetailCapabilityElement>
  );
}
