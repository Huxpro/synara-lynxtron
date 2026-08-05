import {
  useCallback,
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from '@lynx-js/react';
import { getRectByRef } from '@lynx-js/lynx-ui';
import type { NodesRef } from '@lynx-js/types';
import { resolveCommandNavigation } from '@synara/shared/commandNavigation';

import { CheckIcon } from '../../lib/icons.lynx';
import { useLynxInteractiveState } from './interactive-state.lynx';
import { focusLynxNode, type LynxFocusableRef } from './focus.lynx';
import { cx, renderSlot, textContent } from './shared.lynx';
import './primitives.css';

interface MenuRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

const EMPTY_MENU_RECT: MenuRect = {
  height: 0,
  width: 0,
  x: 0,
  y: 0,
};

interface MenuContextValue {
  anchorRect: MenuRect;
  open: boolean;
  setAnchorRect: (rect: MenuRect) => void;
  toggle: () => void;
  close: () => void;
  triggerRef: LynxFocusableRef;
  highlightedValue: string | null;
  handleKeyDown: (event: MenuKeyboardEvent) => boolean;
  registerItem: (value: string, entry: MenuEntry) => () => void;
  setHighlightedValue: (value: string) => void;
}

interface MenuEntry {
  readonly activate: () => void;
}

const EMPTY_TRIGGER_REF: LynxFocusableRef = { current: null };

const MenuContext = createContext<MenuContextValue>({
  anchorRect: EMPTY_MENU_RECT,
  open: false,
  setAnchorRect: () => {},
  toggle: () => {},
  close: () => {},
  triggerRef: EMPTY_TRIGGER_REF,
  highlightedValue: null,
  handleKeyDown: () => false,
  registerItem: () => () => {},
  setHighlightedValue: () => {},
});

export function Menu(props: {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false);
  const [anchorRect, setAnchorRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [highlightedValue, setHighlightedValueState] = useState<string | null>(null);
  const triggerRef = useRef<NodesRef>(null);
  const entriesRef = useRef<Map<string, MenuEntry>>(new Map());
  const open = props.open ?? uncontrolledOpen;
  const openRef = useRef(open);
  const highlightedValueRef = useRef<string | null>(null);
  openRef.current = open;
  highlightedValueRef.current = highlightedValue;
  const setOpen = useCallback((next: boolean) => {
    'background only';
    if (props.open === undefined) setUncontrolledOpen(next);
    props.onOpenChange?.(next);
  }, [props.onOpenChange, props.open]);
  const close = useCallback(() => {
    'background only';
    setOpen(false);
    focusLynxNode(triggerRef);
  }, [setOpen]);
  const highlightValue = useCallback((value: string) => {
    if (!entriesRef.current.has(value)) return;
    highlightedValueRef.current = value;
    setHighlightedValueState(value);
  }, []);
  const registerItem = useCallback((value: string, entry: MenuEntry) => {
    entriesRef.current.set(value, entry);
    if (openRef.current && highlightedValueRef.current === null) {
      highlightValue(value);
    }
    return () => {
      entriesRef.current.delete(value);
      setHighlightedValueState((current) => {
        if (current !== value) return current;
        highlightedValueRef.current = null;
        return null;
      });
    };
  }, [highlightValue]);
  const handleKeyDown = useCallback((event: MenuKeyboardEvent): boolean => {
    const intent = resolveCommandNavigation({
      activeValue: highlightedValueRef.current,
      enabledValues: [...entriesRef.current.keys()],
      key: event.key,
      shiftKey: event.shiftKey,
    });
    if (intent.type === 'none') return false;
    event.preventDefault?.();
    event.stopPropagation?.();
    if (intent.type === 'move') highlightValue(intent.value);
    if (intent.type === 'activate') entriesRef.current.get(intent.value)?.activate();
    if (intent.type === 'dismiss') close();
    return true;
  }, [close, highlightValue]);
  useEffect(() => {
    if (!open) {
      highlightedValueRef.current = null;
      setHighlightedValueState(null);
    }
  }, [open]);
  return (
    <MenuContext.Provider
      value={{
        anchorRect,
        open,
        setAnchorRect,
        toggle: () => setOpen(!open),
        close,
        triggerRef,
        highlightedValue,
        handleKeyDown,
        registerItem,
        setHighlightedValue: highlightValue,
      }}
    >
      <view className="LxMenuRoot">{props.children}</view>
    </MenuContext.Provider>
  );
}

interface MenuKeyboardEvent {
  readonly key: string;
  readonly shiftKey?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

function handleMenuEscape(
  event: MenuKeyboardEvent,
  menu: MenuContextValue
): boolean {
  'background only';
  return menu.open && menu.handleKeyDown(event);
}

interface MenuLayoutEvent {
  readonly detail?: {
    readonly height?: number;
    readonly left?: number;
    readonly top?: number;
    readonly width?: number;
  };
  readonly params?: {
    readonly height?: number;
    readonly left?: number;
    readonly top?: number;
    readonly width?: number;
  };
}

function menuRectFromLayout(event: MenuLayoutEvent): MenuRect {
  const detail = event.detail ?? event.params ?? {};
  return {
    height: detail.height ?? 0,
    width: detail.width ?? 0,
    x: detail.left ?? 0,
    y: detail.top ?? 0,
  };
}

function sameMenuRect(left: MenuRect, right: MenuRect): boolean {
  return (
    left.height === right.height &&
    left.width === right.width &&
    left.x === right.x &&
    left.y === right.y
  );
}

function clampMenuCoordinate(value: number, extent: number, limit: number): number {
  if (limit <= 0) return Math.max(0, value);
  return Math.max(0, Math.min(value, Math.max(0, limit - extent)));
}

export function resolveMenuCoordinates(input: {
  readonly align: 'start' | 'center' | 'end';
  readonly anchor: MenuRect;
  readonly popup: MenuRect;
  readonly side: 'top' | 'bottom' | 'left' | 'right';
  readonly sideOffset: number;
  readonly viewport: MenuRect;
}): { readonly left: number; readonly top: number } {
  const { align, anchor, popup, side, sideOffset, viewport } = input;
  const anchorX = anchor.x - viewport.x;
  const anchorY = anchor.y - viewport.y;
  let left =
    align === 'start'
      ? anchorX
      : align === 'end'
        ? anchorX + anchor.width - popup.width
        : anchorX + (anchor.width - popup.width) / 2;
  let top =
    align === 'start'
      ? anchorY
      : align === 'end'
        ? anchorY + anchor.height - popup.height
        : anchorY + (anchor.height - popup.height) / 2;

  if (side === 'top') top = anchorY - popup.height - sideOffset;
  if (side === 'bottom') top = anchorY + anchor.height + sideOffset;
  if (side === 'left') left = anchorX - popup.width - sideOffset;
  if (side === 'right') left = anchorX + anchor.width + sideOffset;

  return {
    left: clampMenuCoordinate(left, popup.width, viewport.width),
    top: clampMenuCoordinate(top, popup.height, viewport.height),
  };
}

export function MenuTrigger(props: {
  children?: ReactNode;
  render?: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onActivate?: () => void;
}) {
  const menu = useContext(MenuContext);
  const refreshAnchorRect = async () => {
    'background only';
    try {
      const rect = await getRectByRef(menu.triggerRef, true);
      const nextRect = {
        height: rect.height,
        width: rect.width,
        x: rect.left,
        y: rect.top,
      };
      if (!sameMenuRect(menu.anchorRect, nextRect)) {
        menu.setAnchorRect(nextRect);
      }
    } catch {
      // Component tests and older hosts may not expose selector invocation.
      // Keep the popup hidden rather than inventing screen coordinates.
    }
  };
  const handleTap = () => {
    'background only';
    if (props.disabled) return;
    void refreshAnchorRect();
    if (props.onActivate) {
      props.onActivate();
      return;
    }
    menu.toggle();
  };
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      'LxMenuTrigger',
      props.className,
      props.disabled && 'LxMenuTrigger--disabled'
    ),
    disabled: props.disabled,
    onActivate: handleTap,
  });
  const handleKeyDown = (event: MenuKeyboardEvent) => {
    'background only';
    if (handleMenuEscape(event, menu)) return;
    interaction.eventProps.bindkeydown?.(event);
  };
  const handleLayoutChange = () => {
    'background only';
    void refreshAnchorRect();
  };
  return (
    <view
      ref={menu.triggerRef}
      className={interaction.className}
      {...interaction.eventProps}
      aria-label={props.ariaLabel}
      aria-haspopup="menu"
      aria-expanded={menu.open}
      catchkeydown={props.disabled ? undefined : handleKeyDown}
      bindlayoutchange={handleLayoutChange}
    >
      {renderSlot(props.render, props.children)}
    </view>
  );
}

export function MenuPopupBase(props: {
  children?: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}) {
  const menu = useContext(MenuContext);
  const [popupRect, setPopupRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [viewportRect, setViewportRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [layerOrigin, setLayerOrigin] = useState<{ x: number; y: number } | null>(null);
  if (!menu.open) return null;
  const side = props.side ?? 'bottom';
  const align = props.align ?? 'center';
  const coordinates = resolveMenuCoordinates({
    align,
    anchor: menu.anchorRect,
    popup: popupRect,
    side,
    sideOffset: props.sideOffset ?? 4,
    viewport: layerOrigin
      ? { ...viewportRect, x: 0, y: 0 }
      : viewportRect,
  });
  const handleViewportLayout = (event: MenuLayoutEvent) => {
    'background only';
    const nextRect = menuRectFromLayout(event);
    if (layerOrigin === null) {
      setLayerOrigin({ x: nextRect.x, y: nextRect.y });
    }
    if (!sameMenuRect(viewportRect, nextRect)) setViewportRect(nextRect);
  };
  const handlePopupLayout = (event: MenuLayoutEvent) => {
    'background only';
    const nextRect = menuRectFromLayout(event);
    if (!sameMenuRect(popupRect, nextRect)) setPopupRect(nextRect);
  };
  const positioned =
    menu.anchorRect.width > 0 &&
    menu.anchorRect.height > 0 &&
    popupRect.width > 0 &&
    popupRect.height > 0;
  return (
    <view
      className="LxMenuLayer"
      bindlayoutchange={handleViewportLayout}
      event-through={false}
      style={
        layerOrigin
          ? {
              left: `${-Math.round(layerOrigin.x)}px`,
              top: `${-Math.round(layerOrigin.y)}px`,
            }
          : undefined
      }
    >
      <view
        className="LxMenuBackdrop"
        aria-hidden="true"
        catchtap={menu.close}
      />
      <view
        className={cx('LxMenuPopup', props.className)}
        aria-modal={false}
        role="menu"
        bindkeydown={(event: MenuKeyboardEvent) => {
          'background only';
          menu.handleKeyDown(event);
        }}
        bindlayoutchange={handlePopupLayout}
        style={{
          left: `${Math.round(coordinates.left)}px`,
          top: `${Math.round(coordinates.top)}px`,
          visibility: positioned ? 'visible' : 'hidden',
        }}
      >
        {props.children}
      </view>
    </view>
  );
}

export const MenuPopup = MenuPopupBase;
export function MenuPortal(props: { children?: ReactNode }) {
  return <Fragment>{props.children}</Fragment>;
}

export function MenuItem(props: {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  inset?: boolean;
  closeOnClick?: boolean;
}) {
  const menu = useContext(MenuContext);
  const valueRef = useRef<string | null>(null);
  if (valueRef.current === null) {
    valueRef.current = `menu-item-${++nextMenuItemId}`;
  }
  const handleClick = () => {
    'background only';
    if (props.disabled) return;
    props.onClick?.();
    if (props.closeOnClick ?? true) menu.close();
  };
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      'LxButton',
      'LxButton--ghost',
      'LxButton--default',
      'LxMenuItem',
      props.inset && 'LxMenuItem--inset',
      props.className,
      menu.highlightedValue === valueRef.current && 'LxMenuItem--highlighted',
      props.disabled && 'LxMenuItem--disabled'
    ),
    disabled: props.disabled,
    onActivate: handleClick,
  });
  const activateRef = useRef(handleClick);
  activateRef.current = handleClick;
  const activatable = Boolean(props.onClick);
  useEffect(() => {
    if (props.disabled || !activatable) return;
    return menu.registerItem(valueRef.current!, {
      activate: () => activateRef.current(),
    });
  }, [activatable, menu.registerItem, props.disabled]);
  const handleKeyDown = (event: MenuKeyboardEvent) => {
    'background only';
    if (handleMenuEscape(event, menu)) return;
    interaction.eventProps.bindkeydown?.(event);
  };
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
      aria-disabled={props.disabled}
      role="menuitem"
      bindfocus={
        props.disabled
          ? undefined
          : () => {
              interaction.eventProps.bindfocus?.();
              menu.setHighlightedValue(valueRef.current!);
            }
      }
      catchkeydown={props.disabled ? undefined : handleKeyDown}
    >
      <view className="LxMenuItem__row">
        {textContent(props.children, 'LxMenuItem__text')}
        {props.trailing}
      </view>
    </view>
  );
}

let nextMenuItemId = 0;

interface SelectionContextValue {
  value?: string;
  choose?: (value: string) => void;
}

const SelectionContext = createContext<SelectionContextValue>({});

export function MenuRadioGroup(props: {
  children?: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <SelectionContext.Provider value={{ value: props.value, choose: props.onValueChange }}>
      <view className="LxMenuGroup">{props.children}</view>
    </SelectionContext.Provider>
  );
}

export function MenuRadioItem(props: {
  children?: ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}) {
  const selection = useContext(SelectionContext);
  const checked = selection.value === props.value;
  return (
    <MenuItem
      className={props.className}
      disabled={props.disabled}
      trailing={
        checked ? <CheckIcon className="LxMenuIndicatorIcon" /> : undefined
      }
      onClick={() => selection.choose?.(props.value)}
    >
      {props.children}
    </MenuItem>
  );
}

export function MenuCheckboxItem(props: {
  children?: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'switch';
}) {
  const switchIndicator =
    props.variant === 'switch' ? (
      <view
        className={cx(
          'LxMenuSwitch',
          props.checked && 'LxMenuSwitch--checked'
        )}
        aria-hidden="true"
      >
        <view className="LxMenuSwitch__thumb" />
      </view>
    ) : (
      <text className="LxMenuIndicator">{props.checked ? '✓' : ''}</text>
    );
  return (
    <MenuItem
      className={cx(
        props.className,
        props.variant === 'switch' && 'LxMenuItem--switch'
      )}
      closeOnClick={false}
      disabled={props.disabled}
      trailing={switchIndicator}
      onClick={() => props.onCheckedChange?.(!props.checked)}
    >
      {props.children}
    </MenuItem>
  );
}

export function MenuSeparator(props: { className?: string }) {
  return <view className={cx('LxMenuSeparator', props.className)} />;
}

export function MenuGroup(props: { children?: ReactNode; className?: string }) {
  return <view className={cx('LxMenuGroup', props.className)}>{props.children}</view>;
}

export function MenuGroupLabel(props: { children?: ReactNode; className?: string }) {
  return <>{textContent(props.children, cx('LxMenuGroupLabel', props.className))}</>;
}

export function MenuShortcut(props: { children?: ReactNode; className?: string }) {
  return <>{textContent(props.children, cx('LxMenuShortcut', props.className))}</>;
}

interface MenuSubContextValue {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

const MenuSubContext = createContext<MenuSubContextValue>({
  open: false,
  setOpen: () => {},
});

export function MenuSub(props: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuSubContext.Provider value={{ open, setOpen }}>
      <view className="LxMenuSubRoot">{props.children}</view>
    </MenuSubContext.Provider>
  );
}

export function MenuSubTrigger(props: {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const menu = useContext(MenuContext);
  const submenu = useContext(MenuSubContext);
  const valueRef = useRef<string | null>(null);
  if (valueRef.current === null) {
    valueRef.current = `menu-sub-trigger-${++nextMenuItemId}`;
  }
  const activate = () => {
    'background only';
    if (props.disabled) return;
    submenu.setOpen(!submenu.open);
  };
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      'LxButton',
      'LxButton--ghost',
      'LxButton--default',
      'LxMenuItem',
      'LxMenuSubTrigger',
      props.className,
      menu.highlightedValue === valueRef.current &&
        'LxMenuItem--highlighted'
    ),
    disabled: props.disabled,
    onActivate: activate,
  });
  const activateRef = useRef(activate);
  activateRef.current = activate;
  useEffect(() => {
    if (props.disabled) return;
    return menu.registerItem(valueRef.current!, {
      activate: () => activateRef.current(),
    });
  }, [menu.registerItem, props.disabled]);
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
      aria-expanded={submenu.open}
      aria-haspopup="menu"
      role="menuitem"
    >
      <view className="LxMenuItem__row">
        {textContent(props.children, 'LxMenuItem__text')}
        <text className="LxMenuSubTrigger__chevron">›</text>
      </view>
    </view>
  );
}

export function MenuSubPopup(props: {
  children?: ReactNode;
  className?: string;
}) {
  const submenu = useContext(MenuSubContext);
  if (!submenu.open) return null;
  return (
    <view
      className={cx('LxMenuPopup', 'LxMenuSubPopup', props.className)}
      role="menu"
    >
      {props.children}
    </view>
  );
}
export const MenuCreateHandle = undefined;
