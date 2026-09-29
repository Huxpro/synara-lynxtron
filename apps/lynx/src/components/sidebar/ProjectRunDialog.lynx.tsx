import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useRef, useState } from "@lynx-js/react";
import playSvg from "@synara-central-icons/play.svg?raw";

import type { ProjectSummary } from "../../app/queries";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog.lynx";
import { Input } from "../ui/input.lynx";

export function normalizeProjectRunCommand(value: string): string {
  return value.trim();
}

export function ProjectRunDialogLynx(props: {
  readonly initialCommand: string;
  readonly loading: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRun: (command: string) => Promise<void>;
  readonly open: boolean;
  readonly project: ProjectSummary | null;
}) {
  const [command, setCommand] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);
  const editedRef = useRef(false);
  useEffect(() => {
    if (!props.open) return;
    editedRef.current = false;
    setCommand(props.initialCommand);
    setSubmitting(false);
    setError(null);
    void inputRef.current
      ?.focus()
      .then(() => inputRef.current?.setSelectionRange(0, props.initialCommand.length));
  }, [props.open, props.project?.id]);
  useEffect(() => {
    if (!props.open || editedRef.current) return;
    setCommand(props.initialCommand);
  }, [props.initialCommand, props.open]);
  const normalized = normalizeProjectRunCommand(command);
  const run = async () => {
    if (!props.project || !normalized || submitting || props.loading) return;
    setSubmitting(true);
    setError(null);
    try {
      await props.onRun(normalized);
      props.onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start the run command.");
      setSubmitting(false);
    }
  };
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="AppSidebarProjectRunDialog">
        <DialogHeader className="AppSidebarProjectRunHeader">
          <view className="AppSidebarProjectRunHeading">
            <svg
              className="AppSidebarProjectRunIcon"
              content={colorizeLynxSvg(playSvg, "var(--foreground)")}
            />
            <DialogTitle>Start dev</DialogTitle>
          </view>
          <DialogDescription>{props.project?.title ?? "Project"}</DialogDescription>
        </DialogHeader>
        <DialogPanel className="AppSidebarProjectRunPanel">
          <text className="AppSidebarProjectRunLabel">Command</text>
          <Input
            ref={inputRef}
            nativeInput
            value={command}
            placeholder="e.g. npm run dev"
            aria-label="Command"
            aria-invalid={!props.loading && normalized.length === 0}
            disabled={submitting}
            onChange={(event) => {
              editedRef.current = true;
              setCommand(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault?.();
                void run();
              }
            }}
          />
          {!props.loading && normalized.length === 0 ? (
            <text className="AppSidebarProjectRunError">Enter a command to run.</text>
          ) : null}
          {error ? <text className="AppSidebarProjectRunError">{error}</text> : null}
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!normalized || submitting || props.loading} onClick={() => void run()}>
            {submitting ? "Starting…" : "Run"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
