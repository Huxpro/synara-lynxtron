export interface PrStatePresentation {
  label: "PR open" | "PR closed" | "PR merged" | "PR draft" | "PR has conflicts";
  colorClass: string;
  iconKind: "pull-request" | "draft" | "pull-request-closed" | "merged-simple" | "merge-conflict";
}

export function resolvePrStatePresentation(pr: {
  state: "open" | "closed" | "merged";
  isDraft?: boolean | undefined;
  mergeability?: "mergeable" | "conflicting" | "unknown" | undefined;
}): PrStatePresentation {
  if (pr.state === "open") {
    if (pr.isDraft === true) {
      return {
        label: "PR draft",
        colorClass: "text-status-neutral",
        iconKind: "draft",
      };
    }
    if (pr.mergeability === "conflicting") {
      return {
        label: "PR has conflicts",
        colorClass: "text-status-failure",
        iconKind: "merge-conflict",
      };
    }
    return {
      label: "PR open",
      colorClass: "text-status-open",
      iconKind: "pull-request",
    };
  }
  if (pr.state === "closed") {
    return {
      label: "PR closed",
      colorClass: "text-status-neutral",
      iconKind: "pull-request-closed",
    };
  }
  return {
    label: "PR merged",
    colorClass: "text-status-merged",
    iconKind: "merged-simple",
  };
}
