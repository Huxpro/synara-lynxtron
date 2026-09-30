import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

interface ChildrenProps {
  readonly children?: ReactNode | undefined;
}

export function SidebarSegmentedPickerFrameElement({ children }: ChildrenProps) {
  return <div className="px-3 pt-0.5 pb-2.5">{children}</div>;
}

export function SidebarSegmentedPickerTrackElement({ children }: ChildrenProps) {
  return (
    <div className="sidebar-segmented-picker relative isolate inline-flex w-full rounded-lg p-0.5">
      {children}
    </div>
  );
}

export function SidebarSegmentedPickerThumbElement({
  hidden,
  left,
  width,
}: {
  readonly hidden: boolean;
  readonly left: string;
  readonly width: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "sidebar-segmented-thumb pointer-events-none absolute -inset-y-[1.5px] z-0 rounded-md transition-[left,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        hidden && "opacity-0",
      )}
      style={{ left, width }}
    />
  );
}

export function SidebarSegmentButtonElement({
  active,
  onPrewarm,
  onActivate,
  children,
}: ChildrenProps & {
  readonly active: boolean;
  readonly onPrewarm: () => void;
  readonly onActivate: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative z-10 flex-1 rounded-md px-2.5 py-0.5 text-ui-sm font-medium transition-colors duration-200",
        active
          ? "text-[var(--color-text-foreground)]"
          : "text-[var(--color-text-foreground-secondary)] hover:text-[var(--color-text-foreground)]",
      )}
      onPointerEnter={onPrewarm}
      onClick={onActivate}
    >
      {children}
    </button>
  );
}

export function SidebarSegmentLabelElement({
  translateX,
  children,
}: ChildrenProps & { readonly translateX: string }) {
  return (
    <span
      className="block transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ transform: `translateX(${translateX})` }}
    >
      {children}
    </span>
  );
}
