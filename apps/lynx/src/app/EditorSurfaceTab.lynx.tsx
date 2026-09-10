import type { ReactNode } from '@lynx-js/react';

import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from '../adapters/useLynxInteractiveState';
import { XIcon } from '../lib/icons.lynx';

import './editor-surface-tab.css';

/**
 * Lynx counterpart of Web's SurfaceTabChip. Every closable editor/dock tab
 * goes through this primitive so its 16px icon slot, hover-to-close swap and
 * nested close semantics cannot drift between File, Diff, Chat and Terminal.
 */
export function EditorSurfaceTab(props: {
  readonly active?: boolean;
  readonly className?: string;
  readonly closeLabel: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly labelClassName?: string;
  readonly leading?: ReactNode;
  readonly onClose: () => void;
  readonly onSelect?: () => void;
}) {
  const tab = useLynxInteractiveState({
    baseClassName: `EditorSurfaceTab${
      props.active ? ' EditorSurfaceTab--active' : ''
    }${props.className ? ` ${props.className}` : ''}`,
    accessibleLabel: props.onSelect ? props.label : undefined,
    accessibilityValue: props.active ? 'Selected' : undefined,
    onActivate: props.onSelect,
  });
  const close = useLynxInteractiveState({
    baseClassName: 'EditorSurfaceTabClose',
    accessibleLabel: props.closeLabel,
    onActivate: props.onClose,
  });

  return (
    <view className={tab.className} {...tab.eventProps}>
      {props.leading ? (
        <view className="EditorSurfaceTabLeading">{props.leading}</view>
      ) : null}
      <view
        className={`${close.className} EditorSurfaceTabIconSlot`}
        {...lynxNestedInteractiveEventProps(close.eventProps)}
      >
        <view className="EditorSurfaceTabRestingIcon">{props.icon}</view>
        <view className="EditorSurfaceTabCloseGlyph">
          <XIcon className="EditorSurfaceTabCloseIcon" size={14} />
        </view>
      </view>
      <text
        className={`EditorSurfaceTabLabel${
          props.labelClassName ? ` ${props.labelClassName}` : ''
        }`}
      >
        {props.label}
      </text>
    </view>
  );
}
