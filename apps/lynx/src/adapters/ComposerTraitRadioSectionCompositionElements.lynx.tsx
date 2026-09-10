import type { ReactNode } from '@lynx-js/react';
import fastModeFilledSvg from '@synara-central-icons-fill/zap.svg?raw';
import fastModeSvg from '@synara-central-icons/zap.svg?raw';

import { CheckIcon } from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from './useTheme.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';

export function ComposerTraitFastModeToggleElement(props: {
  readonly enabled: boolean;
  readonly onToggle: () => void;
}) {
  const { resolvedTheme, semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerTraitFastModeToggleLynx${
      props.enabled ? ' ComposerTraitFastModeToggleLynx--active' : ''
    }`,
    accessibleLabel: 'Fast mode',
    accessibilityValue: props.enabled ? 'On' : 'Off',
    onActivate: props.onToggle,
  });
  return (
    <view
      className={interaction.className}
      aria-label="Fast mode"
      aria-pressed={props.enabled}
      {...interaction.eventProps}
    >
      <svg
        className={`ComposerTraitFastModeToggleIconLynx${
          props.enabled
            ? ' ComposerTraitFastModeToggleIconLynx--active'
            : ''
        }`}
        content={colorizeLynxSvg(
          props.enabled ? fastModeFilledSvg : fastModeSvg,
          props.enabled
            ? resolvedTheme === 'dark'
              ? '#fbbf24'
              : '#f59e0b'
            : semanticIconColor('secondary')
        )}
      />
    </view>
  );
}

export function ComposerTraitSectionElement(props: {
  readonly children: ReactNode;
  readonly label: string;
  readonly labelTrailing?: ReactNode;
  readonly note?: ReactNode;
}) {
  return (
    <view className="ComposerTraitSectionLynx">
      <view className="ComposerTraitSectionHeaderLynx">
        <text className="ComposerTraitSectionLabelLynx">{props.label}</text>
        {props.labelTrailing}
      </view>
      {props.note}
      {props.children}
    </view>
  );
}

export function ComposerTraitRadioGroupElement(props: {
  readonly children: ReactNode;
  readonly value: string;
}) {
  return <view className="ComposerTraitOptionListLynx">{props.children}</view>;
}

export function ComposerTraitRadioItemElement(props: {
  readonly active: boolean;
  readonly description?: string | null;
  readonly disabled: boolean;
  readonly isDefault: boolean;
  readonly label: string;
  readonly value: string;
  readonly onSelect: () => void;
  readonly onSelectionComplete?: () => void;
}) {
  const activate = () => {
    'background only';
    if (props.disabled) return;
    props.onSelect();
    props.onSelectionComplete?.();
  };
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerTraitOptionLynx${
      props.active ? ' ComposerTraitOptionLynx--active' : ''
    }${props.disabled ? ' ComposerTraitOptionLynx--disabled' : ''}`,
    accessibleLabel: props.label,
    accessibilityValue: [
      props.active ? 'Selected' : null,
      props.description,
    ]
      .filter(Boolean)
      .join('. ') || undefined,
    disabled: props.disabled,
    onActivate: activate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.label}
      aria-selected={props.active}
      {...interaction.eventProps}
    >
      <view className="ComposerTraitOptionCopyLynx">
        <text className="ComposerTraitOptionLabelLynx">
          {props.label}
          {props.isDefault ? ' (default)' : ''}
        </text>
      </view>
      <view className="ComposerTraitOptionCheckLynx">
        {props.active ? <CheckIcon size={12} /> : null}
      </view>
    </view>
  );
}
