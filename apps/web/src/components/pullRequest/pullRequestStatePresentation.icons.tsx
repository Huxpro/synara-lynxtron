import {
  GitMergeConflictIcon,
  GitMergedSimpleIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  type LucideIcon,
} from "~/lib/icons";

import type { PrStatePresentation } from "./pullRequestStatePresentation.logic";

export const PR_STATE_PRESENTATION_ICONS: Record<PrStatePresentation["iconKind"], LucideIcon> = {
  "pull-request": GitPullRequestIcon,
  draft: GitPullRequestDraftIcon,
  "pull-request-closed": GitPullRequestClosedIcon,
  "merged-simple": GitMergedSimpleIcon,
  "merge-conflict": GitMergeConflictIcon,
};
