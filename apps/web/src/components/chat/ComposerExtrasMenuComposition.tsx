// FILE: ComposerExtrasMenuComposition.tsx
// Purpose: Physical shared source for the composer extras menu anatomy and state.
// Platform Elements own the host trigger, image picker, labels, and popup shells.

import { type ProviderInteractionMode } from "@synara/contracts";
import { useState } from "react";

import {
  ComposerExtrasFastLabelElement,
  ComposerExtrasImageItemElement,
  ComposerExtrasMenuTriggerHostElement,
  ComposerExtrasMenuPopupElement,
  ComposerExtrasPlanLabelElement,
  ComposerExtrasSubPopupElement,
} from "~/components/chat/ComposerExtrasMenuCompositionElements";
import {
  Menu,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "~/components/ui/menu";

export function ComposerExtrasMenuComposition(props: {
  readonly interactionMode: ProviderInteractionMode;
  readonly supportsFastMode: boolean;
  readonly fastModeEnabled: boolean;
  readonly imageAttachmentsAvailable?: boolean | undefined;
  readonly onPickAttachments?: (() => void) | undefined;
  readonly onAddPhotos: (files: File[]) => void;
  readonly onToggleFastMode: () => void;
  readonly onSetPlanMode: (enabled: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Menu open={open} onOpenChange={setOpen}>
      <ComposerExtrasMenuTriggerHostElement open={open} />
      <ComposerExtrasMenuPopupElement>
        <ComposerExtrasImageItemElement
          available={props.imageAttachmentsAvailable ?? true}
          onPickAttachments={props.onPickAttachments}
          onAddPhotos={props.onAddPhotos}
        />

        <MenuSeparator />
        <MenuCheckboxItem
          checked={props.interactionMode === "plan"}
          variant="switch"
          onCheckedChange={(checked) => {
            props.onSetPlanMode(checked === true);
          }}
        >
          <ComposerExtrasPlanLabelElement />
        </MenuCheckboxItem>

        {props.supportsFastMode ? (
          <>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger>
                <ComposerExtrasFastLabelElement />
              </MenuSubTrigger>
              <ComposerExtrasSubPopupElement>
                <MenuRadioGroup
                  value={props.fastModeEnabled ? "fast" : "normal"}
                  onValueChange={(value) => {
                    const shouldEnableFast = value === "fast";
                    if (shouldEnableFast === props.fastModeEnabled) return;
                    props.onToggleFastMode();
                  }}
                >
                  <MenuRadioItem value="normal">Default</MenuRadioItem>
                  <MenuRadioItem value="fast">Fast</MenuRadioItem>
                </MenuRadioGroup>
              </ComposerExtrasSubPopupElement>
            </MenuSub>
          </>
        ) : null}
      </ComposerExtrasMenuPopupElement>
    </Menu>
  );
}
