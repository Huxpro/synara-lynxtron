import type { ReactNode } from "react";

import { ChevronDownIcon, FastModeIcon, SettingsIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { PROVIDER_ICON_COMPONENT_BY_PROVIDER } from "../ProviderIcon";
import {
  COMPOSER_MUTED_ACCENT_TEXT_CLASS_NAME,
} from "./composerPickerStyles";
import { getProviderIconClassName } from "./ProviderModelPicker";

export function ComposerModelTriggerFrameElement(props: {
  readonly children: ReactNode;
}) {
  return <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">{props.children}</span>;
}

export function ComposerModelTriggerProviderIconElement(props: {
  readonly provider: string;
}) {
  const ProviderIcon =
    PROVIDER_ICON_COMPONENT_BY_PROVIDER[
      props.provider as keyof typeof PROVIDER_ICON_COMPONENT_BY_PROVIDER
    ];
  return ProviderIcon ? (
    <ProviderIcon
      aria-hidden="true"
      className={cn(
        "size-3.5 shrink-0 opacity-100",
        getProviderIconClassName(
          props.provider as keyof typeof PROVIDER_ICON_COMPONENT_BY_PROVIDER,
          "text-[var(--color-text-foreground)]",
        ),
      )}
    />
  ) : null;
}

export function ComposerModelTriggerModelLabelElement(props: {
  readonly children: ReactNode;
  readonly hidden: boolean;
}) {
  return props.hidden ? (
    <span className="sr-only">{props.children}</span>
  ) : (
    <span className="min-w-0 truncate text-[var(--color-text-foreground)]">{props.children}</span>
  );
}

export function ComposerModelTriggerFastBadgeElement() {
  return (
    <FastModeIcon
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", COMPOSER_MUTED_ACCENT_TEXT_CLASS_NAME)}
    />
  );
}

export function ComposerModelTriggerStatusIconElement(props: {
  readonly accessibleLabel: string;
}) {
  return (
    <>
      <SettingsIcon
        aria-hidden="true"
        data-slot="composer-traits-status-icon"
        className={cn("size-3.5 shrink-0", COMPOSER_MUTED_ACCENT_TEXT_CLASS_NAME)}
      />
      <span className="sr-only">{props.accessibleLabel}</span>
    </>
  );
}

export function ComposerModelTriggerStatusLabelElement(props: {
  readonly children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 text-[10px] leading-[15px]",
        COMPOSER_MUTED_ACCENT_TEXT_CLASS_NAME,
      )}
    >
      {props.children}
    </span>
  );
}

export function ComposerModelTriggerChevronElement() {
  return <ChevronDownIcon aria-hidden="true" className="ms-0.5 size-3 shrink-0 opacity-60" />;
}
