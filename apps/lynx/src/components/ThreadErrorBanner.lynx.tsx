import { CircleAlertIcon, CopyIcon, XIcon } from "../lib/icons.lynx";
import { clipboard } from "../platform/clipboard";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "./ui/interactive-state.lynx";

import "./thread-error-banner.css";

export function ThreadErrorBanner(props: {
  readonly error: string | null;
  /**
   * In the transcript (a failed turn's row) rather than above it: upstream's
   * card with a title, the muted message and a Copy error action.
   */
  readonly inline?: boolean;
  readonly onDismiss?: () => void;
  readonly title?: string;
}) {
  const { activeTheme } = useTheme();
  const dismiss = useLynxInteractiveState({
    baseClassName: "ThreadErrorBannerDismiss",
    accessibleLabel: "Dismiss error",
    onActivate: props.onDismiss,
  });
  const error = props.error;
  const copy = useLynxInteractiveState({
    baseClassName: "ThreadErrorBannerAction",
    accessibleLabel: "Copy error",
    onActivate: () => {
      "background only";
      if (error) void clipboard.writeText(error);
    },
  });
  if (!props.error) return null;

  if (props.inline) {
    return (
      <view
        className="ThreadErrorBanner ThreadErrorBanner--inline"
        accessibility-element
        accessibility-label={props.title ? `${props.title}. ${props.error}` : props.error}
      >
        <CircleAlertIcon
          className="ThreadErrorBannerIcon"
          color={activeTheme.theme.semanticColors.diffRemoved}
          size={16}
          accessibilityLabel="error"
        />
        <view className="ThreadErrorBannerBody">
          {props.title ? <text className="ThreadErrorBannerTitle">{props.title}</text> : null}
          <text className="ThreadErrorBannerDescription" text-maxline="3">
            {props.error}
          </text>
          <view className="ThreadErrorBannerActions">
            <view className={copy.className} {...copy.eventProps}>
              <CopyIcon color="var(--muted-foreground)" size={12} />
              <text className="ThreadErrorBannerActionText">Copy error</text>
            </view>
          </view>
        </view>
      </view>
    );
  }

  return (
    <view className="ThreadErrorBannerFrame">
      <view className="ThreadErrorBanner" accessibility-element accessibility-label={props.error}>
        <CircleAlertIcon
          className="ThreadErrorBannerIcon"
          color={activeTheme.theme.semanticColors.diffRemoved}
          size={16}
          accessibilityLabel="error"
        />
        <text className="ThreadErrorBannerText">{props.error}</text>
        {props.onDismiss ? (
          <view className={dismiss.className} {...dismiss.eventProps}>
            <XIcon
              className="ThreadErrorBannerDismissIcon"
              color={activeTheme.theme.semanticColors.diffRemoved}
              size={14}
            />
          </view>
        ) : null}
      </view>
    </view>
  );
}
