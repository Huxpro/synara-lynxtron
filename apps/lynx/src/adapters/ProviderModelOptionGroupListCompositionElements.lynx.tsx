import type { ReactNode } from '@lynx-js/react';

import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from '../components/ui/interactive-state.lynx';

export function ProviderModelOptionListFrameElement(props: {
  readonly children: ReactNode;
}) {
  return <scroll-view className="ComposerModelOptionListLynx" scroll-orientation="vertical">{props.children}</scroll-view>;
}

export function ProviderModelGroupElement(props: {
  readonly children: ReactNode;
}) {
  return <view className="ComposerModelGroupLynx">{props.children}</view>;
}

export function ProviderModelGroupLabelElement(props: {
  readonly children: ReactNode;
}) {
  return <text className="ComposerModelGroupLabelLynx">{props.children}</text>;
}

export function ProviderModelCollapsibleGroupElement(props: {
  readonly children: ReactNode;
  readonly label: string;
  readonly count: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'ComposerModelGroupHeaderLynx',
    onActivate: () => {
      'background only';
      props.onOpenChange(!props.open);
    },
  });
  return (
    <view className="ComposerModelGroupLynx">
      <view
        className={interaction.className}
        aria-label={`${props.open ? 'Collapse' : 'Expand'} ${props.label} models`}
        aria-expanded={props.open}
        {...interaction.eventProps}
      >
        <text className="ComposerModelGroupChevronLynx">{props.open ? '⌄' : '›'}</text>
        <text className="ComposerModelGroupLabelLynx">{props.label}</text>
        <text className="ComposerModelGroupCountLynx">{props.count}</text>
      </view>
      {props.open ? props.children : null}
    </view>
  );
}

export function ProviderModelRadioItemElement(props: {
  readonly active: boolean;
  readonly costMultiplierLabel: string | null;
  readonly description?: string;
  readonly favoriteProvider: 'cursor' | 'kilo' | 'opencode' | 'pi' | null;
  readonly isFavorite: boolean;
  readonly modelName: string;
  readonly modelSlug: string;
  readonly onAfterSelection?: () => void;
  readonly onSelect: () => void;
  readonly onToggleFavorite: () => void;
}) {
  const optionInteraction = useLynxInteractiveState({
    baseClassName: `ComposerModelOptionLynx${
      props.active ? ' ComposerModelOptionLynx--active' : ''
    }`,
    onActivate: () => {
      'background only';
      props.onSelect();
      props.onAfterSelection?.();
    },
  });
  const favoriteInteraction = useLynxInteractiveState({
    baseClassName: `ComposerModelOptionFavoriteLynx${
      props.isFavorite ? ' ComposerModelOptionFavoriteLynx--active' : ''
    }`,
    onActivate: props.onToggleFavorite,
  });
  const favoriteEventProps = lynxNestedInteractiveEventProps(
    favoriteInteraction.eventProps
  );
  return (
    <view
      className={optionInteraction.className}
      aria-label={`Select ${props.modelName}`}
      aria-selected={props.active}
      {...optionInteraction.eventProps}
    >
      <text className="ComposerModelOptionCheckLynx">{props.active ? '✓' : ''}</text>
      <text className="ComposerModelOptionNameLynx">{props.modelName}</text>
      {props.costMultiplierLabel ? (
        <text className="ComposerModelOptionMetaLynx">{props.costMultiplierLabel}</text>
      ) : null}
      {props.favoriteProvider ? (
        <view
          className={favoriteInteraction.className}
          aria-label={`${
            props.isFavorite ? 'Remove' : 'Add'
          } ${props.modelName} ${
            props.isFavorite ? 'from' : 'to'
          } favourites`}
          aria-checked={props.isFavorite}
          {...favoriteEventProps}
        >
          <text
            className={`ComposerModelOptionFavoriteGlyphLynx${
              props.isFavorite
                ? ' ComposerModelOptionFavoriteGlyphLynx--active'
                : ''
            }`}
          >
            {props.isFavorite ? '★' : '☆'}
          </text>
        </view>
      ) : null}
    </view>
  );
}
