// FILE: ComposerRuntimeModeControlCompositionElements.tsx
// Purpose: Web host elements for the physical shared composer permission control.

import { type RuntimeMode } from "@synara/contracts";
import { type ReactNode } from "react";
import { HiOutlineHandRaised } from "react-icons/hi2";

import { Button } from "~/components/ui/button";
import { ChevronDownIcon } from "~/lib/icons";
import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import {
  COMPOSER_PICKER_TRIGGER_TEXT_CLASS_NAME,
  RUNTIME_FULL_ACCESS_ACCENT_CLASS_NAME,
} from "./composerPickerStyles";
import { ComposerPickerMenuPopup } from "./ComposerPickerMenuPopup";

export function ComposerRuntimeModeTriggerElement(props: {
  readonly hideLabel: boolean;
  readonly runtimeMode: RuntimeMode;
}) {
  const fullAccess = props.runtimeMode === "full-access";
  return (
    <Button
      size="sm"
      variant="chrome"
      className={cn(
        "min-w-0 shrink-0 justify-start gap-1.5 whitespace-nowrap px-2 [&_svg]:mx-0 sm:px-2.5",
        COMPOSER_PICKER_TRIGGER_TEXT_CLASS_NAME,
        fullAccess && RUNTIME_FULL_ACCESS_ACCENT_CLASS_NAME,
      )}
      title={
        fullAccess
          ? "Full access — click to change permissions"
          : "Default permissions — click to change permissions"
      }
    >
      <span className="inline-flex items-center gap-1.5">
        {fullAccess ? (
          <CentralIcon name="shield-access" className="size-3.5 shrink-0" />
        ) : (
          <HiOutlineHandRaised className="size-3.5 shrink-0" />
        )}
        <span className={cn("truncate", props.hideLabel ? "sr-only" : "@max-[480px]:sr-only")}>
          {fullAccess ? "Full access" : "Default permissions"}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3 shrink-0 opacity-70",
            props.hideLabel ? "hidden" : "@max-[480px]:hidden",
          )}
        />
      </span>
    </Button>
  );
}

export function ComposerRuntimeModePopupElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return (
    <ComposerPickerMenuPopup align="start" side="top" className="min-w-44">
      {props.children}
    </ComposerPickerMenuPopup>
  );
}

export function ComposerRuntimeFullAccessLabelElement() {
  return (
    <span className="inline-flex items-center gap-2">
      <CentralIcon name="shield-access" className="size-4 shrink-0" />
      Full access
    </span>
  );
}

export function ComposerRuntimeRestrictedLabelElement() {
  return (
    <span className="inline-flex items-center gap-2">
      <HiOutlineHandRaised className="size-4 shrink-0" />
      Default permissions
    </span>
  );
}
