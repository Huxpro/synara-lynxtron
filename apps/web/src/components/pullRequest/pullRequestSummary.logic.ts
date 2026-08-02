import type { GitPullRequestCheck } from "@synara/contracts";
import { pluralize } from "@synara/shared/text";

export type PullRequestChecksTone = "pending" | "success" | "failure" | "none";

export interface PullRequestChecksSummary {
  label: string;
  tone: PullRequestChecksTone;
}

export const PULL_REQUEST_CHECKS_TONE_TEXT_CLASS: Record<PullRequestChecksTone, string> = {
  failure: "text-destructive",
  pending: "text-warning",
  success: "text-success",
  none: "",
};

export function summarizePullRequestChecks(
  checks: ReadonlyArray<GitPullRequestCheck>,
): PullRequestChecksSummary {
  const failing = checks.filter((check) => check.status === "failure").length;
  if (failing > 0) {
    return { label: `${failing} ${pluralize(failing, "failing check")}`, tone: "failure" };
  }
  const cancelled = checks.filter((check) => check.status === "cancelled").length;
  if (cancelled > 0) {
    return { label: `${cancelled} ${pluralize(cancelled, "cancelled check")}`, tone: "failure" };
  }
  const pending = checks.filter((check) => check.status === "pending").length;
  if (pending > 0) {
    return { label: `${pending} ${pluralize(pending, "pending check")}`, tone: "pending" };
  }
  if (checks.length === 0) {
    return { label: "No checks", tone: "none" };
  }
  const successful = checks.filter((check) => check.status === "success").length;
  if (successful === 0) {
    return { label: "No required checks", tone: "none" };
  }
  return { label: "All checks passed", tone: "success" };
}

export const PULL_REQUEST_CHECK_STATUS_LABELS: Record<GitPullRequestCheck["status"], string> = {
  pending: "Running",
  success: "Succeeded",
  failure: "Failed",
  skipped: "Skipped",
  neutral: "Neutral",
  cancelled: "Cancelled",
};

export function withStableCheckKeys(
  checks: ReadonlyArray<GitPullRequestCheck>,
): Array<{ key: string; check: GitPullRequestCheck }> {
  const seen = new Map<string, number>();
  return checks.map((check) => {
    const base = `${check.name}|${check.url ?? ""}`;
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return { key: occurrence === 0 ? base : `${base}#${occurrence}`, check };
  });
}

export function summarizePullRequestComments(count: number, truncated = false): string {
  if (count === 0) return truncated ? "Comments may exist" : "No comments";
  const noun = pluralize(count, "comment");
  return truncated ? `${count}+ ${noun}` : `${count} ${noun}`;
}
