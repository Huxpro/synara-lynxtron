// FILE: ComposerExtrasMenuCompositionElements.tsx
// Purpose: Web host elements for the physical shared composer extras menu.

import { useRef, type ChangeEvent, type ReactNode } from "react";
import { GoTasklist } from "react-icons/go";

import { PaperclipIcon, PlusIcon } from "~/lib/icons";
import { Button } from "../ui/button";
import { MenuItem, MenuTrigger } from "../ui/menu";
import {
  ComposerPickerMenuPopup,
  ComposerPickerMenuSubPopup,
} from "./ComposerPickerMenuPopup";

export function ComposerExtrasMenuTriggerElement() {
  return (
    <Button
      size="icon-sm"
      variant="chrome"
      className="shrink-0 rounded-md"
      aria-label="Composer extras"
    >
      <PlusIcon aria-hidden="true" className="size-4" />
    </Button>
  );
}

export function ComposerExtrasMenuTriggerHostElement(props: { readonly open: boolean }) {
  return (
    <MenuTrigger
      render={
        <Button
          size="icon-sm"
          variant="chrome"
          className="shrink-0 rounded-md"
          aria-label="Composer extras"
          aria-expanded={props.open}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </Button>
      }
    />
  );
}

export function ComposerExtrasMenuPopupElement(props: {
  readonly children?: ReactNode;
}) {
  return <ComposerPickerMenuPopup align="start">{props.children}</ComposerPickerMenuPopup>;
}

export function ComposerExtrasSubPopupElement(props: {
  readonly children?: ReactNode;
}) {
  return <ComposerPickerMenuSubPopup>{props.children}</ComposerPickerMenuSubPopup>;
}

export function ComposerExtrasImageItemElement(props: {
  readonly available: boolean;
  readonly onPickAttachments?: (() => void) | undefined;
  readonly onAddPhotos: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      props.onAddPhotos(files);
    }
    event.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        data-testid="composer-photo-input"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFileInputChange}
      />
      <MenuItem
        disabled={!props.available}
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        <PaperclipIcon className="size-4 shrink-0" />
        Add image
      </MenuItem>
    </>
  );
}

export function ComposerExtrasPlanLabelElement() {
  return (
    <span className="inline-flex items-center gap-2">
      <GoTasklist className="size-4 shrink-0" />
      Plan mode
    </span>
  );
}

export function ComposerExtrasFastLabelElement() {
  return <>Fast</>;
}
