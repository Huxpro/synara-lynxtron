import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useRef, useState } from "@lynx-js/react";

import type { ProjectSummary } from "../../app/queries";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog.lynx";
import { Input } from "../ui/input.lynx";

export function normalizeProjectLocalNameInput(value: string): string {
  return value.trim();
}

export function ProjectRenameDialogLynx(props: {
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (nextName: string) => void;
  readonly open: boolean;
  readonly project: ProjectSummary | null;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (!props.open) return;
    const initialValue = props.project?.localName ?? props.project?.title ?? "";
    setValue(initialValue);
    void inputRef.current
      ?.focus()
      .then(() => inputRef.current?.setSelectionRange(0, initialValue.length));
  }, [props.open, props.project?.id]);
  const save = () => {
    if (!props.project) return;
    props.onSave(normalizeProjectLocalNameInput(value));
    props.onOpenChange(false);
  };
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="AppSidebarProjectRenameDialog">
        <DialogTitle>Rename project</DialogTitle>
        <DialogDescription>Keep it short and recognizable.</DialogDescription>
        <DialogPanel>
          <Input
            ref={inputRef}
            nativeInput
            value={value}
            placeholder={props.project?.folderName}
            aria-label="Project name"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault?.();
                save();
              }
            }}
          />
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
