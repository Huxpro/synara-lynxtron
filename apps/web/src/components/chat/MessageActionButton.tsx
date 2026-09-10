// FILE: MessageActionButton.tsx
// Purpose: Shared icon button chrome for compact message actions.
// Layer: Web chat presentation component
// Exports: MessageActionButton

import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { IconButton } from "../ui/icon-button";
import type { TooltipPopup } from "../ui/tooltip";

export const MESSAGE_ACTION_ICON_CLASS_NAME = "size-[1.125em] opacity-100";

export const MESSAGE_ACTION_BUTTON_CLASS_NAME =
  "size-[1.75em] shrink-0 rounded-none border-0 bg-transparent p-0 font-system-ui font-normal leading-none text-[length:inherit] text-[var(--color-icon-secondary)] shadow-none transition-colors hover:bg-transparent [:hover,[data-pressed]]:bg-transparent data-pressed:bg-transparent hover:text-[var(--color-icon-secondary)] [:hover,[data-pressed]]:text-[var(--color-icon-secondary)] focus-visible:ring-0 disabled:cursor-default disabled:text-[var(--color-token-disabled-foreground)] [&_svg:not([class*='size-'])]:size-[1.125em] [&_svg]:opacity-100";

type MessageActionButtonProps = Omit<
  ComponentProps<"button">,
  "aria-label" | "children" | "title"
> & {
  children: ReactNode;
  label: string;
  tooltip: ReactNode;
  tooltipSide?: ComponentProps<typeof TooltipPopup>["side"];
};

export const MessageActionButton = forwardRef<HTMLButtonElement, MessageActionButtonProps>(
  function MessageActionButton(
    { children, className, label, tooltip, tooltipSide = "top", type = "button", ...props },
    ref,
  ) {
    return (
      <IconButton
        {...props}
        ref={ref}
        type={type}
        label={label}
        tooltip={tooltip}
        tooltipSide={tooltipSide}
        className={cn(MESSAGE_ACTION_BUTTON_CLASS_NAME, className)}
        size="icon-xs"
        variant="ghost"
      >
        {children}
      </IconButton>
    );
  },
);
