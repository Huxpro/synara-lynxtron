import type { ReactNode } from '@lynx-js/react';

import { ChevronRightIcon } from '../lib/icons.lynx';
import './collapsed-work-composition-elements.css';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import { useTheme } from './useTheme.lynx';

type ChildrenProps = { readonly children?: ReactNode };

export function CollapsedWorkRootElement(props: ChildrenProps) {
  return <view className="SharedCollapsedWork">{props.children}</view>;
}

export function CollapsedWorkDisclosureElement(props: ChildrenProps) {
  return <view>{props.children}</view>;
}

export function CollapsedWorkTriggerElement(
  props: ChildrenProps & {
    readonly accessibleLabel: string;
    readonly open: boolean;
    readonly onActivate: () => void;
  }
) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedCollapsedWorkTrigger',
    accessibleLabel: props.accessibleLabel,
    accessibilityValue: props.open ? 'Expanded' : 'Collapsed',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.accessibleLabel}
      aria-expanded={props.open}
      {...interaction.eventProps}
    >
      {props.children}
    </view>
  );
}

export function CollapsedWorkLabelElement(props: ChildrenProps) {
  return <text className="SharedCollapsedWorkLabel">{props.children}</text>;
}

export function CollapsedWorkChevronElement(props: { readonly open: boolean }) {
  const { semanticIconColor } = useTheme();
  return (
    <ChevronRightIcon
      className={disclosureChevronClassName(
        props.open,
        'SharedCollapsedWorkChevron'
      )}
      color={semanticIconColor('secondary')}
      size={12}
    />
  );
}

export function CollapsedWorkPanelElement(
  props: ChildrenProps & { readonly open: boolean }
) {
  const present = useLynxDisclosurePresence(props.open, {
    preserveOnClose: false,
  });
  if (!present) return null;
  return (
    <view
      className={disclosureContentClassName(
        props.open,
        'SharedCollapsedWorkPanel'
      )}
    >
      {props.children}
    </view>
  );
}

export function CollapsedWorkDividerElement() {
  return <view className="SharedCollapsedWorkDivider" />;
}
