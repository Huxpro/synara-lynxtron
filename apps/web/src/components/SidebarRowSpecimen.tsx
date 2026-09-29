import type { ReactNode } from "react";
import { ArchiveIcon, FolderIcon, PinIcon, PlusIcon } from "~/lib/icons";
import { SidebarIconButton } from "./SidebarIconButton";
import { SidebarProjectSummary } from "./SidebarProjectSummary";
import { SidebarThreadRowPresentation } from "./SidebarThreadRowPresentation";
import { ThreadPinToggleButton } from "./ThreadPinToggleButton";

export type SidebarRowSpecimenState =
  | "default"
  | "hover"
  | "focus"
  | "pressed"
  | "active"
  | "active-hover"
  | "pinned";

function shellClass(kind: "project" | "thread", state: SidebarRowSpecimenState) {
  return `group/${kind === "project" ? "project-header" : "thread-row"} relative flex h-7 items-center rounded-lg px-2 ${
    kind === "thread" ? "ml-[18px]" : ""
  } ${state === "active" || state === "active-hover" ? "bg-[var(--sidebar-accent-active)]" : ""} ${
    state === "hover" || state === "active-hover" || state === "pressed"
      ? "bg-[var(--sidebar-accent)]"
      : ""
  } ${state === "focus" ? "ring-1 ring-inset ring-ring" : ""}`;
}

function Actions({ children, reveal }: { readonly children: ReactNode; readonly reveal: boolean }) {
  return (
    <div
      className={`ml-auto flex items-center gap-1 transition-opacity ${reveal ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 group-hover/project-header:pointer-events-auto group-hover/project-header:opacity-100 group-focus-within/project-header:pointer-events-auto group-focus-within/project-header:opacity-100 group-hover/thread-row:pointer-events-auto group-hover/thread-row:opacity-100 group-focus-within/thread-row:pointer-events-auto group-focus-within/thread-row:opacity-100"}`}
    >
      {children}
    </div>
  );
}

export function SidebarProjectRowSpecimen(props: {
  readonly state: SidebarRowSpecimenState;
  readonly variant?: "default" | "pinned" | "running";
  readonly onContextMenu?: (position: { readonly x: number; readonly y: number }) => void;
}) {
  const pinned = props.variant === "pinned" || props.state === "pinned";
  const running = props.variant === "running";
  const reveal =
    props.state === "hover" ||
    props.state === "focus" ||
    props.state === "pressed" ||
    props.state === "active-hover";
  return (
    <div className="w-64 bg-[var(--color-background-sidebar)] p-3">
      <div
        className={shellClass("project", props.state)}
        onContextMenu={
          props.onContextMenu
            ? (event) => {
                event.preventDefault();
                props.onContextMenu?.({ x: event.clientX, y: event.clientY });
              }
            : undefined
        }
      >
        <button
          type="button"
          aria-label={pinned ? "Unpin project" : "Pin project"}
          className={`absolute left-2 flex size-4 items-center justify-center text-[var(--color-icon-secondary)] ${reveal || pinned ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <PinIcon className="size-3.5" />
        </button>
        <SidebarProjectSummary
          leading={<FolderIcon className="size-4" />}
          leadingClassName={reveal || pinned ? "opacity-0" : undefined}
          name="Synara"
        />
        <Actions reveal={reveal}>
          <SidebarIconButton icon={PlusIcon} label="New thread" />
          <SidebarIconButton icon={ArchiveIcon} label="Archive project" />
        </Actions>
        {running ? (
          <span
            className={`size-1.5 rounded-full bg-emerald-400 ${reveal ? "opacity-0" : "group-hover/project-header:opacity-0 group-focus-within/project-header:opacity-0"}`}
            aria-label="Dev server running"
          />
        ) : null}
      </div>
    </div>
  );
}

export function SidebarThreadRowSpecimen(props: {
  readonly state: SidebarRowSpecimenState;
  readonly variant?: "active" | "default" | "pinned";
  readonly onContextMenu?: (position: { readonly x: number; readonly y: number }) => void;
}) {
  const active =
    props.variant === "active" || props.state === "active" || props.state === "active-hover";
  const pinned = props.variant === "pinned" || props.state === "pinned";
  const reveal =
    props.state === "hover" ||
    props.state === "focus" ||
    props.state === "pressed" ||
    props.state === "active-hover";
  return (
    <div className="w-64 bg-[var(--color-background-sidebar)] p-3">
      <div
        className={shellClass("thread", props.state)}
        onContextMenu={
          props.onContextMenu
            ? (event) => {
                event.preventDefault();
                props.onContextMenu?.({ x: event.clientX, y: event.clientY });
              }
            : undefined
        }
      >
        <SidebarThreadRowPresentation active={active} title="Component fidelity" />
        <Actions reveal={reveal || pinned}>
          <ThreadPinToggleButton pinned={pinned} presentation="inline" onToggle={() => {}} />
          <SidebarIconButton icon={ArchiveIcon} label="Archive thread" />
        </Actions>
      </div>
    </div>
  );
}
