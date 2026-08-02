import type { ReactNode } from '@lynx-js/react';

import { useLynxInteractiveState } from './useLynxInteractiveState';

export function ComposerTraitFastModeToggleElement(props: {
  readonly enabled: boolean;
  readonly onToggle: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerTraitFastModeToggleLynx${
      props.enabled ? ' ComposerTraitFastModeToggleLynx--active' : ''
    }`,
    onActivate: props.onToggle,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.enabled ? 'Disable Fast mode' : 'Enable Fast mode'}
      aria-pressed={props.enabled}
      {...interaction.eventProps}
    >
      <text
        className={`ComposerTraitFastModeToggleGlyphLynx${
          props.enabled
            ? ' ComposerTraitFastModeToggleGlyphLynx--active'
            : ''
        }`}
      >
        ϟ
      </text>
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
      <text className="ComposerTraitOptionCheckLynx">
        {props.active ? '✓' : ''}
      </text>
      <view className="ComposerTraitOptionCopyLynx">
        <text className="ComposerTraitOptionLabelLynx">
          {props.label}
          {props.isDefault ? ' (default)' : ''}
        </text>
        {props.description ? (
          <text className="ComposerTraitOptionDescriptionLynx">
            {props.description}
          </text>
        ) : null}
      </view>
    </view>
  );
}
