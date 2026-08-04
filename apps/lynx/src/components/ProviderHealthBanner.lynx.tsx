import type { ServerProviderStatus } from "@synara/contracts";
import { resolveProviderHealthBannerPresentation } from "@synara-web/components/chat/ProviderHealthBanner.logic";

import { CircleAlertIcon, TriangleAlertIcon, XIcon } from "../lib/icons.lynx";
import { useLynxInteractiveState } from "./ui/interactive-state.lynx";

import "./provider-health-banner.css";

export function ProviderHealthBanner(props: {
  readonly onDismiss?: () => void;
  readonly status: ServerProviderStatus | null;
}) {
  const presentation = resolveProviderHealthBannerPresentation(props.status);
  const dismiss = useLynxInteractiveState({
    baseClassName: "ProviderHealthBannerDismiss",
    accessibleLabel: "Dismiss provider status",
    onActivate: props.onDismiss,
  });
  if (!presentation) return null;

  const Icon = presentation.tone === "error" ? CircleAlertIcon : TriangleAlertIcon;
  return (
    <view className="ProviderHealthBannerFrame">
      <view
        className={`ProviderHealthBanner ProviderHealthBanner--${presentation.tone}`}
        accessibility-element={true}
        accessibility-label={`${presentation.title}. ${presentation.message}`}
      >
        <Icon
          className="ProviderHealthBannerIcon"
          size={16}
          accessibilityLabel={presentation.tone}
        />
        <view className="ProviderHealthBannerCopy">
          <text className="ProviderHealthBannerTitle">{presentation.title}</text>
          <text className="ProviderHealthBannerDescription">{presentation.message}</text>
        </view>
        {props.onDismiss ? (
          <view className={dismiss.className} {...dismiss.eventProps}>
            <XIcon className="ProviderHealthBannerDismissIcon" size={14} />
          </view>
        ) : null}
      </view>
    </view>
  );
}
