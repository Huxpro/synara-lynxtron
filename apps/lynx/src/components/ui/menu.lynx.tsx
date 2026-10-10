import {
  useCallback,
  createContext,
  createPortal,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "@lynx-js/react";
import type { CSSProperties } from "@lynx-js/types";
import { getRectById, getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import { resolveCommandNavigation } from "../../logic/commandNavigation";

import { CheckIcon, ChevronRightIcon } from "../../lib/icons.lynx";
import { useTheme } from "../../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "./interactive-state.lynx";
import { focusLynxNode, type LynxFocusableRef } from "./focus.lynx";
import { cx, renderSlot, textContent } from "./shared.lynx";
import { sleepOnHost } from "../../platform/timer";
import "./primitives.css";

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
const MENU_ANCHOR_RETRY_COUNT = 4;
const MENU_ANCHOR_RETRY_DELAY_MS = 16;
let nextMenuTriggerId = 0;

interface MenuContextValue {
  anchorRect: MenuRect;
  popupOriginRef: { current: { x: number; y: number } | null };
  open: boolean;
  setAnchorRect: (rect: MenuRect) => void;
  setViewportRect: (rect: MenuRect) => void;
  viewportRect: MenuRect;
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
const EMPTY_POPUP_ORIGIN_REF = { current: null };

const MenuContext = createContext<MenuContextValue>({
  anchorRect: EMPTY_MENU_RECT,
  popupOriginRef: EMPTY_POPUP_ORIGIN_REF,
  open: false,
  setAnchorRect: () => {},
  setViewportRect: () => {},
  viewportRect: EMPTY_MENU_RECT,
  toggle: () => {},
  close: () => {},
  triggerRef: EMPTY_TRIGGER_REF,
  highlightedValue: null,
  handleKeyDown: () => false,
  registerItem: () => () => {},
  setHighlightedValue: () => {},
});

type MenuOverlayHostRef = { readonly current: NodesRef | null };
const MenuOverlayHostContext = createContext<MenuOverlayHostRef | null>(null);

export function MenuOverlayProvider(props: { children?: ReactNode }) {
  const hostRef = useRef<NodesRef>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (hostRef.current) setReady(true);
  }, []);
  return (
    <MenuOverlayHostContext.Provider value={ready ? hostRef : null}>
      <Fragment>
        {props.children}
        <view ref={hostRef} className="LxMenuOverlayHost" event-through={true} />
      </Fragment>
    </MenuOverlayHostContext.Provider>
  );
}

// @lynx-js/react types createPortal's result as Preact's VNode, which its own
// React-typed JSX does not accept as a component result. The value is a
// regular renderable vnode, so re-type it once here.
function renderMenuPortal(children: ReactNode, host: NodesRef): ReactNode {
  return createPortal(<Fragment>{children}</Fragment>, host) as ReactNode;
}

export function MenuOverlayPortal(props: { children?: ReactNode }) {
  const hostRef = useContext(MenuOverlayHostContext);
  return hostRef?.current ? renderMenuPortal(props.children, hostRef.current) : null;
}

export function Menu(props: {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  autoHighlightFirst?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false);
  const [anchorRect, setAnchorRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [viewportRect, setViewportRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [highlightedValue, setHighlightedValueState] = useState<string | null>(null);
  const triggerRef = useRef<NodesRef>(null);
  const popupOriginRef = useRef<{ x: number; y: number } | null>(null);
  const entriesRef = useRef<Map<string, MenuEntry>>(new Map());
  const open = props.open ?? uncontrolledOpen;
  const openRef = useRef(open);
  const highlightedValueRef = useRef<string | null>(null);
  openRef.current = open;
  highlightedValueRef.current = highlightedValue;
  const setOpen = useCallback(
    (next: boolean) => {
      "background only";
      if (props.open === undefined) setUncontrolledOpen(next);
      props.onOpenChange?.(next);
    },
    [props.onOpenChange, props.open],
  );
  const close = useCallback(() => {
    "background only";
    setOpen(false);
    focusLynxNode(triggerRef);
  }, [setOpen]);
  const highlightValue = useCallback((value: string) => {
    if (!entriesRef.current.has(value)) return;
    highlightedValueRef.current = value;
    setHighlightedValueState(value);
  }, []);
  const registerItem = useCallback(
    (value: string, entry: MenuEntry) => {
      entriesRef.current.set(value, entry);
      if (
        props.autoHighlightFirst !== false &&
        openRef.current &&
        highlightedValueRef.current === null
      ) {
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
    },
    [highlightValue, props.autoHighlightFirst],
  );
  const handleKeyDown = useCallback(
    (event: MenuKeyboardEvent): boolean => {
      const intent = resolveCommandNavigation({
        activeValue: highlightedValueRef.current,
        enabledValues: [...entriesRef.current.keys()],
        key: event.key,
        shiftKey: event.shiftKey,
      });
      if (intent.type === "none") return false;
      event.preventDefault?.();
      event.stopPropagation?.();
      if (intent.type === "move") highlightValue(intent.value);
      if (intent.type === "activate") entriesRef.current.get(intent.value)?.activate();
      if (intent.type === "dismiss") close();
      return true;
    },
    [close, highlightValue],
  );
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
        popupOriginRef,
        open,
        setAnchorRect,
        setViewportRect,
        viewportRect,
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

function handleMenuEscape(event: MenuKeyboardEvent, menu: MenuContextValue): boolean {
  "background only";
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

function hasMenuRectSize(rect: { readonly width?: number; readonly height?: number }): boolean {
  return Number(rect.width) > 0 && Number(rect.height) > 0;
}

async function resolveMenuTriggerRect(
  id: string,
  ref: LynxFocusableRef,
): Promise<{
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}> {
  const byId = await getRectById(id, true).catch(() => null);
  if (byId && hasMenuRectSize(byId)) return byId;
  return getRectByRef(ref, true);
}

/** Base UI's default `collisionPadding`. */
const MENU_COLLISION_PADDING = 5;

function clampMenuCoordinate(value: number, extent: number, limit: number): number {
  if (limit <= 0) return Math.max(0, value);
  return Math.max(0, Math.min(value, Math.max(0, limit - extent)));
}

export function resolveMenuCoordinates(input: {
  readonly align: "start" | "center" | "end";
  readonly anchor: MenuRect;
  readonly popup: MenuRect;
  readonly side: "top" | "bottom" | "left" | "right";
  readonly sideOffset: number;
  readonly viewport: MenuRect;
}): { readonly left: number; readonly top: number } {
  const { align, anchor, popup, side, sideOffset, viewport } = input;
  const anchorX = anchor.x - viewport.x;
  const anchorY = anchor.y - viewport.y;
  let left =
    align === "start"
      ? anchorX
      : align === "end"
        ? anchorX + anchor.width - popup.width
        : anchorX + (anchor.width - popup.width) / 2;
  let top =
    align === "start"
      ? anchorY
      : align === "end"
        ? anchorY + anchor.height - popup.height
        : anchorY + (anchor.height - popup.height) / 2;

  if (side === "top") top = anchorY - popup.height - sideOffset;
  if (side === "bottom") top = anchorY + anchor.height + sideOffset;
  if (side === "left") left = anchorX - popup.width - sideOffset;
  if (side === "right") left = anchorX + anchor.width + sideOffset;

  // Base UI's default collision avoidance flips the alignment before shifting: a start-
  // aligned popup that would cross the far edge opens end-aligned when that fits, and the
  // reverse. Only then does the clamp below shift it.
  if ((side === "top" || side === "bottom") && viewport.width > 0) {
    const fitsAt = (candidate: number) =>
      candidate >= MENU_COLLISION_PADDING &&
      candidate + popup.width <= viewport.width - MENU_COLLISION_PADDING;
    if (align === "start" && !fitsAt(left) && fitsAt(anchorX + anchor.width - popup.width)) {
      left = anchorX + anchor.width - popup.width;
    } else if (align === "end" && !fitsAt(left) && fitsAt(anchorX)) {
      left = anchorX;
    }
  }

  return {
    left: clampMenuCoordinate(left, popup.width, viewport.width),
    top: clampMenuCoordinate(top, popup.height, viewport.height),
  };
}

export function resolveSubmenuCoordinates(input: {
  readonly align?: "start" | "end";
  readonly anchor: MenuRect;
  readonly popup: MenuRect;
  readonly side?: "auto" | "left" | "right";
  readonly viewport: MenuRect;
  readonly sideOffset?: number;
  readonly viewportPadding?: number;
}): { readonly left: number; readonly top: number } {
  const sideOffset = input.sideOffset ?? 6;
  const padding = input.viewportPadding ?? 8;
  const viewportLeft = input.viewport.x + padding;
  const viewportRight = input.viewport.x + input.viewport.width - padding;
  const viewportTop = input.viewport.y + padding;
  const viewportBottom = input.viewport.y + input.viewport.height - padding;
  const preferredRight = input.anchor.x + input.anchor.width + sideOffset;
  const preferredLeft = input.anchor.x - input.popup.width - sideOffset;
  const fitsRight = preferredRight + input.popup.width <= viewportRight;
  const fitsLeft = preferredLeft >= viewportLeft;
  const useVerticalFallback = (input.side ?? "auto") === "auto" && !fitsRight && !fitsLeft;
  const absoluteLeft = useVerticalFallback
    ? clampMenuCoordinate(
        input.anchor.x - input.viewport.x,
        input.popup.width,
        input.viewport.width,
      ) + input.viewport.x
    : input.side === "left"
      ? Math.max(viewportLeft, preferredLeft)
      : input.side === "right"
        ? Math.min(preferredRight, viewportRight - input.popup.width)
        : fitsRight
          ? preferredRight
          : Math.max(viewportLeft, preferredLeft);
  const maximumTop = Math.max(viewportTop, viewportBottom - input.popup.height);
  const requestedTop = useVerticalFallback
    ? input.anchor.y + input.anchor.height
    : input.align === "end"
      ? input.anchor.y + input.anchor.height - input.popup.height
      : input.anchor.y;
  const absoluteTop = Math.max(viewportTop, Math.min(requestedTop, maximumTop));
  return {
    left: absoluteLeft - input.anchor.x,
    top: absoluteTop - input.anchor.y,
  };
}

export function menuPlacementRequiresPopupSize(input: {
  readonly align: "start" | "center" | "end";
  readonly side: "top" | "bottom" | "left" | "right";
}): boolean {
  return (
    input.side === "top" ||
    input.side === "left" ||
    (input.side === "bottom" && input.align !== "start") ||
    (input.side === "right" && input.align !== "start")
  );
}

export function MenuTrigger(props: {
  children?: ReactNode;
  render?: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onActivate?: () => void;
  passive?: boolean;
}) {
  const menu = useContext(MenuContext);
  const triggerIdRef = useRef<string | null>(null);
  if (triggerIdRef.current === null) {
    triggerIdRef.current = `synara-menu-trigger-${++nextMenuTriggerId}`;
  }
  const refreshAnchorRect = async (): Promise<boolean> => {
    "background only";
    try {
      const rect = await resolveMenuTriggerRect(triggerIdRef.current!, menu.triggerRef);
      const nextRect = {
        height: rect.height,
        width: rect.width,
        x: rect.left,
        y: rect.top,
      };
      if (!sameMenuRect(menu.anchorRect, nextRect)) {
        menu.setAnchorRect(nextRect);
      }
      return nextRect.width > 0 && nextRect.height > 0;
    } catch {
      // Component tests and older hosts may not expose selector invocation.
      // Keep the popup hidden rather than inventing screen coordinates.
      return false;
    }
  };
  const handleTap = () => {
    "background only";
    if (props.disabled) return;
    void refreshAnchorRect();
    if (props.onActivate) {
      props.onActivate();
      return;
    }
    menu.toggle();
  };
  useEffect(() => {
    if (!menu.open) return;
    if (menu.anchorRect.width > 0 && menu.anchorRect.height > 0) return;
    let cancelled = false;
    void (async () => {
      for (let attempt = 0; attempt < MENU_ANCHOR_RETRY_COUNT; attempt += 1) {
        if (cancelled || !menu.open) return;
        if (await refreshAnchorRect()) return;
        await sleepOnHost(MENU_ANCHOR_RETRY_DELAY_MS).catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [menu.anchorRect.height, menu.anchorRect.width, menu.open]);
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      "LxMenuTrigger",
      props.className,
      props.disabled && "LxMenuTrigger--disabled",
    ),
    accessibilityElement: props.passive ? false : undefined,
    accessibleLabel: props.passive ? undefined : props.ariaLabel,
    accessibilityValue: menu.open ? "Expanded" : "Collapsed",
    disabled: props.disabled,
    focusable: props.passive ? false : undefined,
    onActivate: props.passive ? undefined : handleTap,
  });
  const handleKeyDown = (event: MenuKeyboardEvent) => {
    "background only";
    if (handleMenuEscape(event, menu)) return;
    if (!props.passive) interaction.eventProps.bindkeydown?.(event);
  };
  const handleLayoutChange = (event: MenuLayoutEvent) => {
    "background only";
    // Lynx layout events report coordinates in the nearest layout context,
    // not stable viewport coordinates. Always resolve the trigger through the
    // global selector API so nested composer/menu roots cannot pin popups to 0,0.
    void event;
    void refreshAnchorRect();
  };
  return (
    <view
      id={triggerIdRef.current}
      ref={menu.triggerRef}
      flatten={false}
      className={interaction.className}
      {...interaction.eventProps}
      aria-label={props.ariaLabel}
      aria-haspopup="menu"
      aria-expanded={menu.open}
      catchkeydown={props.disabled || props.passive ? undefined : handleKeyDown}
      bindlayoutchange={handleLayoutChange}
    >
      {renderSlot(props.render, props.children)}
    </view>
  );
}

export function MenuPopupBase(props: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  const menu = useContext(MenuContext);
  const [popupRect, setPopupRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [viewportRect, setViewportRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  const [layerOrigin, setLayerOrigin] = useState<{ x: number; y: number } | null>(null);
  if (!menu.open) return null;
  const side = props.side ?? "bottom";
  const align = props.align ?? "center";
  const coordinates = resolveMenuCoordinates({
    align,
    anchor: menu.anchorRect,
    popup: popupRect,
    side,
    sideOffset: props.sideOffset ?? 4,
    viewport: layerOrigin ? { ...viewportRect, x: 0, y: 0 } : viewportRect,
  });
  const handleViewportLayout = (event: MenuLayoutEvent) => {
    "background only";
    const nextRect = menuRectFromLayout(event);
    if (layerOrigin === null) {
      setLayerOrigin({ x: nextRect.x, y: nextRect.y });
    }
    if (!sameMenuRect(viewportRect, nextRect)) setViewportRect(nextRect);
    if (!sameMenuRect(menu.viewportRect, nextRect)) menu.setViewportRect(nextRect);
  };
  const handlePopupLayout = (event: MenuLayoutEvent) => {
    "background only";
    const nextRect = menuRectFromLayout(event);
    if (!sameMenuRect(popupRect, nextRect)) setPopupRect(nextRect);
  };
  const anchorMeasured = menu.anchorRect.width > 0 && menu.anchorRect.height > 0;
  const popupMeasured = popupRect.width > 0 && popupRect.height > 0;
  const positioned =
    anchorMeasured && (!menuPlacementRequiresPopupSize({ align, side }) || popupMeasured);
  if (positioned) {
    menu.popupOriginRef.current = {
      x: coordinates.left + (layerOrigin?.x ?? 0),
      y: coordinates.top + (layerOrigin?.y ?? 0),
    };
  }
  return (
    <MenuPortal>
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
        <view className="LxMenuBackdrop" aria-hidden="true" catchtap={menu.close} />
        <view
          className={cx("LxMenuPopup", props.className)}
          aria-modal={false}
          role="menu"
          bindkeydown={(event: MenuKeyboardEvent) => {
            "background only";
            menu.handleKeyDown(event);
          }}
          bindlayoutchange={handlePopupLayout}
          style={{
            ...props.style,
            left: `${Math.round(coordinates.left)}px`,
            opacity: positioned ? 1 : 0,
            top: `${Math.round(coordinates.top)}px`,
          }}
        >
          {props.children}
        </view>
      </view>
    </MenuPortal>
  );
}

export const MenuPopup = MenuPopupBase;
export function MenuPortal(props: { children?: ReactNode }) {
  const hostRef = useContext(MenuOverlayHostContext);
  return hostRef?.current ? (
    renderMenuPortal(props.children, hostRef.current)
  ) : (
    <Fragment>{props.children}</Fragment>
  );
}

export function MenuItem(props: {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  inset?: boolean;
  closeOnClick?: boolean;
  selectionRole?: "radio" | "checkbox" | "switch";
  selected?: boolean;
  variant?: "default" | "destructive";
}) {
  const menu = useContext(MenuContext);
  const valueRef = useRef<string | null>(null);
  if (valueRef.current === null) {
    valueRef.current = `menu-item-${++nextMenuItemId}`;
  }
  const handleClick = () => {
    "background only";
    if (props.disabled) return;
    props.onClick?.();
    if (props.closeOnClick ?? true) menu.close();
  };
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      "LxButton",
      "LxButton--ghost",
      "LxButton--default",
      "LxMenuItem",
      props.variant === "destructive" && "LxMenuItem--destructive",
      props.inset && "LxMenuItem--inset",
      props.className,
      menu.highlightedValue === valueRef.current && "LxMenuItem--highlighted",
      props.disabled && "LxMenuItem--disabled",
    ),
    disabled: props.disabled,
    accessibilityValue:
      props.selected === undefined ? undefined : props.selected ? "Selected" : "Not selected",
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
    "background only";
    if (handleMenuEscape(event, menu)) return;
    interaction.eventProps.bindkeydown?.(event);
  };
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
      aria-disabled={props.disabled}
      aria-checked={props.selected}
      role={
        props.selectionRole === "radio"
          ? "menuitemradio"
          : props.selectionRole
            ? "menuitemcheckbox"
            : "menuitem"
      }
      accessibility-role={props.selectionRole}
      accessibility-state={
        props.selected === undefined
          ? undefined
          : props.selectionRole === "radio"
            ? { selected: props.selected }
            : { checked: props.selected }
      }
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
        {textContent(props.children, "LxMenuItem__text")}
        {props.trailing ? <view className="LxMenuItem__trailing">{props.trailing}</view> : null}
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
      selectionRole="radio"
      selected={checked}
      trailing={checked ? <CheckIcon className="LxMenuIndicatorIcon" /> : undefined}
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
  variant?: "default" | "switch";
}) {
  const switchIndicator =
    props.variant === "switch" ? (
      <view
        className={cx("LxMenuSwitch", props.checked && "LxMenuSwitch--checked")}
        aria-hidden="true"
      >
        <view className="LxMenuSwitch__thumb" />
      </view>
    ) : (
      <view className="LxMenuIndicator">
        {props.checked ? <CheckIcon className="LxMenuIndicatorIcon" /> : null}
      </view>
    );
  return (
    <MenuItem
      className={cx(props.className, props.variant === "switch" && "LxMenuItem--switch")}
      closeOnClick={false}
      disabled={props.disabled}
      selectionRole={props.variant === "switch" ? "switch" : "checkbox"}
      selected={props.checked}
      trailing={switchIndicator}
      onClick={() => props.onCheckedChange?.(!props.checked)}
    >
      {props.children}
    </MenuItem>
  );
}

export function MenuSeparator(props: { className?: string }) {
  return <view className={cx("LxMenuSeparator", props.className)} />;
}

export function MenuGroup(props: { children?: ReactNode; className?: string }) {
  return <view className={cx("LxMenuGroup", props.className)}>{props.children}</view>;
}

export function MenuGroupLabel(props: { children?: ReactNode; className?: string }) {
  return <>{textContent(props.children, cx("LxMenuGroupLabel", props.className))}</>;
}

export function MenuShortcut(props: { children?: ReactNode; className?: string }) {
  return <>{textContent(props.children, cx("LxMenuShortcut", props.className))}</>;
}

interface MenuSubContextValue {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly triggerRect: MenuRect;
  readonly setTriggerRect: (rect: MenuRect) => void;
}

const MenuSubContext = createContext<MenuSubContextValue>({
  open: false,
  setOpen: () => {},
  triggerRect: EMPTY_MENU_RECT,
  setTriggerRect: () => {},
});

export function MenuSub(props: {
  children?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const menu = useContext(MenuContext);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false);
  const open = props.open ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      "background only";
      if (props.open === undefined) setUncontrolledOpen(next);
      props.onOpenChange?.(next);
    },
    [props.onOpenChange, props.open],
  );
  const [triggerRect, setTriggerRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  useEffect(() => {
    if (!menu.open) setOpen(false);
  }, [menu.open]);
  return (
    <MenuSubContext.Provider value={{ open, setOpen, triggerRect, setTriggerRect }}>
      <view className="LxMenuSubRoot">{props.children}</view>
    </MenuSubContext.Provider>
  );
}

export function MenuSubTrigger(props: {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onOpen?: () => void;
}) {
  const { svgColors } = useTheme();
  const menu = useContext(MenuContext);
  const submenu = useContext(MenuSubContext);
  const triggerRef = useRef<NodesRef>(null);
  const triggerIdRef = useRef<string | null>(null);
  if (triggerIdRef.current === null) {
    triggerIdRef.current = `synara-menu-sub-trigger-${++nextMenuTriggerId}`;
  }
  const valueRef = useRef<string | null>(null);
  if (valueRef.current === null) {
    valueRef.current = `menu-sub-trigger-${++nextMenuItemId}`;
  }
  const activate = () => {
    "background only";
    if (props.disabled) return;
    if (!submenu.open) props.onOpen?.();
    submenu.setOpen(!submenu.open);
  };
  const refreshTriggerRect = () => {
    "background only";
    void resolveMenuTriggerRect(triggerIdRef.current!, triggerRef)
      .then((rect) => {
        const parentOrigin = menu.popupOriginRef.current;
        const normalizedLeft =
          parentOrigin && rect.left < parentOrigin.x ? parentOrigin.x + rect.left : rect.left;
        const normalizedTop =
          parentOrigin && rect.top < parentOrigin.y ? parentOrigin.y + rect.top : rect.top;
        const nextRect = {
          height: rect.height,
          width: rect.width,
          x: normalizedLeft,
          y: normalizedTop,
        };
        if (!sameMenuRect(submenu.triggerRect, nextRect)) {
          submenu.setTriggerRect(nextRect);
        }
      })
      .catch(() => undefined);
  };
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      "LxButton",
      "LxButton--ghost",
      "LxButton--default",
      "LxMenuItem",
      "LxMenuSubTrigger",
      props.className,
      menu.highlightedValue === valueRef.current && "LxMenuItem--highlighted",
    ),
    disabled: props.disabled,
    onIntent: () => {
      refreshTriggerRect();
      if (!submenu.open) props.onOpen?.();
      submenu.setOpen(true);
    },
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
  const handleSubmenuKeyDown = (event: MenuKeyboardEvent) => {
    "background only";
    if (event.key === "ArrowRight") {
      event.preventDefault?.();
      event.stopPropagation?.();
      submenu.setOpen(true);
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "Escape") && submenu.open) {
      event.preventDefault?.();
      event.stopPropagation?.();
      submenu.setOpen(false);
      return;
    }
    if (event.key === "Escape") {
      menu.handleKeyDown(event);
      return;
    }
    interaction.eventProps.bindkeydown?.(event);
  };
  return (
    <view
      id={triggerIdRef.current}
      ref={triggerRef}
      flatten={false}
      className={interaction.className}
      {...interaction.eventProps}
      bindkeydown={undefined}
      aria-expanded={submenu.open}
      aria-haspopup="menu"
      role="menuitem"
      catchkeydown={handleSubmenuKeyDown}
      bindlayoutchange={(event: MenuLayoutEvent) => {
        void event;
        refreshTriggerRect();
      }}
    >
      <view className="LxMenuItem__row">
        {textContent(props.children, "LxMenuItem__text")}
        <ChevronRightIcon
          className="LxMenuSubTrigger__chevron"
          color={svgColors.foreground80}
          size={14}
        />
      </view>
    </view>
  );
}

export function MenuSubPopup(props: {
  children?: ReactNode;
  className?: string;
  align?: "start" | "end";
  side?: "auto" | "left" | "right";
  portaled?: boolean;
}) {
  const submenu = useContext(MenuSubContext);
  const menu = useContext(MenuContext);
  const [popupRect, setPopupRect] = useState<MenuRect>(EMPTY_MENU_RECT);
  if (!submenu.open) return null;
  const measured =
    submenu.triggerRect.width > 0 &&
    submenu.triggerRect.height > 0 &&
    popupRect.width > 0 &&
    popupRect.height > 0 &&
    menu.viewportRect.width > 0 &&
    menu.viewportRect.height > 0;
  const coordinates = measured
    ? resolveSubmenuCoordinates({
        align: props.align,
        anchor: submenu.triggerRect,
        popup: popupRect,
        side: props.side,
        viewport: menu.viewportRect,
      })
    : { left: 0, top: 0 };
  const popup = (
    <view
      className={cx(
        "LxMenuPopup",
        "LxMenuSubPopup",
        props.align === "end" && "LxMenuSubPopup--align-end",
        props.className,
      )}
      role="menu"
      catchtap={(event: { stopPropagation?: () => void }) => event.stopPropagation?.()}
      bindlayoutchange={(event: MenuLayoutEvent) => {
        const nextRect = menuRectFromLayout(event);
        if (!sameMenuRect(popupRect, nextRect)) setPopupRect(nextRect);
      }}
      style={{
        left: `${Math.round(
          props.portaled ? submenu.triggerRect.x + coordinates.left : coordinates.left,
        )}px`,
        opacity: measured ? 1 : 0,
        top: `${Math.round(
          props.portaled ? submenu.triggerRect.y + coordinates.top : coordinates.top,
        )}px`,
        ...(props.align === "end" ? { bottom: "auto" } : {}),
      }}
    >
      {props.children}
    </view>
  );
  return props.portaled ? (
    <MenuPortal>
      <view className="LxMenuSubLayer" catchtap={menu.close}>
        {popup}
      </view>
    </MenuPortal>
  ) : (
    popup
  );
}
export const MenuCreateHandle = undefined;
