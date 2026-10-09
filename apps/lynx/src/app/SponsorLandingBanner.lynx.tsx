// FILE: SponsorLandingBanner.lynx.tsx
// Purpose: Lynx rendering of upstream's components/SponsorLandingBanner.tsx: the
//   dismissible empty-landing promotion that opens Synara's sponsorship page. It shares
//   upstream's storage key, so a dismissal holds across both renderers of one profile.

import { useState } from "@lynx-js/react";

import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { StarIcon, XIcon } from "../lib/icons.lynx";
import { webStorage } from "../platform/storage";
import { platformWindow } from "../platform/window";
import "./sponsor-landing-banner.css";

const DISMISSED_STORAGE_KEY = "synara:sponsor-landing-banner:dismissed:v1";
const SPONSOR_URL = "https://www.trysynara.com/sponsor";

function readDismissed(): boolean {
  try {
    return JSON.parse(webStorage.getItem(DISMISSED_STORAGE_KEY) ?? "false") === true;
  } catch {
    return false;
  }
}

export function SponsorLandingBanner() {
  const { semanticIconColor } = useTheme();
  const [dismissed, setDismissed] = useState(readDismissed);
  const open = useLynxInteractiveState({
    baseClassName: "SponsorLandingBannerButton",
    accessibleLabel: "Support Synara. Explore sponsorships and help fund development",
    onActivate: () => {
      "background only";
      void platformWindow.openExternal(SPONSOR_URL);
    },
  });
  const dismiss = useLynxInteractiveState({
    baseClassName: "SponsorLandingBannerDismiss",
    accessibleLabel: "Dismiss sponsor banner",
    onActivate: () => {
      "background only";
      webStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(true));
      setDismissed(true);
    },
  });
  if (dismissed) return null;
  return (
    <view className="SponsorLandingBanner">
      <view className={open.className} {...open.eventProps}>
        <view className="SponsorLandingBannerIcon">
          <StarIcon color={semanticIconColor("accent")} size={20} />
        </view>
        <view className="SponsorLandingBannerCopy">
          <text className="SponsorLandingBannerTitle" text-maxline="1">
            Support Synara
          </text>
          <text className="SponsorLandingBannerDescription" text-maxline="1">
            Explore sponsorships and help fund development
          </text>
        </view>
      </view>
      <view className={dismiss.className} {...dismiss.eventProps}>
        <XIcon color={semanticIconColor("secondary")} size={12} />
      </view>
    </view>
  );
}
