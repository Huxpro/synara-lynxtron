// FILE: ComposerRuntimeModeControlComposition.tsx
// Purpose: Physical shared source for composer permission-mode visibility, order, and selection.

import { type RuntimeMode } from "@synara/contracts";

import {
  ComposerRuntimeFullAccessLabelElement,
  ComposerRuntimeModePopupElement,
  ComposerRuntimeModeTriggerElement,
  ComposerRuntimeRestrictedLabelElement,
} from "~/components/chat/ComposerRuntimeModeControlCompositionElements";
import { Menu, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "~/components/ui/menu";

export function ComposerRuntimeModeControlComposition(props: {
  readonly disabled?: boolean | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly runtimeMode?: RuntimeMode | undefined;
  readonly onRuntimeModeChange?: ((mode: RuntimeMode) => void) | undefined;
}) {
  if (!props.runtimeMode || !props.onRuntimeModeChange) {
    return null;
  }

  return (
    <Menu>
      <MenuTrigger
        disabled={props.disabled}
        render={
          <ComposerRuntimeModeTriggerElement
            hideLabel={props.hideLabel ?? false}
            runtimeMode={props.runtimeMode}
          />
        }
      />
      <ComposerRuntimeModePopupElement>
        <MenuRadioGroup
          value={props.runtimeMode}
          onValueChange={(value) => {
            if (value !== "full-access" && value !== "approval-required") {
              return;
            }
            if (value !== props.runtimeMode) {
              props.onRuntimeModeChange?.(value);
            }
          }}
        >
          <MenuRadioItem value="full-access">
            <ComposerRuntimeFullAccessLabelElement />
          </MenuRadioItem>
          <MenuRadioItem value="approval-required">
            <ComposerRuntimeRestrictedLabelElement />
          </MenuRadioItem>
        </MenuRadioGroup>
      </ComposerRuntimeModePopupElement>
    </Menu>
  );
}
