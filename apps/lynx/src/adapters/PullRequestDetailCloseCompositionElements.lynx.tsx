import { ExternalLinkIcon, XIcon } from "../lib/icons.lynx";
import { openExternalBestEffort } from "../platform/window";
import "./pull-request-detail-close-composition-elements.css";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

export function PullRequestDetailCloseButtonElement(props: {
  readonly accessibleLabel: string;
  readonly tooltip: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedPrDetailCloseButton",
    accessibleLabel: props.accessibleLabel,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.accessibleLabel}
      {...interaction.eventProps}
    >
      <XIcon size={16} color="var(--foreground)" />
    </view>
  );
}

export function PullRequestDetailExternalButtonElement(props: { readonly url: string }) {
  const openExternal = () => {
    "background only";
    openExternalBestEffort(props.url);
  };
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedPrDetailCloseButton SharedPrDetailExternalButton",
    accessibleLabel: "Open in external browser",
    onActivate: openExternal,
  });
  return (
    <view
      className={interaction.className}
      aria-label="Open in external browser"
      {...interaction.eventProps}
    >
      <ExternalLinkIcon size={16} color="var(--foreground)" />
    </view>
  );
}
