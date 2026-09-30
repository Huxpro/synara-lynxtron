// FILE: ComposerInputCompositionElements.tsx
// Purpose: Web host elements for the physical shared composer chrome.

import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { ComposerSendArrowIcon } from "~/lib/icons";
import { Button } from "../ui/button";
import {
  COMPOSER_EDITOR_PADDING_CLASS_NAME,
  COMPOSER_FOOTER_ROW_CLASS_NAME,
  COMPOSER_INPUT_SHELL_CLASS_NAME,
  COMPOSER_INPUT_SURFACE_CLASS_NAME,
} from "./composerPickerStyles";

interface ComposerHostElementProps {
  readonly children?: ReactNode | undefined;
}

export function ComposerInputShellElement(
  props: ComposerHostElementProps & {
    readonly focused: boolean;
    readonly overflowVisible: boolean;
    readonly providerClassName?: string | undefined;
  },
) {
  return (
    <div
      data-composer-focused={props.focused ? "true" : undefined}
      className={cn(
        COMPOSER_INPUT_SHELL_CLASS_NAME,
        props.providerClassName,
        props.overflowVisible && "overflow-visible",
      )}
    >
      {props.children}
    </div>
  );
}

export function ComposerInputSurfaceElement(
  props: ComposerHostElementProps & {
    readonly focused: boolean;
    readonly overflowVisible: boolean;
    readonly providerClassName?: string | undefined;
  },
) {
  return (
    <div
      data-composer-focused={props.focused ? "true" : undefined}
      className={cn(
        COMPOSER_INPUT_SURFACE_CLASS_NAME,
        props.providerClassName,
        props.overflowVisible && "overflow-visible",
      )}
    >
      {props.children}
    </div>
  );
}

export function ComposerEditorRegionElement(
  props: ComposerHostElementProps & { readonly overflowVisible: boolean },
) {
  return (
    <div
      className={cn(
        COMPOSER_EDITOR_PADDING_CLASS_NAME,
        props.overflowVisible && "overflow-visible",
      )}
    >
      {props.children}
    </div>
  );
}

export function ComposerFooterRowElement(
  props: ComposerHostElementProps & { readonly compact: boolean },
) {
  return (
    <div
      data-chat-composer-footer="true"
      className={cn(
        "@container",
        COMPOSER_FOOTER_ROW_CLASS_NAME,
        props.compact ? "gap-1.5" : "flex-wrap gap-1.5 sm:flex-nowrap sm:gap-0",
      )}
    >
      {props.children}
    </div>
  );
}

export function ComposerFooterLeadingElement(
  props: ComposerHostElementProps & {
    readonly compact: boolean;
    readonly voiceBusy: boolean;
  },
) {
  return (
    <div
      data-chat-composer-leading="true"
      className={cn(
        "flex items-center",
        props.voiceBusy
          ? "min-w-0 shrink-0 gap-1"
          : props.compact
            ? "min-w-0 flex-1 gap-1 overflow-hidden"
            : "min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:min-w-max sm:overflow-visible",
      )}
    >
      {props.children}
    </div>
  );
}

export function ComposerFooterActionsElement(
  props: ComposerHostElementProps & { readonly compact: boolean; readonly voiceBusy: boolean },
) {
  return (
    <div
      data-chat-composer-actions="right"
      className={cn(
        "flex items-center",
        props.compact ? "gap-0.5" : "gap-2",
        props.voiceBusy ? "min-w-0 flex-1" : "shrink-0",
      )}
    >
      {props.children}
    </div>
  );
}

export function ComposerPrimaryActionElement(props: {
  readonly accessibleLabel?: string | undefined;
  readonly disabled: boolean;
  readonly mode: "send" | "sending" | "stop";
  readonly onActivate: () => void;
}) {
  const isStop = props.mode === "stop";
  const isSending = props.mode === "sending";
  const label =
    props.accessibleLabel ?? (isStop ? "Stop generation" : isSending ? "Sending" : "Send message");

  return (
    <Button
      type={isStop ? "button" : "submit"}
      variant="prominent"
      size="icon-xs"
      className={isStop ? "sm:size-[26px]" : "size-7 rounded-full sm:size-7"}
      disabled={props.disabled}
      onClick={isStop ? props.onActivate : undefined}
      aria-label={label}
      title={isStop ? "Stop the current response. On Mac, press Ctrl+C to interrupt." : undefined}
    >
      {isStop ? (
        <span aria-hidden="true" className="block size-2 rounded-[1px] bg-current" />
      ) : isSending ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          className="animate-spin"
          aria-hidden="true"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="20 12"
          />
        </svg>
      ) : (
        <ComposerSendArrowIcon aria-hidden="true" className="size-5 shrink-0" />
      )}
    </Button>
  );
}
