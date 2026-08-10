import sendArrowSvg from '@synara-central-icons/arrow-up.svg?raw';
import type { ReactNode } from 'react';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';

const COMPOSER_SENDING_SPINNER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="20 12"/></svg>';

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
        <svg
          className="ComposerPrimaryActionSendingIconLynx animate-spin"
          content={colorizeLynxSvg(
            COMPOSER_SENDING_SPINNER_SVG,
            'var(--color-background-surface)'
          )}
        />
      ) : isStop ? (
        <view className="ComposerPrimaryActionStopGlyphLynx" />
      ) : (
        <svg
          className="ComposerPrimaryActionSendIconLynx"
          content={colorizeLynxSvg(
            sendArrowSvg,
            'var(--color-background-surface)'
          )}
        />
      )}
    </view>
  );
}
