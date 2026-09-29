import { useState } from "@lynx-js/react";
import { useLynxInteractionDisabled } from "./interaction-scope.lynx";
import { consumeProgrammaticLynxFocus } from "./focus.lynx";

export interface LynxInteractiveState {
  readonly focused: boolean;
  readonly hovered: boolean;
  readonly pressed: boolean;
}

export type LynxAccessibilityTrait =
  | "text"
  | "image"
  | "button"
  | "link"
  | "header"
  | "search"
  | "selected"
  | "playable"
  | "keyboard"
  | "summary"
  | "disabled"
  | "updating"
  | "adjustable"
  | "tabbar"
  | "none";

export interface LynxInteractiveAccessibilityOptions {
  readonly accessibilityElement?: boolean;
  readonly accessibilityTraits?: LynxAccessibilityTrait;
  readonly accessibilityValue?: string;
  readonly accessibleLabel?: string;
  readonly onActivate?: (() => void) | undefined;
  readonly onIntent?: (() => void) | undefined;
}

export function lynxInteractiveAccessibilityProps(options: LynxInteractiveAccessibilityOptions) {
  const hasAccessibleLabel = Boolean(options.accessibleLabel?.trim());
  const actionable = options.onActivate !== undefined;
  const accessibilityElement =
    options.accessibilityElement ?? (hasAccessibleLabel || actionable ? true : undefined);
  return {
    "accessibility-element": accessibilityElement,
    "accessibility-label": options.accessibleLabel,
    "accessibility-trait":
      options.accessibilityTraits ?? (accessibilityElement ? "button" : undefined),
    "accessibility-value": options.accessibilityValue,
  } as const;
}

export function isLynxActivationKey(key: string): boolean {
  return key === "Enter" || key === " " || key === "Space" || key === "Spacebar";
}

export function handleLynxActivationKey(
  event: { key: string; preventDefault?: () => void },
  onActivate: () => void,
): boolean {
  if (!isLynxActivationKey(event.key)) return false;
  event.preventDefault?.();
  onActivate();
  return true;
}

export function lynxInteractiveClassName(
  baseClassName: string,
  state: LynxInteractiveState,
): string {
  return `${baseClassName}${state.hovered ? " ui-hover" : ""}${
    state.focused ? " ui-focus" : ""
  }${state.pressed ? " ui-pressed" : ""}`;
}

export function lynxNestedInteractiveEventProps(
  eventProps: ReturnType<typeof useLynxInteractiveState>["eventProps"],
) {
  const {
    bindmousedown,
    bindmouseup,
    bindtouchstart,
    bindtouchend,
    bindtouchcancel,
    bindtap,
    ...nonPointerEventProps
  } = eventProps;
  return {
    ...nonPointerEventProps,
    catchmousedown: bindmousedown,
    catchmouseup: bindmouseup,
    catchtouchstart: bindtouchstart,
    catchtouchend: bindtouchend,
    catchtouchcancel: bindtouchcancel,
    catchtap: bindtap,
  };
}

export function useLynxInteractiveState(
  options: {
    readonly baseClassName: string;
    readonly disabled?: boolean;
    readonly focusable?: boolean;
    readonly programmaticFocusId?: string;
  } & LynxInteractiveAccessibilityOptions,
) {
  const scopeDisabled = useLynxInteractionDisabled();
  const disabled = scopeDisabled || (options.disabled ?? false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const state = { hovered, focused, pressed };
  const clearPressed = () => setPressed(false);
  return {
    disabled,
    className: lynxInteractiveClassName(options.baseClassName, state),
    eventProps: {
      ...lynxInteractiveAccessibilityProps(options),
      focusable: !disabled && (options.focusable ?? options.onActivate !== undefined),
      "aria-disabled": disabled,
      bindmouseenter: disabled
        ? undefined
        : () => {
            setHovered(true);
            options.onIntent?.();
          },
      bindmouseleave: disabled
        ? undefined
        : () => {
            setHovered(false);
            clearPressed();
          },
      bindmousedown: disabled ? undefined : () => setPressed(true),
      bindmouseup: disabled ? undefined : clearPressed,
      bindtouchstart: disabled ? undefined : () => setPressed(true),
      bindtouchend: disabled ? undefined : clearPressed,
      bindtouchcancel: disabled ? undefined : clearPressed,
      bindfocus: disabled
        ? undefined
        : () => {
            setFocused(
              options.programmaticFocusId
                ? !consumeProgrammaticLynxFocus(options.programmaticFocusId)
                : true,
            );
            options.onIntent?.();
          },
      bindblur: disabled
        ? undefined
        : () => {
            setFocused(false);
            clearPressed();
          },
      bindkeydown:
        disabled || !options.onActivate
          ? undefined
          : (event: { key: string; preventDefault?: () => void }) => {
              handleLynxActivationKey(event, options.onActivate!);
            },
      bindtap: disabled || !options.onActivate ? undefined : options.onActivate,
    },
  };
}
