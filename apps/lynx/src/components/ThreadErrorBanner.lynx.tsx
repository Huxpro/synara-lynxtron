import { CircleAlertIcon, XIcon } from '../lib/icons.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { useLynxInteractiveState } from './ui/interactive-state.lynx';

import './thread-error-banner.css';

export function ThreadErrorBanner(props: {
  readonly error: string | null;
  readonly onDismiss?: () => void;
}) {
  const { activeTheme } = useTheme();
  const dismiss = useLynxInteractiveState({
    baseClassName: 'ThreadErrorBannerDismiss',
    accessibleLabel: 'Dismiss error',
    onActivate: props.onDismiss,
  });
  if (!props.error) return null;

  return (
    <view className="ThreadErrorBannerFrame">
      <view
        className="ThreadErrorBanner"
        accessibility-element
        accessibility-label={props.error}
      >
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
