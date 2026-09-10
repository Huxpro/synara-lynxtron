import { useRef } from '@lynx-js/react';
import { getRectByRef } from '@lynx-js/lynx-ui';
import type { NodesRef } from '@lynx-js/types';
import type { OrchestrationSpaceShell, SpaceId } from '@synara/contracts';
import type { SpaceActivityTone } from '@synara/shared/spaceActivity';

import { LynxSpaceIcon } from '../../adapters/ComposerProjectPickerCompositionElements.lynx';
import { useLynxInteractiveState } from '../ui/interactive-state.lynx';
import { resolveSecondaryPointerOffset } from './threadContextActions.logic';
import { focusLynxNode } from '../ui/focus.lynx';
import { PlusIcon } from '../../lib/icons.lynx';

export interface NativeSpaceOption {
  readonly id: SpaceId | null;
  readonly icon: OrchestrationSpaceShell['icon'] | 'black-hole';
  readonly name: string;
}

export function buildNativeSpaceOptions(
  spaces: readonly OrchestrationSpaceShell[]
): readonly NativeSpaceOption[] {
  return [
    { id: null, icon: 'black-hole', name: 'Void' },
    ...spaces.map((space) => ({
      id: space.id,
      icon: space.icon,
      name: space.name,
    })),
  ];
}

function SpaceTab(props: {
  readonly active: boolean;
  readonly option: NativeSpaceOption;
  readonly activityTone?: SpaceActivityTone | null;
  readonly onContextMenu?: (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void
  ) => void;
  readonly onSelect: () => void;
}) {
  const tabRef = useRef<NodesRef>(null);
  const interaction = useLynxInteractiveState({
    baseClassName: `AppSidebarSpaceTab${
      props.active ? ' AppSidebarSpaceTab--active' : ''
    }`,
    accessibleLabel: [
      props.option.name,
      props.active ? 'Active' : null,
      props.activityTone === 'attention'
        ? 'Needs attention'
        : props.activityTone === 'running'
          ? 'Working'
          : props.activityTone === 'completed'
            ? 'Done'
            : null,
    ].filter(Boolean).join(' · '),
    accessibilityTraits: props.active ? 'selected' : 'button',
    onActivate: props.onSelect,
  });
  return (
    <view
      ref={tabRef}
      className={interaction.className}
      {...interaction.eventProps}
      bindmousedown={(event: { readonly button?: number; readonly buttons?: number; readonly x?: number; readonly y?: number }) => {
        interaction.eventProps.bindmousedown?.();
        const offset = resolveSecondaryPointerOffset(event);
        if (!offset || !props.onContextMenu) return;
        void getRectByRef(tabRef, true).then((rect) =>
          props.onContextMenu?.(
            { x: rect.left + offset.x, y: rect.top + offset.y },
            () => focusLynxNode(tabRef)
          )
        );
      }}
      bindlongpress={(event: { readonly x?: number; readonly y?: number }) => {
        if (!props.onContextMenu) return;
        void getRectByRef(tabRef, true).then((rect) =>
          props.onContextMenu?.(
            {
              x: rect.left + (event.x ?? rect.width / 2),
              y: rect.top + (event.y ?? rect.height / 2),
            },
            () => focusLynxNode(tabRef)
          )
        );
      }}
    >
      <LynxSpaceIcon
        className="AppSidebarSpaceTabIcon"
        icon={props.option.icon}
        size={14}
      />
      {props.activityTone ? (
        <view
          className={`AppSidebarSpaceActivityDot AppSidebarSpaceActivityDot--${props.activityTone}`}
        />
      ) : null}
    </view>
  );
}

function CreateSpaceButton(props: { readonly onCreate: () => void }) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'AppSidebarSpaceTab AppSidebarSpaceCreate',
    accessibleLabel: 'New space',
    onActivate: props.onCreate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <PlusIcon className="AppSidebarSpaceTabIcon" size={14} />
    </view>
  );
}

export function SpaceSwitcherLynx(props: {
  readonly activeSpaceId: SpaceId | null;
  readonly activityBySpaceId: ReadonlyMap<string | null, SpaceActivityTone>;
  readonly spaces: readonly OrchestrationSpaceShell[];
  readonly onContextMenu: (
    space: OrchestrationSpaceShell,
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void
  ) => void;
  readonly onSelect: (spaceId: SpaceId | null) => void;
  readonly onCreate: () => void;
}) {
  if (props.spaces.length === 0) return null;
  const options = buildNativeSpaceOptions(props.spaces);
  const activeName =
    options.find((option) => option.id === props.activeSpaceId)?.name ?? 'Void';
  return (
    <view className="AppSidebarSpaces">
      <text className="AppSidebarSpacesLabel">{activeName}</text>
      <scroll-view
        aria-label="Spaces"
        className="AppSidebarSpaceTabs"
        scroll-orientation="horizontal"
        accessibility-element
        accessibility-trait="tabbar"
      >
        {options.map((option) => (
          <SpaceTab
            key={option.id ?? 'void'}
            active={option.id === props.activeSpaceId}
            activityTone={props.activityBySpaceId.get(option.id) ?? null}
            option={option}
            onContextMenu={
              option.id === null
                ? undefined
                : (position, restoreFocus) => {
                    const space = props.spaces.find(
                      (candidate) => candidate.id === option.id
                    );
                    if (space) props.onContextMenu(space, position, restoreFocus);
                  }
            }
            onSelect={() => props.onSelect(option.id)}
          />
        ))}
      </scroll-view>
      <CreateSpaceButton onCreate={props.onCreate} />
    </view>
  );
}
