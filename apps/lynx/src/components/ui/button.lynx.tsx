import { Button as LynxButton, type ButtonProps as LynxButtonProps } from "@lynx-js/lynx-ui";
import type { ReactNode } from "@lynx-js/react";

import { cx, renderSlot, textContent } from "./shared.lynx";
import "./primitives.css";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "prominent"
  | "outline"
  | "primary-outline"
  | "secondary-outline"
  | "destructive-outline"
  | "chrome-outline"
  | "ghost"
  | "chrome"
  | "subtle"
  | "link";

export type ButtonSize =
  | "chip"
  | "xs"
  | "sm"
  | "default"
  | "lg"
  | "xl"
  | "icon-chip"
  | "icon-xs"
  | "icon-sm"
  | "icon"
  | "icon-lg"
  | "icon-xl";

export interface ButtonProps extends Omit<LynxButtonProps, "children" | "className" | "onClick"> {
  children?: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: "default" | "capsule";
  onClick?: (event: LynxButtonClickEvent) => void;
  render?: ReactNode;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
}

export interface LynxButtonClickEvent {
  readonly defaultPrevented: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

function createButtonClickEvent(): LynxButtonClickEvent {
  let defaultPrevented = false;
  return {
    get defaultPrevented() {
      return defaultPrevented;
    },
    preventDefault() {
      defaultPrevented = true;
    },
    // The Lynx primitive owns the native tap listener, so there is no DOM
    // bubbling chain to cancel. Preserve the Web call-site contract as a no-op.
    stopPropagation() {},
  };
}

export function buttonVariants(
  input: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: "default" | "capsule";
    className?: string;
  } = {},
): string {
  return cx(
    "LxButton",
    `LxButton--${input.variant ?? "default"}`,
    `LxButton--variant-${input.variant ?? "default"}`,
    `LxButton--${input.size ?? "default"}`,
    input.shape === "capsule" && "LxButton--capsule",
    input.className,
  );
}

export function Button({
  children,
  className,
  variant,
  size,
  shape,
  onClick,
  render,
  type: _type,
  buttonProps,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const handleClick = () => {
    "background only";
    onClick?.(createButtonClickEvent());
  };
  const existingAccessibilityState = buttonProps?.["accessibility-state"];
  const accessibilityElement = buttonProps?.["accessibility-element"] ?? true;
  const accessibilityTrait =
    buttonProps?.["accessibility-trait"] ??
    (accessibilityElement ? ("button" as const) : undefined);
  const accessibilityState = disabled
    ? {
        ...(typeof existingAccessibilityState === "object" && existingAccessibilityState !== null
          ? existingAccessibilityState
          : {}),
        disabled: true,
      }
    : existingAccessibilityState;
  return (
    <LynxButton
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={buttonVariants({ className, variant, size, shape })}
      buttonProps={{
        ...buttonProps,
        "accessibility-element": accessibilityElement,
        ...(accessibilityTrait ? { "accessibility-trait": accessibilityTrait } : {}),
        ...(accessibilityState ? { "accessibility-state": accessibilityState } : {}),
        ...(ariaLabel
          ? {
              "accessibility-label": ariaLabel,
            }
          : {}),
      }}
    >
      {renderSlot(render, textContent(children, "LxButton__text"))}
    </LynxButton>
  );
}

export const dialogActionButtonClassName = "LxButton--dialog-action";
export const headerButtonDarkBorderClassName = "LxButton--header-border";
