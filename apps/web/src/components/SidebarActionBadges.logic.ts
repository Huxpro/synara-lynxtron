/** Upstream removed the review-request count RPC; the shape stays for the Lynx badge. */
interface PullRequestReviewRequestCountResult {
  readonly count: number;
  readonly incomplete: boolean;
}
import { pluralize } from "@synara/shared/text";

export type SidebarActionBadge = {
  readonly text: string;
  readonly accessibleLabel: string;
};

/** Keep partial review counts visible without presenting them as exact. */
export function resolvePullRequestReviewBadge(
  result: PullRequestReviewRequestCountResult | undefined,
): SidebarActionBadge | null {
  if (!result) return null;
  if (result.incomplete) {
    return result.count > 0
      ? {
          text: `${result.count}+`,
          accessibleLabel: `At least ${result.count} ${pluralize(
            result.count,
            "pull request is",
            "pull requests are",
          )} waiting for your review`,
        }
      : null;
  }
  return result.count > 0
    ? {
        text: String(result.count),
        accessibleLabel: `${result.count} ${pluralize(
          result.count,
          "pull request is",
          "pull requests are",
        )} waiting for your review`,
      }
    : null;
}
