import type { ServerProviderStatus } from "@synara/contracts";
import { resolveProviderHealthBannerPresentation } from "@synara-web/components/chat/ProviderHealthBanner.logic";

import { CircleAlertIcon, TriangleAlertIcon, XIcon } from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "./ui/interactive-state.lynx";
import { Alert, AlertDescription, AlertTitle } from './ui/alert.lynx';

import "./provider-health-banner.css";

export function ProviderHealthBanner(props: {
  readonly onDismiss?: () => void;
  readonly status: ServerProviderStatus | null;
}) {
  const presentation = resolveProviderHealthBannerPresentation(props.status);
  const { activeTheme, svgColors } = useTheme();
  const dismiss = useLynxInteractiveState({
    baseClassName: "ProviderHealthBannerDismiss",
    accessibleLabel: "Dismiss provider status",
    onActivate: props.onDismiss,
  });
  if (!presentation) return null;

  const Icon = presentation.tone === "error" ? CircleAlertIcon : TriangleAlertIcon;
  return (
    <view className="ProviderHealthBannerFrame">
      <Alert
        className={`ProviderHealthBanner ProviderHealthBanner--${presentation.tone}`}
        accessibilityLabel={`${presentation.title}. ${presentation.message}`}
        variant={presentation.tone}
      >
        <Icon
          className="ProviderHealthBannerIcon"
          color={
            presentation.tone === "error"
              ? activeTheme.theme.semanticColors.diffRemoved
              : svgColors.warning
          }
          size={16}
          accessibilityLabel={presentation.tone}
        />
        <view className="ProviderHealthBannerCopy">
          <AlertTitle className="ProviderHealthBannerTitle">{presentation.title}</AlertTitle>
          <AlertDescription className="ProviderHealthBannerDescription"><text>{presentation.message}</text></AlertDescription>
        </view>
        {props.onDismiss ? (
          <view className={dismiss.className} {...dismiss.eventProps}>
            <XIcon className="ProviderHealthBannerDismissIcon" size={14} />
          </view>
        ) : null}
      </Alert>
    </view>
  );
}
