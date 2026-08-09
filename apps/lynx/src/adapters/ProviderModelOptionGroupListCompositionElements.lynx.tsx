import type { ReactNode } from '@lynx-js/react';
import starFilledSvg from '@synara-central-icons-fill/star.svg?raw';
import starSvg from '@synara-central-icons/star.svg?raw';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '../lib/icons.lynx';
import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from '../components/ui/interactive-state.lynx';
import { useTheme } from './useTheme.lynx';

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
        {props.open ? (
          <ChevronDownIcon
            className="ComposerModelGroupChevronLynx"
            size={12}
          />
        ) : (
          <ChevronRightIcon
            className="ComposerModelGroupChevronLynx"
            size={12}
          />
        )}
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
  const { resolvedTheme, svgColors } = useTheme();
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
      <view className="ComposerModelOptionCheckLynx">
        {props.active ? <CheckIcon size={12} /> : null}
      </view>
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
          <svg
            className={`ComposerModelOptionFavoriteIconLynx${
              props.isFavorite
                ? ' ComposerModelOptionFavoriteIconLynx--active'
                : ''
            }`}
            content={colorizeLynxSvg(
              props.isFavorite ? starFilledSvg : starSvg,
              props.isFavorite
                ? resolvedTheme === 'dark'
                  ? '#fbbf24'
                  : '#f59e0b'
                : svgColors.mutedForeground
            )}
          />
        </view>
      ) : null}
    </view>
  );
}
