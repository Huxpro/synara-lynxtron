import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useRef, useState } from "@lynx-js/react";

import type { ThreadSummary } from "../../app/queries";
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

export function normalizeThreadTitleInput(value: string): string {
  return value.trim();
}

export function ThreadRenameDialogLynx(props: {
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (nextTitle: string) => Promise<void> | void;
  readonly open: boolean;
  readonly thread: ThreadSummary | null;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (!props.open) return;
    const initialValue = props.thread?.title ?? "";
    setValue(initialValue);
    setError(null);
    void inputRef.current
      ?.focus()
      .then(() => inputRef.current?.setSelectionRange(0, initialValue.length));
  }, [props.open, props.thread?.id]);
  const save = async () => {
    "background only";
    if (!props.thread || pending) return;
    const title = normalizeThreadTitleInput(value);
    if (!title || title === props.thread.title) {
      props.onOpenChange(false);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await props.onSave(title);
      props.onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to rename thread.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="AppSidebarThreadRenameDialog">
        <DialogTitle>Rename chat</DialogTitle>
        <DialogDescription>Keep it short and recognizable.</DialogDescription>
        <DialogPanel>
          <Input
            ref={inputRef}
            nativeInput
            value={value}
            aria-label="Thread title"
            disabled={pending}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault?.();
                void save();
              }
            }}
          />
          {error ? <text className="AppSidebarActionError">{error}</text> : null}
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending} onClick={() => void save()}>
            Save
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
