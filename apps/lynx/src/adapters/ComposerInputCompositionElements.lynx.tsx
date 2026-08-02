import type { ReactNode } from 'react';

import { useLynxInteractiveState } from './useLynxInteractiveState';

interface ComposerHostElementProps {
  readonly children?: ReactNode;
}

export function ComposerInputShellElement(
  props: ComposerHostElementProps & {
    readonly focused: boolean;
    readonly overflowVisible: boolean;
    readonly providerClassName?: string;
  }
) {
  return (
    <view
      className={`ComposerInputShellLynx${props.focused ? ' ComposerInputShellLynx--focused' : ''}`}
    >
      {props.children}
    </view>
  );
}

export function ComposerInputSurfaceElement(
  props: ComposerHostElementProps & {
    readonly focused: boolean;
    readonly overflowVisible: boolean;
    readonly providerClassName?: string;
  }
) {
  return (
    <view
      className={`ComposerInputSurfaceLynx${props.focused ? ' ComposerInputSurfaceLynx--focused' : ''}`}
    >
      {props.children}
    </view>
  );
}

export function ComposerEditorRegionElement(
  props: ComposerHostElementProps & { readonly overflowVisible: boolean }
) {
  return <view className="ComposerEditorRegionLynx">{props.children}</view>;
}

export function ComposerFooterRowElement(
  props: ComposerHostElementProps & { readonly compact: boolean }
) {
  return (
    <view
      className={`ComposerFooterRowLynx${props.compact ? ' ComposerFooterRowLynx--compact' : ''}`}
    >
      {props.children}
    </view>
  );
}

export function ComposerFooterLeadingElement(
  props: ComposerHostElementProps & {
    readonly compact: boolean;
    readonly voiceBusy: boolean;
  }
) {
  return (
    <view
      className={`ComposerFooterLeadingLynx${props.compact ? ' ComposerFooterLeadingLynx--compact' : ''}${props.voiceBusy ? ' ComposerFooterLeadingLynx--voice-busy' : ''}`}
    >
      {props.children}
    </view>
  );
}

export function ComposerFooterActionsElement(
  props: ComposerHostElementProps & { readonly voiceBusy: boolean }
) {
  return (
    <view
      className={`ComposerFooterActionsLynx${props.voiceBusy ? ' ComposerFooterActionsLynx--voice-busy' : ''}`}
    >
      {props.children}
    </view>
  );
}

export function ComposerPrimaryActionElement(props: {
  readonly accessibleLabel?: string;
  readonly disabled: boolean;
  readonly mode: 'send' | 'sending' | 'stop';
  readonly onActivate: () => void;
}) {
  const isStop = props.mode === 'stop';
  const isSending = props.mode === 'sending';
  const label =
    props.accessibleLabel ??
    (isStop ? 'Stop generation' : isSending ? 'Sending' : 'Send message');
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerPrimaryActionLynx ComposerPrimaryActionLynx--${props.mode}${
      props.disabled ? ' ComposerPrimaryActionLynx--disabled' : ''
    }`,
    accessibleLabel: label,
    accessibilityValue: isSending ? 'In progress' : undefined,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });

  return (
    <view
      className={interaction.className}
      aria-label={label}
      {...interaction.eventProps}
    >
      {isSending ? (
        <text className="ComposerPrimaryActionGlyphLynx">•••</text>
      ) : isStop ? (
        <view className="ComposerPrimaryActionStopGlyphLynx" />
      ) : (
        <text className="ComposerPrimaryActionGlyphLynx">↑</text>
      )}
    </view>
  );
}
