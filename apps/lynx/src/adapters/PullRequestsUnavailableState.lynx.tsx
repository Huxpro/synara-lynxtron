import { useLynxSystemStateAnnouncement } from "../platform/system-state-announcement.lynx";
import { Button } from "../components/ui/button";
import { TriangleAlertIcon } from "../lib/icons.lynx";
import "./pull-requests-unavailable-state.css";

function resolveUnavailableCopy(error: unknown): {
  readonly description: string;
  readonly title: string;
} {
  if (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === "PullRequestsUnavailableError"
  ) {
    const reason = "reason" in error ? error.reason : undefined;
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "The pull request request failed.";
    return {
      title:
        reason === "gh-not-installed"
          ? "GitHub CLI is required"
          : reason === "gh-not-authenticated"
            ? "Sign in to GitHub CLI"
            : "Pull requests are unavailable",
      description: message,
    };
  }
  return {
    title: "Pull requests are unavailable",
    description: error instanceof Error ? error.message : "The pull request request failed.",
  };
}

export function PullRequestsUnavailableState(props: {
  readonly error: unknown;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}) {
  const copy = resolveUnavailableCopy(props.error);
  const announcement = `${copy.title}. ${copy.description}`;
  useLynxSystemStateAnnouncement({
    intent: "alert",
    announcement,
  });
  return (
    <view className="SharedPrUnavailable">
      <view
        className="SharedPrUnavailableCopy"
        accessibility-element={true}
        accessibility-label={announcement}
        accessibility-trait="text"
      >
        <TriangleAlertIcon
          className="SharedPrUnavailableIcon"
          size={18}
          color="var(--muted-foreground)"
        />
        <text className="SharedPrUnavailableTitle">{copy.title}</text>
        <text className="SharedPrUnavailableDescription">{copy.description}</text>
      </view>
      <Button
        variant="outline"
        size="sm"
        disabled={props.retrying}
        aria-label={props.retrying ? "Retrying pull requests" : "Retry pull requests"}
        onClick={props.onRetry}
      >
        {props.retrying ? "Retrying…" : "Retry"}
      </Button>
    </view>
  );
}
