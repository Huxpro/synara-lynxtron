import type { ProjectId } from '@synara/contracts';
import { useEffect, useRef, type ReactNode } from '@lynx-js/react';
import type { InputRef } from '@lynx-js/lynx-ui';
import filterSvg from '@synara-central-icons/filter-2.svg?raw';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Menu,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu';
import { RefreshCwIcon, SearchIcon } from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import './pull-request-route-controls-composition-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import { useTheme } from './useTheme.lynx';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestRouteHeaderRootElement(
  props: ChildrenProps & { readonly hostClassName?: string | undefined }
) {
  return <view className="SharedPrRouteHeader">{props.children}</view>;
}

export function PullRequestRouteHeaderRowElement(props: ChildrenProps) {
  return <view className="SharedPrRouteHeaderRow">{props.children}</view>;
}

export function PullRequestRouteHeaderNavigationElement() {
  return null;
}

export function PullRequestRouteHeaderTitleElement(props: ChildrenProps) {
  return <text className="SharedPrRouteHeaderTitle">{props.children}</text>;
}

export function PullRequestRouteHeaderScopeElement(props: ChildrenProps) {
  return (
    <view className="SharedPrRouteHeaderScope">
      <text className="SharedPrRouteHeaderScopeSeparator">·</text>
      <text className="SharedPrRouteHeaderScopeText">{props.children}</text>
    </view>
  );
}

export function PullRequestRouteHeaderSpacerElement() {
  return <view className="SharedPrRouteHeaderSpacer" />;
}

export function PullRequestRouteHeaderRefreshElement(props: {
  readonly disabled: boolean;
  readonly refreshing: boolean;
  readonly title: string;
  readonly onActivate: () => void;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={props.disabled}
      aria-label="Refresh pull requests"
      className="SharedPrRouteRefresh"
      onClick={props.onActivate}
    >
      <RefreshCwIcon
        className={`SharedPrRouteRefreshIcon${
          props.refreshing ? ' animate-spin' : ''
        }`}
        size={16}
      />
    </Button>
  );
}

export function PullRequestFiltersRootElement(props: ChildrenProps) {
  return <view className="SharedPrFilters">{props.children}</view>;
}

export function PullRequestFiltersPillRowElement(props: ChildrenProps) {
  return <view className="SharedPrFilterPillRow">{props.children}</view>;
}

export function PullRequestFilterPillGroupElement<T extends string>(props: {
  readonly value: T;
  readonly options: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  readonly onChange: (value: T) => void;
  readonly onIntent?: ((value: T) => void) | undefined;
}) {
  return (
    <view className="SharedPrFilterPillGroup">
      {props.options.map((option) => (
        <PullRequestFilterPillElement
          key={option.value}
          active={option.value === props.value}
          label={option.label}
          onActivate={() => props.onChange(option.value)}
          onIntent={() => props.onIntent?.(option.value)}
        />
      ))}
    </view>
  );
}

function PullRequestFilterPillElement(props: {
  readonly active: boolean;
  readonly label: string;
  readonly onActivate: () => void;
  readonly onIntent: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedPrFilterPill${
      props.active ? ' SharedPrFilterPill--active' : ''
    }`,
    accessibleLabel: props.label,
    accessibilityValue: props.active ? 'Selected' : undefined,
    onActivate: props.onActivate,
    onIntent: props.onIntent,
  });
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
      aria-pressed={props.active}
      accessibility-state={{ selected: props.active }}
    >
      <text
        className={`SharedPrFilterPillText${
          props.active ? ' SharedPrFilterPillText--active' : ''
        }`}
      >
        {props.label}
      </text>
    </view>
  );
}

export function PullRequestFiltersSearchRowElement(props: ChildrenProps) {
  return <view className="SharedPrFilterSearchRow">{props.children}</view>;
}

export function PullRequestSearchElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}) {
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (props.value.length === 0) {
      void inputRef.current?.setValue('').catch(() => undefined);
    }
  }, [props.value]);
  return (
    <view className="SharedPrSearch">
      <view className="SharedPrSearchIcon">
        <SearchIcon size={14} color="var(--muted-foreground)" />
      </view>
      <Input
        ref={inputRef}
        className="SharedPrSearchInput"
        size="sm"
        variant="soft"
        type="search"
        defaultValue={props.value}
        placeholder={props.placeholder}
        aria-label={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation?.();
            props.onChange('');
          }
        }}
      />
    </view>
  );
}

export function PullRequestSearchUnavailableElement(props: ChildrenProps) {
  return (
    <view className="SharedPrSearchUnavailable">
      <text className="SharedPrSearchUnavailableText">{props.children}</text>
    </view>
  );
}

export function PullRequestProjectFilterElement(props: {
  readonly projects: ReadonlyArray<readonly [ProjectId, string]>;
  readonly value: ProjectId | undefined;
  readonly onChange: (value: ProjectId | undefined) => void;
}) {
  const selectedName =
    props.projects.find(([projectId]) => projectId === props.value)?.[1] ??
    'All projects';
  const active = props.value !== undefined;
  const { svgColors } = useTheme();
  const triggerLabel = `Filter pull requests by project: ${selectedName}`;
  return (
    <Menu>
      <MenuTrigger ariaLabel={triggerLabel}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={triggerLabel}
          buttonProps={{
            'aria-pressed': active,
            'accessibility-state': { selected: active },
          }}
          className="SharedPrProjectFilterTrigger"
        >
          <view className="SharedPrProjectFilterIconSlot">
            <svg
              className="SharedPrProjectFilterIcon"
              content={colorizeLynxSvg(filterSvg, svgColors.foreground)}
            />
          </view>
          {active ? <view className="SharedPrProjectFilterDot" /> : null}
        </Button>
      </MenuTrigger>
      <MenuPopup
        side="bottom"
        align="end"
        className="SharedPrProjectFilterPopup"
      >
        <MenuGroupLabel className="SharedPrProjectFilterLabel">
          Project
        </MenuGroupLabel>
        <scroll-view
          className="SharedPrProjectFilterList"
          scroll-orientation="vertical"
        >
          <MenuRadioGroup
            value={props.value ?? ''}
            onValueChange={(value) =>
              props.onChange(value ? (value as ProjectId) : undefined)
            }
          >
            <MenuRadioItem value="">All projects</MenuRadioItem>
            {props.projects.map(([projectId, title]) => (
              <MenuRadioItem key={projectId} value={projectId}>
                {title}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </scroll-view>
      </MenuPopup>
    </Menu>
  );
}
