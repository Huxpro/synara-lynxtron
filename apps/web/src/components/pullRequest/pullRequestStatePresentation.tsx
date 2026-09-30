// FILE: pullRequestStatePresentation.tsx
// Purpose: Single source of truth for how a pull request's state renders across the app —
//          the sidebar thread badge, kanban card chip, list rows, detail panel, and dock tab
//          all resolve label, color, and glyph from here so no surface can drift. Icons come
//          from the same three-node Central "reversed" family (pull-request / draft /
//          request-closed / merged-simple).
// Layer: Pull request presentation
// Exports: PrStatePresentation, resolvePrStatePresentation, PR_STATE_PRESENTATION_ICONS,
//          PullRequestConflictIcon

import { cn } from "~/lib/utils";
import { PR_STATE_PRESENTATION_ICONS } from "./pullRequestStatePresentation.icons";
import { resolvePrStatePresentation } from "./pullRequestStatePresentation.logic";

export { PR_STATE_PRESENTATION_ICONS } from "./pullRequestStatePresentation.icons";
export {
  resolvePrStatePresentation,
  type PrStatePresentation,
} from "./pullRequestStatePresentation.logic";

/**
 * The "this pull request has conflicts" glyph, for surfaces that call the conflict out beside
 * their own copy (a meta row, an environment row) rather than through the state glyph. It
 * resolves the icon and the red from the table above, so a surface can't reach for a generic
 * alert icon or amber and quietly disagree with the badge sitting next to it. The ink is the
 * point, so callers pass size only.
 */
export function PullRequestConflictIcon({ className }: { className?: string }) {
  const presentation = resolvePrStatePresentation({ state: "open", mergeability: "conflicting" });
  const Icon = PR_STATE_PRESENTATION_ICONS[presentation.iconKind];
  return <Icon aria-hidden className={cn("shrink-0", presentation.colorClass, className)} />;
}
