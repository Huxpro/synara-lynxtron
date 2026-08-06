import type { ReactNode } from '@lynx-js/react';

import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ChevronDownIcon } from '../lib/icons.lynx';

export function ComposerModelTriggerFrameElement(props: {
  readonly children: ReactNode;
}) {
  return <view className="ComposerModelTriggerContentLynx">{props.children}</view>;
}

export function ComposerModelTriggerProviderIconElement(props: {
  readonly provider: string;
}) {
  return (
    <view className="ComposerModelProviderIconLynx">
      <OpenAIProviderIcon provider={props.provider} />
    </view>
  );
}

export function ComposerModelTriggerModelLabelElement(props: {
  readonly children: ReactNode;
  readonly hidden: boolean;
}) {
  return props.hidden ? null : (
    <text className="ComposerModelTriggerLabelLynx">{props.children}</text>
  );
}

export function ComposerModelTriggerFastBadgeElement() {
  return <text className="ComposerModelTriggerMetaLynx">⚡</text>;
}

export function ComposerModelTriggerStatusIconElement(props: {
  readonly accessibleLabel: string;
}) {
  return <text className="ComposerModelTriggerMetaLynx">⚙ {props.accessibleLabel}</text>;
}

export function ComposerModelTriggerStatusLabelElement(props: {
  readonly children: ReactNode;
}) {
  return <text className="ComposerModelTriggerMetaLynx">{props.children}</text>;
}

export function ComposerModelTriggerChevronElement() {
  return <ChevronDownIcon className="ComposerModelTriggerChevronLynx" size={12} />;
}
