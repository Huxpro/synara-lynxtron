import type { ReactNode } from "@lynx-js/react";
import fastModeSvg from "@synara-central-icons-fill/zap.svg?raw";

import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { ChevronDownIcon, SettingsIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "./useTheme.lynx";

export function ComposerModelTriggerFrameElement(props: { readonly children: ReactNode }) {
  return <view className="ComposerModelTriggerContentLynx">{props.children}</view>;
}

export function ComposerModelTriggerProviderIconElement(props: { readonly provider: string }) {
  return (
    <view className="ComposerModelProviderIconLynx">
      <OpenAIProviderIcon provider={props.provider} />
    </view>
  );
}

export function ComposerModelTriggerModelLabelElement(props: {
  readonly hidden: boolean;
  readonly modelLabel: string;
}) {
  return props.hidden ? null : (
    <text className="ComposerModelTriggerLabelLynx">{props.modelLabel}</text>
  );
}

export function ComposerModelTriggerFastBadgeElement() {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="ComposerModelTriggerFastIconLynx"
      content={colorizeLynxSvg(fastModeSvg, semanticIconColor("secondary"))}
    />
  );
}

export function ComposerModelTriggerStatusIconElement(props: { readonly accessibleLabel: string }) {
  const { semanticIconColor } = useTheme();
  return (
    <view
      className="ComposerModelTriggerStatusLynx"
      accessibility-element
      accessibility-label={props.accessibleLabel}
    >
      <SettingsIcon
        className="ComposerModelTriggerStatusIconLynx"
        color={semanticIconColor("secondary")}
        size={14}
      />
    </view>
  );
}

export function ComposerModelTriggerStatusLabelElement(props: { readonly children: ReactNode }) {
  return <text className="ComposerModelTriggerMetaLynx">{props.children}</text>;
}

export function ComposerModelTriggerChevronElement() {
  const { semanticIconColor } = useTheme();
  return (
    <ChevronDownIcon
      className="ComposerModelTriggerChevronLynx"
      color={semanticIconColor("secondary")}
      size={12}
    />
  );
}
