import sendArrowSvg from '@synara-central-icons/arrow-up.svg?raw';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from '@lynx-js/react';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from './useTheme.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import {
  formatContextWindowTokens,
  formatCostUsd,
  type ContextWindowMeterDisplay,
  type ContextWindowSnapshot,
} from '@synara-web/lib/contextWindow';

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
  props: ComposerHostElementProps & { readonly compact: boolean; readonly voiceBusy: boolean }
) {
  return (
    <view
      className={`ComposerFooterActionsLynx${props.compact ? ' ComposerFooterActionsLynx--compact' : ''}${props.voiceBusy ? ' ComposerFooterActionsLynx--voice-busy' : ''}`}
    >
      {props.children}
    </view>
  );
}

export function ComposerContextWindowMeterElement(props: {
  readonly display: ContextWindowMeterDisplay;
  readonly usage: ContextWindowSnapshot;
  readonly cumulativeCostUsd?: number | null;
  readonly activeWindowLabel?: string | null;
  readonly pendingWindowLabel?: string | null;
  readonly initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(props.initialOpen ?? false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { semanticIconColor } = useTheme();
  const radius = 6;
  const percentage = Math.max(0, Math.min(100, props.display.normalizedPercentage));
  const endAngle = -90 + (percentage / 100) * 360;
  const endRadians = (endAngle * Math.PI) / 180;
  const endX = 8 + radius * Math.cos(endRadians);
  const endY = 8 + radius * Math.sin(endRadians);
  const progressShape =
    percentage <= 0
      ? ''
      : percentage >= 100
        ? `<circle cx="8" cy="8" r="${radius}" fill="none" stroke="${semanticIconColor('primary')}" stroke-width="2"/>`
        : `<path d="M 8 2 A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${endX} ${endY}" fill="none" stroke="${semanticIconColor('primary')}" stroke-width="2" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="${radius}" fill="none" stroke="${semanticIconColor('secondary')}" stroke-opacity="0.4" stroke-width="2"/>${progressShape}</svg>`;
  const popoverRows = [
    { tone: 'title' as const, text: 'Context window' },
    ...(props.pendingWindowLabel
      ? [{ tone: 'muted' as const, text: `Current session: ${props.activeWindowLabel ?? 'Unknown'}` }]
      : []),
    {
      tone: 'value' as const,
      text: props.display.usedPercentageLabel
        ? props.display.hasReliableTokenRatio
          ? `${props.display.usedPercentageLabel} ⋅ ${props.display.tokenUsageLabel}/${formatContextWindowTokens(props.usage.maxTokens)} context used`
          : `${props.display.usedPercentageLabel} context used`
        : `${props.display.tokenUsageLabel} tokens used so far`,
    },
    ...(props.usage.maxTokens !== null
      ? [{ tone: 'muted' as const, text: `Model window: ${formatContextWindowTokens(props.usage.maxTokens)} tokens` }]
      : []),
    ...(props.pendingWindowLabel
      ? [{ tone: 'muted' as const, text: `Next turn: ${props.pendingWindowLabel}` }]
      : []),
    ...((props.usage.totalProcessedTokens ?? 0) > props.usage.usedTokens
      ? [{ tone: 'muted' as const, text: `Total processed: ${formatContextWindowTokens(props.usage.totalProcessedTokens)} tokens` }]
      : []),
    ...(props.usage.compactsAutomatically
      ? [{ tone: 'muted' as const, text: 'Automatically compacts its context when needed.' }]
      : []),
    ...(props.cumulativeCostUsd !== null && props.cumulativeCostUsd !== undefined
      ? [{ tone: 'muted' as const, text: `Session cost: ${formatCostUsd(props.cumulativeCostUsd)}` }]
      : []),
  ];
  const popoverLineCount = popoverRows.length;
  const popoverRowHeight = 17;
  const popoverRowGap = 6;
  const popoverHeight =
    16 +
    popoverLineCount * popoverRowHeight +
    (popoverLineCount - 1) * popoverRowGap;
  const clearHoverTimer = () => {
    if (hoverTimerRef.current === null) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };
  useEffect(() => clearHoverTimer, []);

  return (
    <view
      className={`ComposerContextWindowMeterLynx${open ? ' ComposerContextWindowMeterLynx--open' : ''}`}
      aria-label={props.display.ariaLabel}
      accessibility-element={true}
      accessibility-role="button"
      accessibility-value={open ? 'Expanded' : 'Collapsed'}
      focusable={true}
      bindmouseenter={() => {
        clearHoverTimer();
        hoverTimerRef.current = setTimeout(() => {
          hoverTimerRef.current = null;
          setOpen(true);
        }, 150);
      }}
      bindmouseleave={() => { clearHoverTimer(); setOpen(false); }}
      bindfocus={() => { clearHoverTimer(); setOpen(true); }}
      bindblur={() => { clearHoverTimer(); setOpen(false); }}
      bindtap={() => { clearHoverTimer(); setOpen((current) => !current); }}
    >
      <view className="ComposerContextWindowMeterIconLynx"><svg content={svg} /></view>
      {open ? (
        <view
          className="ComposerContextWindowPopoverLynx"
          style={{ height: `${popoverHeight}px` }}
        >
          {popoverRows.map((row, index) => (
            <view
              key={`${row.tone}:${row.text}`}
              className={`ComposerContextWindowPopoverRowLynx ComposerContextWindowPopoverRowLynx--${row.tone}`}
              style={{ top: `${8 + index * (popoverRowHeight + popoverRowGap)}px` }}
            >
              <text>{row.text}</text>
            </view>
          ))}
        </view>
      ) : null}
    </view>
  );
}

export function ComposerPrimaryActionElement(props: {
  readonly accessibleLabel?: string;
  readonly disabled: boolean;
  readonly mode: 'send' | 'sending' | 'stop';
  readonly onActivate: () => void;
}) {
  const { svgColors } = useTheme();
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
            svgColors.surface
          )}
        />
      ) : isStop ? (
        <view className="ComposerPrimaryActionStopGlyphLynx" />
      ) : (
        <svg
          className="ComposerPrimaryActionSendIconLynx"
          content={colorizeLynxSvg(
            sendArrowSvg,
            svgColors.surface
          )}
        />
      )}
    </view>
  );
}
