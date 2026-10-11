import type { ThreadSummary } from "./queries";
import { TaskCompletionToastHost } from "./TaskCompletionToastHost.lynx";
import { VoiceNotificationHost } from "./VoiceNotificationHost.lynx";
import { ProviderUpdatePrompt } from "./ProviderUpdatePrompt.lynx";

/** Existing app notifications share one shell, independent of routed content. */
export function AppNotificationStack(props: {
  readonly hidden: boolean;
  readonly activeThreadId: string | null;
  readonly threads: readonly ThreadSummary[];
  readonly onOpenThread: (threadId: string) => void;
  readonly onReviewProviders: () => void;
}) {
  return (
    <view className={`AppNotificationStack${props.hidden ? " AppNotificationStack--hidden" : ""}`}>
      <VoiceNotificationHost />
      <TaskCompletionToastHost
        activeThreadId={props.activeThreadId}
        threads={props.threads}
        onOpenThread={props.onOpenThread}
      />
      <ProviderUpdatePrompt onReview={props.onReviewProviders} />
    </view>
  );
}
